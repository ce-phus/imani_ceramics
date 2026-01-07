from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
from django.utils.translation import gettext_lazy as _  # FIXED: translation not translations
from django.utils import timezone
from datetime import datetime, time, timedelta
from django.core.exceptions import ValidationError
from django.utils.text import slugify


class StudioConfig(models.Model):
    """Stores studio configuration like number of wheels"""
    total_wheels = models.PositiveIntegerField(default=8, verbose_name=_("Total Wheels"))
    booking_fee_per_person = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00, verbose_name=_("Booking Fee per Person"))

    operating_time = models.TimeField(default="08:00:00", verbose_name=_("Operating Time Start"))
    closing_time = models.TimeField(default="18:00:00", verbose_name=_("Closing Time"))

    # Session settings
    buffer_minutes_between_sessions = models.PositiveIntegerField(default=15, verbose_name=_("Buffer Minutes Between Sessions"))
    max_daily_sessions = models.PositiveIntegerField(default=20, verbose_name=_("Max Daily Sessions"))

    # Wheel session specific
    wheel_session_duration = models.PositiveIntegerField(default=60, verbose_name=_("Wheel Session Duration (Minutes)"))

    is_maintenance_mode = models.BooleanField(default=False, verbose_name=_("Maintenance Mode"))
    maintenance_message = models.TextField(blank=True, null=True, verbose_name=_("Maintenance Message"))

    def save(self, *args, **kwargs):
        """Ensure only one configuration exists."""
        if not self.pk and StudioConfig.objects.exists():
            raise ValueError("Only one StudioConfig instance allowed.")
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Studio Configuration: {self.total_wheels} wheels"

    @classmethod
    def get_config(cls):
        config, created = cls.objects.get_or_create(
            defaults={
                'total_wheels': 8,
                'booking_fee_per_person': 1000.00,
                'operating_time': time(8, 0),
                'closing_time': time(18, 0),
                'buffer_minutes_between_sessions': 15,
                'max_daily_sessions': 20,
                'wheel_session_duration': 60,
                'is_maintenance_mode': False,
                'maintenance_message': '',
            }
        )
        return config

    @property
    def is_open_today(self):
        """
        Check if the studio is open today based on maintenance mode.
        """
        if self.is_maintenance_mode:
            return False
        return True


class Wheel(models.Model):
    """
    Individual pottery wheel
    """
    WHEEL_STATUS = [
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('maintenance', 'Under Maintenance'),
    ]

    wheel_number = models.PositiveIntegerField(unique=True, verbose_name=_("Wheel Number"))
    name = models.CharField(max_length=100, verbose_name=_("Wheel Name"), blank=True, null=True)
    status = models.CharField(max_length=20, choices=WHEEL_STATUS, default='available', verbose_name=_("Wheel Status"))
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
    notes = models.TextField(blank=True, null=True, verbose_name=_("Notes"))

    class Meta:
        ordering = ['wheel_number']
        verbose_name = _("Wheel")
        verbose_name_plural = _("Wheels")

    def __str__(self):
        return f"Wheel {self.wheel_number}: {self.name or 'Unnamed'}"


