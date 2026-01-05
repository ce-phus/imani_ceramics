from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, date, time, timedelta
from django.core.exceptions import ValidationError

from .models import (
    StudioConfig, Wheel, Package, FiringCharge, 
    PaintingGlazingOption, ExtraService, Booking, 
    WheelBooking, PostSessionService, BookingRule
)
from .utils import (
    check_booking_availability,
    get_available_time_slots_for_package,
    assign_wheels_to_booking,
    get_daily_schedule,
    can_reschedule_booking,
    can_cancel_booking
)


class StudioConfigSerializer(serializers.ModelSerializer):
    """Serializer for Studio Configuration"""
    is_open = serializers.SerializerMethodField()
    
    class Meta:
        model = StudioConfig
        fields = [
            'total_wheels', 'booking_fee_per_person',
            'operating_time', 'closing_time',
            'buffer_minutes_between_sessions', 'max_daily_sessions',
            'wheel_session_duration', 'is_maintenance_mode',
            'maintenance_message', 'is_open'
        ]
        read_only_fields = ['is_open']
    
    def get_is_open(self, obj):
        return obj.is_open_today


class WheelSerializer(serializers.ModelSerializer):
    """Serializer for Wheel"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_available_now = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Wheel
        fields = [
            'id', 'wheel_number', 'name', 'status', 'status_display',
            'is_active', 'notes', 'is_available_now'
        ]
        read_only_fields = ['is_available_now']


class PackageSerializer(serializers.ModelSerializer):
    """Serializer for Package"""
    package_type_display = serializers.CharField(source='get_package_type_display', read_only=True)
    duration_display = serializers.CharField(source='get_session_duration_display', read_only=True)
    available_slots = serializers.SerializerMethodField()
    
    class Meta:
        model = Package
        fields = [
            'id', 'name', 'package_type', 'package_type_display', 'code',
            'description', 'price', 'has_fixed_duration', 
            'fixed_duration_hours', 'max_duration_hours', 'requires_wheel',
            'clay_weight_kg', 'max_participants', 'display_features',
            'display_suggestion', 'is_active', 'duration_display',
            'available_slots'
        ]
    
    def get_available_slots(self, obj):
        """Get available slots for this package for a specific date"""
        request = self.context.get('request')
        if request:
            date_str = request.query_params.get('date')
            num_people = int(request.query_params.get('people', 1))
            
            if date_str:
                try:
                    booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    return get_available_time_slots_for_package(obj, booking_date, num_people)
                except (ValueError, TypeError):
                    pass
        return []


class FiringChargeSerializer(serializers.ModelSerializer):
    """Serializer for Firing Charges"""
    size_category_display = serializers.CharField(source='get_size_category_display', read_only=True)
    
    class Meta:
        model = FiringCharge
        fields = [
            'id', 'name', 'size_category', 'size_category_display',
            'description', 'price', 'hobbyist_price', 'max_diameter_cm',
            'max_height_cm', 'is_active'
        ]


class PaintingGlazingOptionSerializer(serializers.ModelSerializer):
    """Serializer for Painting/Glazing Options"""
    option_type_display = serializers.CharField(source='get_option_type_display', read_only=True)
    
    class Meta:
        model = PaintingGlazingOption
        fields = [
            'id', 'name', 'option_type', 'option_type_display',
            'description', 'price_per_item', 'price_per_session',
            'duration_hours', 'includes_paints', 'includes_tutorial',
            'is_active'
        ]


class ExtraServiceSerializer(serializers.ModelSerializer):
    """Serializer for Extra Services"""
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    
    class Meta:
        model = ExtraService
        fields = [
            'id', 'name', 'service_type', 'service_type_display',
            'description', 'price', 'unit', 'is_active'
        ]


class WheelBookingSerializer(serializers.ModelSerializer):
    """Serializer for Wheel Booking (through model)"""
    wheel_number = serializers.IntegerField(source='wheel.wheel_number', read_only=True)
    wheel_name = serializers.CharField(source='wheel.name', read_only=True)
    
    class Meta:
        model = WheelBooking
        fields = [
            'id', 'wheel', 'wheel_number', 'wheel_name',
            'wheel_start_time', 'wheel_end_time'
        ]
        read_only_fields = ['wheel_number', 'wheel_name']


class PostSessionServiceSerializer(serializers.ModelSerializer):
    """Serializer for Post Session Services"""
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    firing_charge_name = serializers.CharField(source='firing_charge.name', read_only=True, allow_null=True)
    painting_option_name = serializers.CharField(source='painting_option.name', read_only=True, allow_null=True)
    extra_service_name = serializers.CharField(source='extra_service.name', read_only=True, allow_null=True)
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)
    
    class Meta:
        model = PostSessionService
        fields = [
            'id', 'booking', 'booking_reference', 'service_type', 'service_type_display',
            'firing_charge', 'firing_charge_name', 'piece_count', 'piece_description',
            'diameter_cm', 'height_cm', 'painting_option', 'painting_option_name',
            'item_count', 'extra_service', 'extra_service_name', 'quantity',
            'unit_price', 'total_price', 'is_paid', 'is_completed', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'unit_price', 'total_price', 'created_at', 'updated_at',
            'booking_reference'
        ]


class BookingRuleSerializer(serializers.ModelSerializer):
    """Serializer for Booking Rules"""
    
    class Meta:
        model = BookingRule
        fields = '__all__'


class BookingSerializer(serializers.ModelSerializer):
    """Main Booking Serializer"""
    package_details = PackageSerializer(source='package', read_only=True)
    status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    booking_channel_display = serializers.CharField(source='get_booking_channel_display', read_only=True)
    duration_display = serializers.CharField(read_only=True)
    is_wheel_booking = serializers.BooleanField(read_only=True)
    is_active_session = serializers.BooleanField(read_only=True)
    assigned_wheels_info = WheelBookingSerializer(source='wheel_bookings', many=True, read_only=True)
    availability_check = serializers.SerializerMethodField()
    can_reschedule = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()
    post_session_services = PostSessionServiceSerializer(many=True, read_only=True)
    post_session_total = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'customer_name', 'customer_phone', 'customer_email',
            'package', 'package_details', 'number_of_people', 'booked_date',
            'session_start', 'session_end', 'assigned_wheels', 'assigned_wheels_info',
            'booking_fee_paid', 'total_amount', 'package_amount', 'payment_status',
            'status_display', 'payment_reference', 'actual_start_time', 'actual_end_time',
            'checkin_time', 'checkout_time', 'booking_channel', 'booking_channel_display',
            'special_requests', 'notes', 'created_at', 'updated_at', 'confirmed_at',
            'duration_display', 'is_wheel_booking', 'is_active_session',
            'availability_check', 'can_reschedule', 'can_cancel',
            'post_session_services', 'post_session_total'
        ]
        read_only_fields = [
            'booking_reference', 'session_end', 'package_amount', 'total_amount',
            'booking_fee_paid', 'payment_reference', 'created_at', 'updated_at',
            'confirmed_at', 'duration_display', 'is_wheel_booking', 'is_active_session',
            'package_details', 'status_display', 'booking_channel_display',
            'assigned_wheels_info', 'post_session_services', 'post_session_total'
        ]
    
    def get_availability_check(self, obj):
        """Check current availability for this booking's timeslot"""
        try:
            availability = check_booking_availability(
                obj.booked_date,
                obj.session_start,
                obj.package,
                obj.number_of_people,
                obj
            )
            return availability
        except Exception as e:
            return {'error': str(e)}
    
    def get_can_reschedule(self, obj):
        """Check if booking can be rescheduled"""
        if not obj.pk:
            return {'can_reschedule': False, 'reason': 'Booking not saved'}
        
        can_reschedule, reason = can_reschedule_booking(obj, obj.booked_date, obj.session_start)
        return {'can_reschedule': can_reschedule, 'reason': reason}
    
    def get_can_cancel(self, obj):
        """Check if booking can be cancelled"""
        if not obj.pk:
            return {'can_cancel': False, 'reason': 'Booking not saved'}
        
        can_cancel, reason = can_cancel_booking(obj)
        return {'can_cancel': can_cancel, 'reason': reason}
    
    def get_post_session_total(self, obj):
        """Calculate total for unpaid post-session services"""
        total = sum(
            service.total_price 
            for service in obj.post_session_services.filter(is_paid=False)
        )
        return total
    
    def validate(self, data):
        """Validate booking data"""
        # Check if date is in the past
        if data.get('booked_date') and data['booked_date'] < date.today():
            raise serializers.ValidationError("Booking date cannot be in the past")
        
        # Check operating hours
        config = StudioConfig.get_config()
        if data.get('session_start') and (
            data['session_start'] < config.operating_time or 
            data['session_start'] > config.closing_time
        ):
            raise serializers.ValidationError(
                f"Studio is open from {config.operating_time.strftime('%I:%M %p')} "
                f"to {config.closing_time.strftime('%I:%M %p')}"
            )
        
        # Package validation
        package = data.get('package')
        if package:
            # Check max participants
            num_people = data.get('number_of_people', 1)
            if num_people > package.max_participants:
                raise serializers.ValidationError(
                    f"Maximum {package.max_participants} people allowed for {package.name}"
                )
            
            # Check availability
            availability = check_booking_availability(
                data['booked_date'],
                data['session_start'],
                package,
                num_people
            )
            
            if not availability.get('is_available', False):
                raise serializers.ValidationError(
                    availability.get('reason', 'Time slot not available')
                )
        
        return data
    
    def create(self, validated_data):
        """Create booking with automatic calculations"""
        # Get config
        config = StudioConfig.get_config()
        
        # Calculate booking fee
        booking_fee = config.booking_fee_per_person * validated_data['number_of_people']
        
        # Create booking
        booking = Booking.objects.create(
            **validated_data,
            booking_fee_paid=booking_fee,
            package_amount=validated_data['package'].price * validated_data['number_of_people'],
            total_amount=(validated_data['package'].price * validated_data['number_of_people']) + booking_fee
        )
        
        # Assign wheels if needed
        if booking.package.requires_wheel:
            try:
                assign_wheels_to_booking(booking)
            except Exception as e:
                # If wheel assignment fails, delete booking
                booking.delete()
                raise serializers.ValidationError(f"Failed to assign wheels: {str(e)}")
        
        return booking
    
    def update(self, instance, validated_data):
        """Update booking with validation"""
        # Check if changing critical fields
        critical_fields = ['booked_date', 'session_start', 'package', 'number_of_people']
        if any(field in validated_data for field in critical_fields):
            # Create a temporary booking to check availability
            temp_data = {
                'booked_date': validated_data.get('booked_date', instance.booked_date),
                'session_start': validated_data.get('session_start', instance.session_start),
                'package': validated_data.get('package', instance.package),
                'number_of_people': validated_data.get('number_of_people', instance.number_of_people)
            }
            
            # Check availability excluding current booking
            availability = check_booking_availability(
                temp_data['booked_date'],
                temp_data['session_start'],
                temp_data['package'],
                temp_data['number_of_people'],
                instance
            )
            
            if not availability.get('is_available', False):
                raise serializers.ValidationError(
                    availability.get('reason', 'Time slot not available')
                )
        
        # Update instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class BookingCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating bookings"""
    availability = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'package', 'number_of_people', 'booked_date', 'session_start',
            'customer_name', 'customer_phone', 'customer_email',
            'special_requests', 'availability'
        ]
    
    def get_availability(self, obj):
        """Check availability for the requested booking"""
        if not hasattr(obj, 'package') or not obj.package:
            return None
        
        try:
            return check_booking_availability(
                obj.booked_date,
                obj.session_start,
                obj.package,
                obj.number_of_people
            )
        except Exception:
            return None
    
    def validate(self, data):
        """Validate booking creation"""
        # Check availability
        availability = check_booking_availability(
            data['booked_date'],
            data['session_start'],
            data['package'],
            data['number_of_people']
        )
        
        if not availability.get('is_available', False):
            raise serializers.ValidationError(
                availability.get('reason', 'Time slot not available')
            )
        
        return data


