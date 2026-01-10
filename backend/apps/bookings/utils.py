from django.utils import timezone
from django.db.models import Q
from datetime import datetime, time, timedelta
from .models import StudioConfig, Wheel, Booking, Package, WheelBooking


def get_available_wheels_for_timeslot(date, start_time, end_time=None, require_wheel=True):
    """
    Get available wheels for a specific date and time slot
    
    Args:
        date: Date of booking
        start_time: Start time of session
        end_time: End time of session (if None, calculate from default duration)
        require_wheel: Whether wheels are needed
    
    Returns:
        QuerySet of available Wheel objects
    """
    if not require_wheel:
        return Wheel.objects.none()
    
    config = StudioConfig.get_config()
    
    # Get all active available wheels
    all_wheels = Wheel.objects.filter(
        is_active=True,
        status='available'
    ).order_by('wheel_number')
    
    # If no end_time provided, use default duration
    if not end_time:
        from datetime import datetime as dt
        start_dt = dt.combine(date, start_time)
        end_dt = start_dt + timedelta(minutes=config.wheel_session_duration)
        end_time = end_dt.time()
    
    # Get wheels that are already booked during this timeslot
    overlapping_bookings = Booking.objects.filter(
        booked_date=date,
        payment_status__in=['confirmed', 'pending'],
        package__requires_wheel=True,
    ).filter(
        # Time overlap condition
        Q(session_start__lt=end_time, session_end__gt=start_time) |
        Q(session_start__lte=start_time, session_end__gte=end_time) |
        Q(session_start__gte=start_time, session_end__lte=end_time)
    )
    
    # Get all wheel bookings for these overlapping bookings
    booked_wheel_ids = WheelBooking.objects.filter(
        booking__in=overlapping_bookings
    ).values_list('wheel_id', flat=True).distinct()
    
    # Also exclude wheels that are in maintenance or reserved
    unavailable_wheels = Wheel.objects.filter(
        Q(status='maintenance') | Q(status='reserved') | Q(is_active=False)
    ).values_list('id', flat=True)
    
    all_unavailable = set(list(booked_wheel_ids) + list(unavailable_wheels))
    
    # Filter out unavailable wheels
    available_wheels = all_wheels.exclude(id__in=all_unavailable)
    
    return available_wheels[:config.total_wheels]


def check_wheel_availability(date, start_time, end_time, num_people_needed, exclude_booking=None):
    """
    Check wheel availability for a specific timeslot
    
    Args:
        date: Booking date
        start_time: Session start time
        end_time: Session end time
        num_people_needed: Number of wheels needed
        exclude_booking: Booking to exclude from check (for updates)
    
    Returns:
        dict with availability information
    """
    config = StudioConfig.get_config()
    
    # Get available wheels
    available_wheels = get_available_wheels_for_timeslot(date, start_time, end_time, require_wheel=True)
    
    # If excluding a booking, add its wheels back to availability
    if exclude_booking and exclude_booking.pk:
        # Get wheels assigned to this booking
        booked_wheels = exclude_booking.assigned_wheels.all()
        available_wheels = available_wheels | booked_wheels
        available_wheels = available_wheels.distinct().order_by('wheel_number')
    
    available_count = available_wheels.count()
    is_available = available_count >= num_people_needed
    
    return {
        'date': date,
        'start_time': start_time,
        'end_time': end_time,
        'total_wheels': config.total_wheels,
        'available_wheels': available_count,
        'wheels_needed': num_people_needed,
        'is_available': is_available,
        'available_wheel_list': list(available_wheels.values_list('wheel_number', flat=True)),
        'available_wheel_details': [
            {'id': w.id, 'wheel_number': w.wheel_number, 'name': w.name}
            for w in available_wheels[:num_people_needed]
        ]
    }


def get_available_time_slots_for_package(package, date, num_people=1):
    """
    Get available time slots for a specific package on a given date
    
    Args:
        package: Package object
        date: Date to check
        num_people: Number of people in booking
    
    Returns:
        List of available time slots
    """
    config = StudioConfig.get_config()
    
    # Check if date is valid
    if date < timezone.now().date():
        return []
    
    # Check if studio is open
    if not config.is_open_today:
        return []
    
    # Generate time slots based on package type
    if package.has_fixed_duration:
        # For fixed duration packages (P1, P2)
        return get_fixed_duration_slots(package, date, num_people, config)
    else:
        # For unlimited packages (P3, P5, P6, P7)
        return get_unlimited_package_slots(package, date, num_people, config)