class Package(models.Model):
    PACKAGE_TYPES = [
        ('wheel_throwing', 'Wheel Throwing'),
        ('hand_building', 'Hand Building'),
        ('combo', 'Wheel + Hand Building Combo'),
        ('painting', 'Bisque Painting/Glazing'),
        ('hobbyist', 'Hobbyists Package'),
        ('colored_clay', 'Colored Clay Combo'),
    ]
    
    # FIXED: name should not be choices, it's a display name
    name = models.CharField(max_length=100, verbose_name=_("Package Name")) 
    package_type = models.CharField(max_length=100, choices=PACKAGE_TYPES, verbose_name=_("Package Type"))
    code = models.CharField(max_length=20, unique=True, verbose_name=_("Package Code"))
    description = models.TextField(null=True, blank=True, verbose_name=_("Package Description"))
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Package Price"))
    
    # Duration settings
    has_fixed_duration = models.BooleanField(default=False, verbose_name=_("Has Fixed Duration"))
    fixed_duration_hours = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name=_("Fixed Duration (Hours)"),
        help_text=_("For Packages with fixed duration (P1, P2)")
    )
    max_duration_hours = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name=_("Max Duration (Hours)"),
        help_text=_("Maximum duration allowed for unlimited packages in hours (e.g., 0.5 to 8.0 hours)"),
    )

    # Resource requirements
    requires_wheel = models.BooleanField(default=False, verbose_name=_("Requires Wheel"))
    clay_weight_kg = models.DecimalField(
        max_digits=5,
        default=1.0,
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name=_("Clay Weight (kg)"),
        help_text=_("Amount of clay provided with the package in kilograms"),
    )
    max_participants = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name=_("Max Participants"),
        help_text=_("Maximum number of participants allowed for group packages"),
    )

    # Display Info
    display_features = models.TextField(blank=True, null=True, verbose_name=_("Display Features"), 
                                       help_text=_("Features to display for this package on the booking page"))
    display_suggestion = models.TextField(blank=True, null=True, verbose_name=_("Display Suggestion"), 
                                         help_text=_("Suggestions to display for this package on the booking page"))
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))

    class Meta:
        ordering = ['code']
        verbose_name = _("Package")
        verbose_name_plural = _("Packages")

    def save(self, *args, **kwargs):
        if not self.code:
            prefix = self.package_type[:3].upper()
            last = Package.objects.filter(code__startswith=prefix).count() + 1
            self.code = f"{prefix}-{last:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        duration_info = ""
        if self.has_fixed_duration and self.fixed_duration_hours:
            duration_info = f" ({self.fixed_duration_hours} hour{'s' if float(self.fixed_duration_hours) > 1 else ''})"
        elif not self.has_fixed_duration:
            duration_info = " (unlimited duration)"
        elif self.max_duration_hours:
            duration_info = f" (up to {self.max_duration_hours} hours)"
        return f"{self.code}: {self.name}{duration_info}"

    def clean(self):
        """
        Validate package settings
        """
        if self.has_fixed_duration and not self.fixed_duration_hours:
            raise ValidationError(_("Fixed duration hours must be set for packages with fixed duration."))
        
        # FIXED: Fixed duration packages shouldn't have max_duration
        if self.has_fixed_duration and self.max_duration_hours:
            raise ValidationError(_("Fixed duration packages should not have max duration."))
        
        # FIXED: Unlimited packages should have max_duration
        if not self.has_fixed_duration and not self.max_duration_hours:
            raise ValidationError(_("Max duration must be set for unlimited duration packages."))

    @property
    def is_wheel_package(self):
        """
        Check if this is a wheel throwing package
        """
        return self.package_type == 'wheel_throwing'

    @property
    def is_hand_building(self):
        """Check if this is hand building package"""
        return self.package_type == 'hand_building'
    
    @property
    def is_painting(self):
        """Check if this is painting/glazing package"""
        return self.package_type == 'painting'
    
    @property
    def is_combo(self):
        """Check if this is a combo package"""
        return self.package_type == 'combo'
    
    @property
    def is_hobbyist(self):
        """Check if this is hobbyist package"""
        return self.package_type == 'hobbyist'
    
    @property
    def is_colored_clay(self):
        """Check if this is colored clay package"""
        return self.package_type == 'colored_clay'

    def calculate_end_time(self, start_time, date=None):
        """
        Calculate end time based on start time and package duration
        For fixed duration: start_time + fixed_duration
        for unlimited: start_time + max_duration or closing time
        """
        if not start_time:
            return None
        
        if self.has_fixed_duration and self.fixed_duration_hours:
            # Fixed duration packages (P1, P2)
            start_dt = datetime.combine(date or timezone.now().date(), start_time)
            end_dt = start_dt + timedelta(hours=float(self.fixed_duration_hours))
            return end_dt.time()
        elif self.max_duration_hours:
            # Unlimited packages with max duration
            start_dt = datetime.combine(date or timezone.now().date(), start_time)
            end_dt = start_dt + timedelta(hours=float(self.max_duration_hours))
            return end_dt.time()
        else:
            # Unlimited packages - end at studio closing
            config = StudioConfig.get_config()
            return config.closing_time

    def get_session_duration_display(self):
        """
        Get a user-friendly display of the session duration
        """
        if self.has_fixed_duration and self.fixed_duration_hours:
            hours = int(self.fixed_duration_hours)
            minutes = int((float(self.fixed_duration_hours) - hours) * 60)

            if hours > 0 and minutes > 0:
                return f"{hours} hour{'s' if hours > 1 else ''} {minutes} minute{'s' if minutes > 1 else ''}"
            elif hours > 0:
                return f"{hours} hour{'s' if hours > 1 else ''}"
            else:
                return f"{minutes} minute{'s' if minutes > 1 else ''}"
        elif self.max_duration_hours:
            return f"Up to {self.max_duration_hours} hours"
        else:
            return "Unlimited duration until studio closing time"

    def get_available_time_slots(self, date, num_people=1):
        """
        Get available time slots for this package
        """
        from .utils import get_available_time_slots_for_package
        return get_available_time_slots_for_package(self, date, num_people)