class AvailabilityCheckSerializer(serializers.Serializer):
    """Serializer for checking availability"""
    date = serializers.DateField()
    time = serializers.TimeField(required=False)
    package = serializers.PrimaryKeyRelatedField(queryset=Package.objects.filter(is_active=True))
    people = serializers.IntegerField(default=1, min_value=1, max_value=8)
    
    def validate(self, data):
        """Validate availability check"""
        date = data['date']
        time = data.get('time')
        package = data['package']
        people = data['people']
        
        # Check if date is in past
        if date < date.today():
            raise serializers.ValidationError("Cannot check availability for past dates")
        
        # If time is provided, check specific slot
        if time:
            availability = check_booking_availability(date, time, package, people)
            data['availability'] = availability
        else:
            # Get all available slots for the day
            slots = get_available_time_slots_for_package(package, date, people)
            data['available_slots'] = slots
        
        return data


class RescheduleBookingSerializer(serializers.Serializer):
    """Serializer for rescheduling bookings"""
    new_date = serializers.DateField()
    new_time = serializers.TimeField()
    
    def validate(self, data):
        """Validate reschedule request"""
        booking = self.context.get('booking')
        if not booking:
            raise serializers.ValidationError("Booking context required")
        
        new_date = data['new_date']
        new_time = data['new_time']
        
        # Check if new date is in past
        if new_date < date.today():
            raise serializers.ValidationError("Cannot reschedule to a past date")
        
        # Check if booking can be rescheduled
        can_reschedule, reason = can_reschedule_booking(booking, new_date, new_time)
        if not can_reschedule:
            raise serializers.ValidationError(reason)
        
        # Check availability for new time
        availability = check_booking_availability(
            new_date, new_time, booking.package, booking.number_of_people, booking
        )
        
        if not availability.get('is_available', False):
            raise serializers.ValidationError(
                availability.get('reason', 'New time slot not available')
            )
        
        data['availability'] = availability
        return data