def get_fixed_duration_slots(package, date, num_people, config):
    """
    Get available slots for fixed duration packages
    
    Returns slots at intervals (e.g., every 30 minutes) that can accommodate
    the package duration with wheels available
    """
    slots = []
    
    # Calculate slot interval (30 minutes)
    interval_minutes = 30
    current_time = datetime.combine(date, config.operating_time)
    closing_dt = datetime.combine(date, config.closing_time)
    
    # Calculate session duration in minutes
    duration_minutes = int(float(package.fixed_duration_hours) * 60)
    
    while current_time < closing_dt:
        slot_start = current_time.time()
        slot_end_dt = current_time + timedelta(minutes=duration_minutes)
        
        # Check if session would end after closing
        if slot_end_dt.time() > config.closing_time:
            current_time += timedelta(minutes=interval_minutes)
            continue
        
        # Check wheel availability for wheel packages
        if package.requires_wheel:
            availability = check_wheel_availability(
                date, slot_start, slot_end_dt.time(), num_people
            )
            
            if not availability['is_available']:
                current_time += timedelta(minutes=interval_minutes)
                continue
        
        # Check if this time overlaps with any buffer time from previous bookings
        if not is_time_slot_available_with_buffer(date, slot_start, slot_end_dt.time(), config):
            current_time += timedelta(minutes=interval_minutes)
            continue
        
        # Add slot if available
        slots.append({
            'start_time': slot_start,
            'end_time': slot_end_dt.time(),
            'duration_minutes': duration_minutes,
            'duration_display': package.get_session_duration_display(),
            'display': f"{slot_start.strftime('%I:%M %p')} - {slot_end_dt.time().strftime('%I:%M %p')} ({package.fixed_duration_hours} hour{'s' if float(package.fixed_duration_hours) > 1 else ''})"
        })
        
        current_time += timedelta(minutes=interval_minutes)
    
    return slots


def get_unlimited_package_slots(package, date, num_people, config):
    """
    Get available slots for unlimited duration packages
    
    For unlimited packages, customers can start anytime during operating hours
    """
    slots = []
    
    # For unlimited packages, we just need to check if they can start at a given time
    interval_minutes = 30
    current_time = datetime.combine(date, config.operating_time)
    closing_dt = datetime.combine(date, config.closing_time)
    
    # Calculate max end time based on package max duration or closing time
    max_duration_minutes = 8 * 60  # Default 8 hours if no max specified
    if package.max_duration_hours:
        max_duration_minutes = int(float(package.max_duration_hours) * 60)
    
    while current_time < closing_dt:
        slot_start = current_time.time()
        
        # Calculate potential end time
        end_dt = current_time + timedelta(minutes=max_duration_minutes)
        slot_end = min(end_dt.time(), config.closing_time)
        
        # For wheel packages, check availability
        if package.requires_wheel:
            # Check if there's at least 1 hour of wheel availability
            check_end_dt = current_time + timedelta(hours=1)
            check_end = min(check_end_dt.time(), config.closing_time)
            
            availability = check_wheel_availability(
                date, slot_start, check_end, num_people
            )
            
            if not availability['is_available']:
                current_time += timedelta(minutes=interval_minutes)
                continue
        
        # Check buffer time
        if not is_time_slot_available_with_buffer(date, slot_start, slot_end, config):
            current_time += timedelta(minutes=interval_minutes)
            continue
        
        # Add slot
        slots.append({
            'start_time': slot_start,
            'end_time': slot_end,
            'duration_minutes': max_duration_minutes,
            'duration_display': package.get_session_duration_display(),
            'display': f"{slot_start.strftime('%I:%M %p')} - Flexible duration"
        })
        
        current_time += timedelta(minutes=interval_minutes)
    
    return slots


def is_time_slot_available_with_buffer(date, start_time, end_time, config):
    """
    Check if a time slot is available considering buffer times between sessions
    
    Args:
        date: Booking date
        start_time: Slot start time
        end_time: Slot end time
        config: StudioConfig object
    
    Returns:
        bool: True if slot is available with buffers
    """
    buffer_minutes = config.buffer_minutes_between_sessions
    
    # Calculate buffer times
    buffer_start = (datetime.combine(date, start_time) - timedelta(minutes=buffer_minutes)).time()
    buffer_end = (datetime.combine(date, end_time) + timedelta(minutes=buffer_minutes)).time()
    
    # Check for overlapping bookings with buffer
    overlapping_bookings = Booking.objects.filter(
        booked_date=date,
        payment_status__in=['confirmed', 'pending'],
    ).filter(
        # Check for time overlap including buffer
        Q(session_start__lt=buffer_end, session_end__gt=buffer_start)
    ).exclude(
        # Exclude bookings that don't require precise timing
        package__has_fixed_duration=False
    )
    
    return not overlapping_bookings.exists()