# FiringCharge, PaintingGlazingOption, ExtraService models remain the same
class FiringCharge(models.Model):
    """Firing charges based on piece size (Part 4 of PDF)"""
    SIZE_CATEGORIES = [
        ('xs', 'Extra Small (smaller than standard cup)'),
        ('s', 'Small (≤10cm diameter)'),
        ('m', 'Medium (≤12cm diameter, 3-10cm height)'),
        ('l', 'Large (12-16cm diameter)'),
        ('xl', 'Extra Large (16-19cm diameter)'),
        ('xxl', '2XL (19-22cm diameter)'),
        ('plate_small', 'Plate Small (≤17cm diameter)'),
        ('plate_medium', 'Plate Medium (17-24cm diameter, ≤3cm height)'),
        ('plate_large', 'Plate Large (24-30cm diameter)'),
        ('tall', 'Tall (>10cm height)'),
        ('custom', 'Custom Size'),
    ]
    
    name = models.CharField(max_length=100)
    size_category = models.CharField(max_length=20, choices=SIZE_CATEGORIES, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    hobbyist_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_diameter_cm = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    max_height_cm = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name}: KES {self.price}"


class PaintingGlazingOption(models.Model):
    """Painting/Glazing options (Part 2 of PDF)"""
    OPTION_TYPES = [
        ('self_paint', 'Self Painting'),
        ('self_glaze', 'Self Glazing'),
        ('single_color', 'Single Color Application'),
        ('transparent_glaze', 'Transparent Glaze Application'),
        ('white_glaze', 'White Glaze Application'),
        ('premium_glaze', 'Premium Natural Glaze'),
    ]
    
    name = models.CharField(max_length=100)
    option_type = models.CharField(max_length=20, choices=OPTION_TYPES)
    description = models.TextField()
    price_per_item = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_per_session = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration_hours = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    includes_paints = models.BooleanField(default=False)
    includes_tutorial = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['option_type', 'price_per_item']
    
    def __str__(self):
        return f"{self.name}: KES {self.price_per_item or self.price_per_session}"


class ExtraService(models.Model):
    """Other charges (Part 3 of PDF)"""
    SERVICE_TYPES = [
        ('extra_clay', 'Extra Clay'),
        ('clay_takeaway', 'Clay Takeaway'),
        ('commercial_shooting', 'Commercial Shooting'),
        ('private_event', 'Private Event Workshop'),
        ('catered_event', 'Catered Private Event'),
    ]
    
    name = models.CharField(max_length=100)
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, blank=True)  # e.g., "per kg", "per day"
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name}: KES {self.price} {self.unit}"