class CancelBookingSerializer(serializers.Serializer):
    """Serializer for cancelling bookings"""
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate cancellation request"""
        booking = self.context.get('booking')
        if not booking:
            raise serializers.ValidationError("Booking context required")
        
        # Check if booking can be cancelled
        can_cancel, reason = can_cancel_booking(booking)
        if not can_cancel:
            raise serializers.ValidationError(reason)
        
        return data


class DailyScheduleSerializer(serializers.Serializer):
    """Serializer for daily schedule"""
    date = serializers.DateField()
    
    def validate(self, data):
        """Get daily schedule"""
        schedule = get_daily_schedule(data['date'])
        data['schedule'] = schedule
        return data


class TimeSlotSerializer(serializers.Serializer):
    """Serializer for time slots"""
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    duration_minutes = serializers.IntegerField()
    duration_display = serializers.CharField()
    display = serializers.CharField()


class AssignWheelsSerializer(serializers.Serializer):
    """Serializer for assigning wheels to booking"""
    wheel_numbers = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False
    )
    
    def validate(self, data):
        """Validate wheel assignment"""
        booking = self.context.get('booking')
        if not booking:
            raise serializers.ValidationError("Booking context required")
        
        if not booking.package.requires_wheel:
            raise serializers.ValidationError("This package does not require wheels")
        
        # Check if wheel numbers are valid
        valid_wheels = Wheel.objects.filter(
            wheel_number__in=data['wheel_numbers'],
            is_active=True,
            status='available'
        ).values_list('wheel_number', flat=True)
        
        invalid_wheels = set(data['wheel_numbers']) - set(valid_wheels)
        if invalid_wheels:
            raise serializers.ValidationError(
                f"Invalid or unavailable wheels: {', '.join(map(str, invalid_wheels))}"
            )
        
        return data


class CheckInSerializer(serializers.Serializer):
    """Serializer for checking in"""
    notes = serializers.CharField(required=False, allow_blank=True)


class CheckOutSerializer(serializers.Serializer):
    """Serializer for checking out"""
    notes = serializers.CharField(required=False, allow_blank=True)
    actual_end_time = serializers.DateTimeField(required=False)


class PostSessionServiceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating post-session services"""
    
    class Meta:
        model = PostSessionService
        fields = [
            'service_type', 'firing_charge', 'piece_count', 'piece_description',
            'diameter_cm', 'height_cm', 'painting_option', 'item_count',
            'extra_service', 'quantity', 'notes'
        ]
    
    def validate(self, data):
        """Validate post-session service creation"""
        booking = self.context.get('booking')
        if not booking:
            raise serializers.ValidationError("Booking context required")
        
        service_type = data.get('service_type')
        
        # Validate based on service type
        if service_type == 'firing' and not data.get('firing_charge'):
            raise serializers.ValidationError("Firing charge is required for firing service")
        
        if service_type in ['painting', 'glazing'] and not data.get('painting_option'):
            raise serializers.ValidationError("Painting option is required for painting/glazing service")
        
        if service_type == 'extra_clay' and not data.get('extra_service'):
            raise serializers.ValidationError("Extra service is required for extra clay service")
        
        return data
    
    def create(self, validated_data):
        """Create post-session service"""
        booking = self.context.get('booking')
        if not booking:
            raise serializers.ValidationError("Booking context required")
        
        # Create post-session service
        service = PostSessionService.objects.create(
            booking=booking,
            **validated_data
        )
        
        # Update booking to indicate it has post-session services
        booking.has_post_session_services = True
        booking.save()
        
        return service