def assign_wheels_to_booking(booking, wheel_numbers=None):
    """
    Assign wheels to a booking
    
    Args:
        booking: Booking instance
        wheel_numbers: List of specific wheel numbers to assign (optional)
    
    Returns:
        List of assigned Wheel objects
    """
    if not booking.package.requires_wheel:
        return []
    
    # Get available wheels for this timeslot
    available_wheels = get_available_wheels_for_timeslot(
        booking.booked_date,
        booking.session_start,
        booking.session_end,
        require_wheel=True
    )
    
    if wheel_numbers:
        # Try to assign specific wheels
        wheels_to_assign = Wheel.objects.filter(
            wheel_number__in=wheel_numbers,
            is_active=True,
            status='available'
        )
        
        # Verify all requested wheels are available
        for wheel in wheels_to_assign:
            if wheel not in available_wheels:
                raise ValueError(f"Wheel {wheel.wheel_number} is not available")
    else:
        # Auto-assign first available wheels
        wheels_needed = min(booking.number_of_people, available_wheels.count())
        wheels_to_assign = available_wheels[:wheels_needed]
    
    # Clear existing assignments and create new ones
    booking.wheel_bookings.all().delete()
    
    assigned_wheels = []
    for wheel in wheels_to_assign:
        wheel_booking = WheelBooking.objects.create(
            booking=booking,
            wheel=wheel,
            wheel_start_time=booking.session_start,
            wheel_end_time=booking.session_end if booking.package.is_wheel_package else None
        )
        assigned_wheels.append(wheel)
    
    return assigned_wheels


def get_daily_schedule(date):
    """
    Get daily schedule with all bookings and availability
    
    Args:
        date: Date to get schedule for
    
    Returns:
        dict with schedule information
    """
    config = StudioConfig.get_config()
    
    # Get all bookings for the day
    bookings = Booking.objects.filter(
        booked_date=date,
        payment_status__in=['confirmed', 'pending']
    ).select_related('package').prefetch_related('assigned_wheels').order_by('session_start')
    
    # Get all wheels
    all_wheels = Wheel.objects.filter(is_active=True).order_by('wheel_number')
    
    # Generate time slots for the day
    time_slots = []
    current_time = datetime.combine(date, config.operating_time)
    closing_dt = datetime.combine(date, config.closing_time)
    interval_minutes = 30
    
    while current_time < closing_dt:
        slot_start = current_time.time()
        slot_end_dt = current_time + timedelta(minutes=interval_minutes)
        slot_end = slot_end_dt.time() if slot_end_dt.time() <= config.closing_time else config.closing_time
        
        # Check which bookings are in this slot
        slot_bookings = []
        for booking in bookings:
            if (booking.session_start < slot_end and 
                (booking.session_end or config.closing_time) > slot_start):
                slot_bookings.append({
                    'id': booking.id,
                    'reference': booking.booking_reference,
                    'customer': booking.customer_name,
                    'package': booking.package.name,
                    'start': booking.session_start,
                    'end': booking.session_end,
                    'wheels': list(booking.assigned_wheels.values_list('wheel_number', flat=True))
                })
        
        # Check wheel availability
        available_wheels = get_available_wheels_for_timeslot(
            date, slot_start, slot_end, require_wheel=True
        )
        
        time_slots.append({
            'time': f"{slot_start.strftime('%I:%M %p')} - {slot_end.strftime('%I:%M %p')}",
            'start_time': slot_start,
            'end_time': slot_end,
            'bookings': slot_bookings,
            'available_wheels': available_wheels.count(),
            'available_wheel_numbers': list(available_wheels.values_list('wheel_number', flat=True)),
            'is_available': available_wheels.count() > 0
        })
        
        current_time = slot_end_dt
    
    return {
        'date': date,
        'operating_hours': {
            'open': config.operating_time,
            'close': config.closing_time
        },
        'total_wheels': config.total_wheels,
        'active_wheels': all_wheels.filter(status='available').count(),
        'maintenance_wheels': all_wheels.filter(status='maintenance').count(),
        'bookings_count': bookings.count(),
        'time_slots': time_slots,
        'all_bookings': [
            {
                'id': b.id,
                'reference': b.booking_reference,
                'customer': b.customer_name,
                'package': b.package.name,
                'start': b.session_start,
                'end': b.session_end,
                'people': b.number_of_people,
                'status': b.payment_status,
                'wheels': list(b.assigned_wheels.values_list('wheel_number', flat=True))
            }
            for b in bookings
        ]
    }


