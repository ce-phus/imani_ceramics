from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    StudioConfig,
    Wheel,
    Package,
    FiringCharge,
    PaintingGlazingOption,
    ExtraService,
    Booking,
    WheelBooking,
    PostSessionService,
    BookingRule,
)

@admin.register(StudioConfig)
class StudioConfigAdmin(admin.ModelAdmin):
    list_display = (
        "total_wheels",
        "booking_fee_per_person",
        "operating_time",
        "closing_time",
        "is_maintenance_mode",
    )

    readonly_fields = ("id",)

    def has_add_permission(self, request):
        # Enforce singleton
        return not StudioConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(Wheel)
class WheelAdmin(admin.ModelAdmin):
    list_display = ("wheel_number", "name", "status", "is_active")
    list_filter = ("status", "is_active")
    search_fields = ("wheel_number", "name")
    ordering = ("wheel_number",)

@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "package_type",
        "price",
        "requires_wheel",
        "is_active",
    )

    list_display_links = ("code", "name", "package_type")

    list_filter = (
        "package_type",
        "requires_wheel",
        "is_active",
        "has_fixed_duration",
    )

    search_fields = ("code", "name")
    ordering = ("code",)

    readonly_fields = ("code",)

    fieldsets = (
        (_("Basic Info"), {
            "fields": ("code", "name", "package_type", "price", "is_active")
        }),
        (_("Duration Settings"), {
            "fields": (
                "has_fixed_duration",
                "fixed_duration_hours",
                "max_duration_hours",
            )
        }),
        (_("Resources & Limits"), {
            "fields": (
                "requires_wheel",
                "clay_weight_kg",
                "max_participants",
            )
        }),
        (_("Display"), {
            "fields": (
                "display_features",
                "display_suggestion",
            )
        }),
    )

@admin.register(FiringCharge)
class FiringChargeAdmin(admin.ModelAdmin):
    list_display = ("name", "size_category", "price", "hobbyist_price", "is_active")
    list_filter = ("size_category", "is_active")
    search_fields = ("name", "size_category")
    ordering = ("price",)

@admin.register(PaintingGlazingOption)
class PaintingGlazingOptionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "option_type",
        "price_per_item",
        "price_per_session",
        "is_active",
    )
    list_filter = ("option_type", "is_active")
    search_fields = ("name",)

@admin.register(ExtraService)
class ExtraServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "service_type", "price", "unit", "is_active")
    list_filter = ("service_type", "is_active")
    search_fields = ("name",)

class WheelBookingInline(admin.TabularInline):
    model = WheelBooking
    extra = 0
    readonly_fields = ("wheel_start_time", "wheel_end_time")

class PostSessionServiceInline(admin.TabularInline):
    model = PostSessionService
    extra = 0
    readonly_fields = ("unit_price", "total_price", "created_at")

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "booking_reference",
        "customer_name",
        "package",
        "booked_date",
        "session_start",
        "session_end",
        "payment_status",
        "total_amount",
    )

    list_filter = (
        "payment_status",
        "booking_channel",
        "booked_date",
        "package",
    )

    search_fields = (
        "booking_reference",
        "customer_name",
        "customer_phone",
        "customer_email",
    )

    date_hierarchy = "booked_date"

    readonly_fields = (
        "booking_reference",
        "package_amount",
        "total_amount",
        "booking_fee_paid",
        "created_at",
        "updated_at",
        "confirmed_at",
    )

    inlines = [WheelBookingInline, PostSessionServiceInline]

    fieldsets = (
        (_("Customer Info"), {
            "fields": (
                "booking_reference",
                "customer_name",
                "customer_email",
                "customer_phone",
            )
        }),
        (_("Booking Details"), {
            "fields": (
                "package",
                "number_of_people",
                "booked_date",
                "session_start",
                "session_end",
            )
        }),
        (_("Payment"), {
            "fields": (
                "payment_status",
                "payment_reference",
                "package_amount",
                "booking_fee_paid",
                "total_amount",
            )
        }),
        (_("Session Tracking"), {
            "fields": (
                "checkin_time",
                "checkout_time",
                "actual_start_time",
                "actual_end_time",
            )
        }),
        (_("Meta"), {
            "fields": (
                "booking_channel",
                "special_requests",
                "notes",
            )
        }),
    )

@admin.register(BookingRule)
class BookingRuleAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "booking_fee_percent",
        "cancellation_hours",
        "reschedule_hours",
        "max_group_size",
        "is_active",
    )
    list_filter = ("is_active",)
    search_fields = ("name",)