class Booking(models.Model):
    """Main Booking Model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Payment'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]
    
    # FIXED: Use CharField for IM- format reference, not UUID
    booking_reference = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        verbose_name=_("Booking Reference")
    )
    customer_name = models.CharField(max_length=200, verbose_name=_("Customer Name"))
    customer_email = models.EmailField(verbose_name=_("Customer Email"))
    customer_phone = models.CharField(max_length=20, verbose_name=_("Customer Phone"))

    package = models.ForeignKey(Package, on_delete=models.CASCADE, verbose_name=_("Package"))
    number_of_people = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(8)]
    )

    booked_date = models.DateField(verbose_name=_("Booked Date"))
    session_start = models.TimeField(verbose_name=_("Session Start Time"), help_text=_("What time the customer will arrive"))
    session_end = models.TimeField(
        verbose_name=_("Session End Time"), 
        blank=True,
        null=True,
        help_text=_("Calculated based on package duration")
    )

    # Wheel assignment (only for wheel packages)
    assigned_wheels = models.ManyToManyField("Wheel", blank=True, verbose_name=_("Assigned Wheels"), through="WheelBooking")

    # Payment
    booking_fee_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name=_("Booking Fee Paid"))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Total Amount"))
    package_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Package Amount"))
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name=_("Payment Status"))
    payment_reference = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("Payment Reference"))

    # session tracking
    actual_start_time = models.DateTimeField(blank=True, null=True, verbose_name=_("Actual Start Time"), help_text=_("When the session actually started"))
    actual_end_time = models.DateTimeField(blank=True, null=True, verbose_name=_("Actual End Time"), help_text=_("When the session actually ended"))
    checkin_time = models.DateTimeField(blank=True, null=True, verbose_name=_("Check-in Time"))
    checkout_time = models.DateTimeField(blank=True, null=True, verbose_name=_("Check-out Time"))

    # Metadata
    booking_channel = models.CharField(
        max_length=20, 
        default='website', 
        choices=[('website', 'Website'), ('whatsapp', 'WhatsApp'), ('phone', 'Phone')],
        verbose_name=_("Booking Channel")
    )

    special_requests = models.TextField(blank=True, null=True, verbose_name=_("Special Requests"))
    notes = models.TextField(blank=True, null=True, verbose_name=_("Internal Notes"))

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))
    confirmed_at = models.DateTimeField(blank=True, null=True, verbose_name=_("Confirmed At"))

    class Meta:
        ordering = ["-booked_date", "session_start"]
        indexes = [
            models.Index(fields=['booked_date', "session_start"]),
            models.Index(fields=['customer_phone']),
            models.Index(fields=['booking_reference']),
            models.Index(fields=['payment_status']),
        ]
        verbose_name = _("Booking")
        verbose_name_plural = _("Bookings")

    def __str__(self):
        return f"Booking {self.booking_reference} for {self.customer_name} on {self.booked_date} - {self.package.name}"

    def clean(self):
        """Validate Booking"""
        super().clean()

        # Check if date is in the past
        if self.booked_date and self.booked_date < timezone.now().date():
            raise ValidationError(_("Booked date cannot be in the past."))

        # Check if session times are within operating hours
        config = StudioConfig.get_config()
        if self.session_start and (self.session_start < config.operating_time or self.session_start > config.closing_time):
            raise ValidationError(
                f"Studio is open from {config.operating_time.strftime('%I:%M %p')} "
                f"to {config.closing_time.strftime('%I:%M %p')}"
            )

        # Check package capacity
        if self.number_of_people > self.package.max_participants:
            raise ValidationError(
                _(f"Number of people exceeds the maximum allowed for this package ({self.package.max_participants}).")
            )

        # For wheel packages, check wheel availability
        if self.package.requires_wheel:
            from .utils import check_wheel_availability
            # FIXED: Corrected function call syntax
            availability = check_wheel_availability(
                self.booked_date,
                self.session_start,
                self.get_calculated_end_time(),
                self.number_of_people,
                exclude_booking=self if self.pk else None
            )

            if not availability['is_available']:
                raise ValidationError(
                    _(f"Not enough wheels available for the selected time slot. Available wheels: {availability['available_wheels']}.")
                )

    def save(self, *args, **kwargs):
        """Generate booking reference if new"""
        if not self.booking_reference:
            date_str = self.booked_date.strftime('%Y%m%d') if self.booked_date else timezone.now().strftime('%Y%m%d')
            last_booking = Booking.objects.filter(
                booking_reference__startswith=f'IM-{date_str}'
            ).count()
            self.booking_reference = f'IM-{date_str}-{last_booking + 1:04d}'

        # Calculate package amount
        if self.package:
            self.package_amount = self.package.price * self.number_of_people

        # Calculate total amount (package + booking fee)
        config = StudioConfig.get_config()
        booking_fee = config.booking_fee_per_person * self.number_of_people
        self.booking_fee_paid = booking_fee
        self.total_amount = self.package_amount + booking_fee

        # Calculate session end time if not provided
        if self.session_start and not self.session_end:
            self.session_end = self.package.calculate_end_time(self.session_start, self.booked_date)

        # Run validation
        self.full_clean()

        super().save(*args, **kwargs)

    def get_calculated_end_time(self):
        """Get Calculated end time (used for validation)"""
        if self.session_end:
            return self.session_end
        return self.package.calculate_end_time(self.session_start, self.booked_date)

    @property
    def duration_display(self):
        """Display duration for this booking"""
        if self.package.has_fixed_duration:
            return self.package.get_session_duration_display()
        
        if self.session_start and self.session_end:
            start_dt = datetime.combine(self.booked_date, self.session_start)
            end_dt = datetime.combine(self.booked_date, self.session_end)
            duration = end_dt - start_dt
            hours = duration.seconds // 3600
            minutes = (duration.seconds % 3600) // 60

            if hours > 0:
                return f"{hours} hour{'s' if hours > 1 else ''} {minutes} minute{'s' if minutes > 1 else ''}"
            return f"{minutes} minute{'s' if minutes > 1 else ''}"

        return "Flexible duration"

    @property
    def is_wheel_booking(self):
        """Check if this booking requires wheels"""
        return self.package.requires_wheel
    
    @property
    def is_active_session(self):
        """Check if session is currently active"""
        if not self.actual_start_time or self.actual_end_time:
            return False
        
        now = timezone.now()
        session_date = timezone.make_aware(
            datetime.combine(self.booked_date, self.session_start)
        )
        
        # Session is active if it's today and within reasonable hours
        return (session_date.date() == now.date() and 
                session_date <= now <= session_date + timedelta(hours=4))
    
    def check_in(self):
        """Mark customer as checked in"""
        self.checkin_time = timezone.now()
        if not self.actual_start_time:
            self.actual_start_time = timezone.now()
        self.save()
    
    def check_out(self):
        """Mark customer as checked out"""
        self.checkout_time = timezone.now()
        if not self.actual_end_time:
            self.actual_end_time = timezone.now()
        self.save()
    
    def cancel_booking(self, reason=""):
        """Cancel this booking"""
        if self.payment_status in ['completed', 'no_show']:
            raise ValidationError("Cannot cancel a completed or no-show booking")
        
        self.payment_status = 'cancelled'
        if reason:
            self.notes += f"\nCancellation reason: {reason}"
        self.save()


class WheelBooking(models.Model):
    """Links wheel to bookings (for wheel packages)"""
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, verbose_name=_("Booking"), related_name="wheel_bookings")
    wheel = models.ForeignKey(Wheel, on_delete=models.PROTECT, verbose_name=_("Wheel"), related_name="bookings")

    # Wheel session timing (may differ from booking times for combo packages)
    wheel_start_time = models.TimeField(verbose_name=_("Wheel Session Start Time"), blank=True, null=True)
    wheel_end_time = models.TimeField(verbose_name=_("Wheel Session End Time"), blank=True, null=True)

    class Meta:
        unique_together = ('booking', 'wheel')
        ordering = ['wheel__wheel_number']
        verbose_name = _("Wheel Booking")
        verbose_name_plural = _("Wheel Bookings")

    def __str__(self):
        return f"Wheel {self.wheel.wheel_number} for Booking {self.booking.booking_reference}"

    def save(self, *args, **kwargs):
        # If wheel times not set, use booking times
        if not self.wheel_start_time and self.booking.session_start:
            self.wheel_start_time = self.booking.session_start
        
        if not self.wheel_end_time and self.booking.session_end and self.booking.package.is_wheel_package:
            # For wheel-only packages, use booking end time
            self.wheel_end_time = self.booking.session_end
        elif not self.wheel_end_time and self.booking.package.is_wheel_package:
            # Calculate wheel end time for wheel packages
            if self.booking.package.has_fixed_duration and self.booking.package.fixed_duration_hours:
                start_dt = datetime.combine(
                    self.booking.booked_date, 
                    self.wheel_start_time or self.booking.session_start
                )
                end_dt = start_dt + timedelta(hours=float(self.booking.package.fixed_duration_hours))
                self.wheel_end_time = end_dt.time()
        
        super().save(*args, **kwargs)


class PostSessionService(models.Model):
    """Tracks post-session services (firing, painting, etc.)"""
    SERVICE_TYPES = [
        ('firing', 'Firing Service'),
        ('painting', 'Painting Service'),
        ('glazing', 'Glazing Service'),
        ('extra_clay', 'Extra Clay'),
        ('other', 'Other Service'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='post_session_services')
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    
    # For firing services
    firing_charge = models.ForeignKey(FiringCharge, on_delete=models.SET_NULL, 
                                      null=True, blank=True)
    piece_count = models.PositiveIntegerField(default=1)
    piece_description = models.TextField(blank=True)  # What was created
    diameter_cm = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    
    # For painting/glazing
    painting_option = models.ForeignKey(PaintingGlazingOption, on_delete=models.SET_NULL, 
                                       null=True, blank=True)
    item_count = models.PositiveIntegerField(default=1)
    
    # For extra services
    extra_service = models.ForeignKey(ExtraService, on_delete=models.SET_NULL, 
                                     null=True, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    
    # Price calculation
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status
    is_paid = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Post-session service for {self.booking.booking_reference}: {self.get_service_type_display()}"
    
    def save(self, *args, **kwargs):
        # Calculate total price
        if self.service_type == 'firing' and self.firing_charge:
            self.unit_price = self.firing_charge.price
            self.total_price = self.unit_price * self.piece_count
        
        elif self.service_type in ['painting', 'glazing'] and self.painting_option:
            if self.painting_option.price_per_item:
                self.unit_price = self.painting_option.price_per_item
                self.total_price = self.unit_price * self.item_count
            else:
                self.unit_price = self.painting_option.price_per_session
                self.total_price = self.unit_price
        
        elif self.service_type == 'extra_clay' and self.extra_service:
            self.unit_price = self.extra_service.price
            self.total_price = self.unit_price * self.quantity
        
        super().save(*args, **kwargs)


class BookingRule(models.Model):
    """Booking policies"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    booking_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=50.0)
    cancellation_hours = models.PositiveIntegerField(default=24)
    reschedule_hours = models.PositiveIntegerField(default=24)
    max_group_size = models.PositiveIntegerField(default=8)
    booking_validity_days = models.PositiveIntegerField(default=28)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name