def check_booking_availability(date, start_time, package, num_people=1, exclude_booking=None):
    """
    Comprehensive availability check for a booking
    
    Args:
        date: Booking date
        start_time: Session start time
        package: Package object
        num_people: Number of people
        exclude_booking: Booking to exclude (for updates)
    
    Returns:
        dict with availability details
    """
    config = StudioConfig.get_config()
    
    # Basic validation
    if date < timezone.now().date():
        return {
            'is_available': False,
            'reason': 'Cannot book a date in the past'
        }
    
    if start_time < config.operating_time or start_time > config.closing_time:
        return {
            'is_available': False,
            'reason': f'Studio is open from {config.operating_time.strftime("%I:%M %p")} to {config.closing_time.strftime("%I:%M %p")}'
        }
    
    if num_people > package.max_participants:
        return {
            'is_available': False,
            'reason': f'Maximum {package.max_participants} people allowed for {package.name}'
        }
    
    # Calculate end time
    end_time = package.calculate_end_time(start_time, date)
    
    # Check wheel availability if needed
    if package.requires_wheel:
        wheel_availability = check_wheel_availability(
            date, start_time, end_time, num_people, exclude_booking
        )
        
        if not wheel_availability['is_available']:
            return {
                'is_available': False,
                'reason': f'Not enough wheels available. {wheel_availability["available_wheels"]} available, {num_people} needed.',
                'wheel_availability': wheel_availability
            }
        
        # Check buffer times for wheel packages
        if not is_time_slot_available_with_buffer(date, start_time, end_time, config):
            return {
                'is_available': False,
                'reason': 'Time slot not available due to buffer requirements'
            }
    
    # Check max daily sessions
    daily_bookings = Booking.objects.filter(
        booked_date=date,
        payment_status__in=['confirmed', 'pending']
    ).count()
    
    if daily_bookings >= config.max_daily_sessions:
        return {
            'is_available': False,
            'reason': f'Maximum daily sessions ({config.max_daily_sessions}) reached'
        }
    
    return {
        'is_available': True,
        'date': date,
        'start_time': start_time,
        'end_time': end_time,
        'package': package.name,
        'num_people': num_people,
        'duration': package.get_session_duration_display(),
        'wheel_available': package.requires_wheel
    }


def get_bookings_for_customer(phone, email=None):
    """
    Get all bookings for a customer
    
    Args:
        phone: Customer phone number
        email: Customer email (optional)
    
    Returns:
        QuerySet of bookings
    """
    query = Q(customer_phone=phone)
    if email:
        query |= Q(customer_email=email)
    
    return Booking.objects.filter(query).select_related('package').order_by('-booked_date', '-session_start')

def can_cancel_booking(booking):
    """Check if a booking can be cancelled"""
    if booking.payment_status in ['cancelled', 'completed', 'no_show']:
        return False, f'Booking is already {booking.payment_status}'

    # FIX: Create timezone-aware datetime
    naive_dt = datetime.combine(booking.booked_date, booking.session_start)
    booking_dt = timezone.make_aware(naive_dt)  # Uses current/active timezone

    if timezone.now() > booking_dt - timedelta(hours=24):
        return False, 'Cancellation must be done at least 24 hours in advance'

    return True, 'Can cancel'


def can_reschedule_booking(booking, new_date=None, new_time=None):
    """Check if a booking can be rescheduled"""
    if booking.payment_status not in ['confirmed', 'pending']:
        return False, f'Booking is {booking.payment_status}, cannot reschedule'

    # FIX: Use booking's own date/time for 24-hour check
    naive_dt = datetime.combine(booking.booked_date, booking.session_start)
    booking_dt = timezone.make_aware(naive_dt)

    if timezone.now() > booking_dt - timedelta(hours=24):
        return False, 'Rescheduling must be done at least 24 hours in advance'

    # If new slot provided, check availability
    if new_date and new_time:
        availability = check_booking_availability(
            new_date, new_time, booking.package, booking.number_of_people, exclude_booking=booking
        )
        if not availability['is_available']:
            return False, availability.get('reason', 'New time slot not available')

    return True, 'Can reschedule' 
