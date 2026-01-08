from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.http import HttpResponse
from django.db.models import Q
from datetime import datetime, timedelta
import uuid

from rest_framework import viewsets, generics, status, mixins, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from .models import (
    StudioConfig, Wheel, Package, Booking, WheelBooking,
    FiringCharge, PaintingGlazingOption, ExtraService,
    PostSessionService, BookingRule
)
from .serializers import (
    StudioConfigSerializer, WheelSerializer, PackageSerializer,
    FiringChargeSerializer, PaintingGlazingOptionSerializer,
    ExtraServiceSerializer, BookingSerializer, BookingCreateSerializer,
    AvailabilityCheckSerializer, RescheduleBookingSerializer,
    CancelBookingSerializer, DailyScheduleSerializer,
    AssignWheelsSerializer, CheckInSerializer, CheckOutSerializer,
    PostSessionServiceCreateSerializer, WheelBookingSerializer,
    BookingRuleSerializer
)
from .utils import (
    check_booking_availability,
    get_available_time_slots_for_package,
    get_daily_schedule,
    assign_wheels_to_booking,
    get_bookings_for_customer,
    can_reschedule_booking,
    can_cancel_booking
)


# ============ PAGINATION ============
class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ============ STUDIO CONFIG VIEWS ============
class StudioConfigViewSet(mixins.RetrieveModelMixin,
                         mixins.UpdateModelMixin,
                         viewsets.GenericViewSet):
    """Studio configuration management"""
    queryset = StudioConfig.objects.all()
    serializer_class = StudioConfigSerializer
    permission_classes = [AllowAny]
    
    def get_object(self):
        return StudioConfig.get_config()


# ============ PACKAGE VIEWS ============
class PackageViewSet(viewsets.ReadOnlyModelViewSet):
    """View all available packages"""
    queryset = Package.objects.filter(is_active=True)
    serializer_class = PackageSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    
    def get_serializer_context(self):
        """Add request context to serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=True, methods=['get'])
    def slots(self, request, pk=None):
        """Get available time slots for this package"""
        package = self.get_object()
        date_str = request.query_params.get('date')
        num_people = int(request.query_params.get('people', 1))
        
        if not date_str:
            return Response(
                {"error": "Date parameter is required (YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            booking_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if date is in past
        if booking_date < timezone.now().date():
            return Response({
                'date': date_str,
                'available_slots': [],
                'reason': 'Cannot book a date in the past'
            })
        
        # Get available slots
        slots = get_available_time_slots_for_package(package, booking_date, num_people)
        
        return Response({
            'package': PackageSerializer(package).data,
            'date': date_str,
            'people': num_people,
            'available_slots': slots,
            'total_slots': len(slots)
        })


# ============ BOOKING VIEWS ============
class BookingViewSet(viewsets.ModelViewSet):
    """Booking management"""
    serializer_class = BookingSerializer
    permission_classes = [AllowAny]  # Allow anyone to create/view bookings
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer_name', 'customer_phone', 'booking_reference']
    ordering_fields = ['booked_date', 'session_start', 'created_at']
    ordering = ['-booked_date', '-session_start']
    
    def get_queryset(self):
        """Filter bookings based on query parameters"""
        queryset = Booking.objects.all()
        
        # Filter by customer phone (for booking history)
        phone = self.request.query_params.get('phone')
        if phone:
            queryset = queryset.filter(customer_phone=phone)
        
        # Filter by booking reference
        reference = self.request.query_params.get('reference')
        if reference:
            queryset = queryset.filter(booking_reference=reference)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(booked_date__range=[start, end])
            except ValueError:
                pass
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(payment_status=status)
        
        # Filter by package
        package_id = self.request.query_params.get('package')
        if package_id:
            queryset = queryset.filter(package_id=package_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create booking and send confirmation email"""
        booking = serializer.save()
        
        # Generate booking reference (already done in model save)
        # Send confirmation email
        self.send_booking_confirmation(booking)
    
    def send_booking_confirmation(self, booking):
        """Send booking confirmation email"""
        try:
            subject = f"Booking Confirmation - {booking.booking_reference}"
            
            # Prepare context for email template
            context = {
                'booking': booking,
                'studio_config': StudioConfig.get_config(),
                'receipt_date': timezone.now().strftime('%d/%m/%Y %I:%M %p'),
            }
            
            # Render email content
            text_message = render_to_string('emails/booking_confirmation.txt', context)
            html_message = render_to_string('emails/booking_confirmation.html', context)
            
            # Send email
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.customer_email],
                html_message=html_message,
                fail_silently=False,  # Set to True in production if email fails
            )
            
            # Update booking notes
            booking.notes = f"Confirmation email sent to {booking.customer_email}"
            booking.save()
            
        except Exception as e:
            # Log error but don't fail booking creation
            print(f"Failed to send confirmation email: {e}")
            booking.notes = f"Failed to send confirmation email: {str(e)}"
            booking.save()
    
    @action(detail=False, methods=['post'])
    def check_availability(self, request):
        """Check availability for booking"""
        serializer = AvailabilityCheckSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """Reschedule a booking"""
        booking = self.get_object()
        serializer = RescheduleBookingSerializer(
            data=request.data,
            context={'booking': booking}
        )
        
        if serializer.is_valid():
            # Update booking
            booking.booked_date = serializer.validated_data['new_date']
            booking.session_start = serializer.validated_data['new_time']
            booking.session_end = booking.package.calculate_end_time(
                booking.session_start, 
                booking.booked_date
            )
            booking.save()
            
            # Send reschedule confirmation
            self.send_reschedule_confirmation(booking)
            
            return Response({
                'success': True,
                'message': 'Booking rescheduled successfully',
                'booking': BookingSerializer(booking).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def send_reschedule_confirmation(self, booking):
        """Send reschedule confirmation email"""
        try:
            subject = f"Booking Rescheduled - {booking.booking_reference}"
            
            context = {
                'booking': booking,
                'action': 'rescheduled',
                'date': timezone.now().strftime('%d/%m/%Y %I:%M %p'),
            }
            
            text_message = render_to_string('emails/booking_update.txt', context)
            html_message = render_to_string('emails/booking_update.html', context)
            
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.customer_email],
                html_message=html_message,
                fail_silently=True,
            )
            
        except Exception as e:
            print(f"Failed to send reschedule email: {e}")
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking"""
        booking = self.get_object()
        serializer = CancelBookingSerializer(
            data=request.data,
            context={'booking': booking}
        )
        
        if serializer.is_valid():
            # Get cancellation reason
            reason = serializer.validated_data.get('reason', '')
            
            # Cancel booking
            booking.cancel_booking(reason)
            
            # Send cancellation confirmation
            self.send_cancellation_confirmation(booking, reason)
            
            return Response({
                'success': True,
                'message': 'Booking cancelled successfully',
                'booking': BookingSerializer(booking).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def send_cancellation_confirmation(self, booking, reason):
        """Send cancellation confirmation email"""
        try:
            subject = f"Booking Cancelled - {booking.booking_reference}"
            
            context = {
                'booking': booking,
                'reason': reason,
                'action': 'cancelled',
                'date': timezone.now().strftime('%d/%m/%Y %I:%M %p'),
            }
            
            text_message = render_to_string('emails/booking_update.txt', context)
            html_message = render_to_string('emails/booking_update.html', context)
            
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.customer_email],
                html_message=html_message,
                fail_silently=True,
            )
            
        except Exception as e:
            print(f"Failed to send cancellation email: {e}")
    
    @action(detail=True, methods=['post'])
    def assign_wheels(self, request, pk=None):
        """Assign specific wheels to booking"""
        booking = self.get_object()
        serializer = AssignWheelsSerializer(
            data=request.data,
            context={'booking': booking}
        )
        
        if serializer.is_valid():
            wheel_numbers = serializer.validated_data['wheel_numbers']
            
            try:
                assigned_wheels = assign_wheels_to_booking(booking, wheel_numbers)
                
                return Response({
                    'success': True,
                    'message': f'Assigned {len(assigned_wheels)} wheels to booking',
                    'assigned_wheels': [w.wheel_number for w in assigned_wheels]
                })
            except ValueError as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Check in customer for session"""
        booking = self.get_object()
        serializer = CheckInSerializer(data=request.data)
        
        if serializer.is_valid():
            notes = serializer.validated_data.get('notes', '')
            booking.check_in()
            
            if notes:
                booking.notes += f"\nCheck-in notes: {notes}"
                booking.save()
            
            return Response({
                'success': True,
                'message': 'Customer checked in successfully',
                'checkin_time': booking.checkin_time,
                'actual_start_time': booking.actual_start_time
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        """Check out customer after session"""
        booking = self.get_object()
        serializer = CheckOutSerializer(data=request.data)
        
        if serializer.is_valid():
            notes = serializer.validated_data.get('notes', '')
            booking.check_out()
            
            if notes:
                booking.notes += f"\nCheck-out notes: {notes}"
                booking.save()
            
            return Response({
                'success': True,
                'message': 'Customer checked out successfully',
                'checkout_time': booking.checkout_time,
                'actual_end_time': booking.actual_end_time
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Generate booking receipt (PDF/HTML)"""
        booking = self.get_object()
        
        # You can generate PDF receipt here
        # For now, return HTML receipt data
        context = {
            'booking': booking,
            'studio_config': StudioConfig.get_config(),
            'receipt_date': timezone.now().strftime('%d/%m/%Y %I:%M %p'),
            'receipt_number': f"RCPT-{booking.booking_reference}",
        }
        
        # Return as JSON for frontend to render
        return Response({
            'receipt_data': context,
            'download_url': f"/api/bookings/{booking.id}/receipt-pdf/"  # PDF endpoint
        })
    
    @action(detail=True, methods=['get'], url_path='receipt-pdf')
    def receipt_pdf(self, request, pk=None):
        """Generate PDF receipt"""
        # Implementation for PDF generation
        # You can use libraries like ReportLab, WeasyPrint, or xhtml2pdf
        booking = self.get_object()
        
        # For now, return a placeholder
        return Response({
            'message': 'PDF receipt generation endpoint',
            'booking_reference': booking.booking_reference,
            'note': 'Implement PDF generation using ReportLab or similar'
        })
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get booking history by phone"""
        phone = request.query_params.get('phone')
        
        if not phone:
            return Response(
                {"error": "Phone parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        bookings = Booking.objects.filter(
            customer_phone=phone
        ).order_by('-booked_date', '-session_start')
        
        page = self.paginate_queryset(bookings)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming bookings"""
        today = timezone.now().date()
        
        # Get bookings from today onwards
        bookings = Booking.objects.filter(
            booked_date__gte=today,
            payment_status__in=['confirmed', 'pending']
        ).order_by('booked_date', 'session_start')
        
        page = self.paginate_queryset(bookings)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Get calendar view"""
        serializer = DailyScheduleSerializer(data=request.query_params)
        
        if serializer.is_valid():
            return Response(serializer.validated_data['schedule'])
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============ QUICK BOOKING VIEW ============
class QuickBookingView(generics.CreateAPIView):
    """Simplified booking endpoint"""
    permission_classes = [AllowAny]
    serializer_class = BookingCreateSerializer
    
    def perform_create(self, serializer):
        """Create booking and send confirmation"""
        booking = serializer.save()
        
        # Send confirmation email
        self.send_booking_confirmation(booking)
    
    def send_booking_confirmation(self, booking):
        """Send booking confirmation email"""
        try:
            subject = f"Booking Confirmation - {booking.booking_reference}"
            
            context = {
                'booking': booking,
                'studio_config': StudioConfig.get_config(),
                'receipt_date': timezone.now().strftime('%d/%m/%Y %I:%M %p'),
            }
            
            text_message = render_to_string('emails/booking_confirmation.txt', context)
            html_message = render_to_string('emails/booking_confirmation.html', context)
            
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.customer_email],
                html_message=html_message,
                fail_silently=True,
            )
            
        except Exception as e:
            print(f"Failed to send confirmation email: {e}")


# ============ WHEEL MANAGEMENT ============
class WheelViewSet(viewsets.ModelViewSet):
    """Wheel management (admin only)"""
    queryset = Wheel.objects.all()
    serializer_class = WheelSerializer
    permission_classes = [IsAuthenticated]  # Admin only
    
    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        """Set wheel status"""
        wheel = self.get_object()
        status = request.data.get('status')
        
        if status not in dict(Wheel.WHEEL_STATUS):
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        wheel.status = status
        wheel.save()
        
        serializer = self.get_serializer(wheel)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def availability(self, request):
        """Check wheel availability for a timeslot"""
        date_str = request.query_params.get('date')
        time_str = request.query_params.get('time')
        
        if not date_str or not time_str:
            return Response(
                {"error": "Date and time parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            time_obj = datetime.strptime(time_str, '%H:%M').time()
        except ValueError:
            return Response(
                {"error": "Invalid date or time format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get available wheels
        from .utils import get_available_wheels_for_timeslot
        available_wheels = get_available_wheels_for_timeslot(
            date, time_obj, require_wheel=True
        )
        
        serializer = self.get_serializer(available_wheels, many=True)
        return Response({
            'date': date_str,
            'time': time_str,
            'available_wheels': serializer.data,
            'count': available_wheels.count()
        })


# ============ POST-SESSION SERVICES ============
class PostSessionServiceViewSet(viewsets.ModelViewSet):
    """Post-session services management"""
    serializer_class = PostSessionServiceCreateSerializer
    permission_classes = [IsAuthenticated]  # Staff only
    
    def get_queryset(self):
        queryset = PostSessionService.objects.all()
        
        # Filter by booking
        booking_id = self.request.query_params.get('booking')
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)
        
        # Filter by customer phone
        phone = self.request.query_params.get('phone')
        if phone:
            queryset = queryset.filter(booking__customer_phone=phone)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create post-session service"""
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark service as paid"""
        service = self.get_object()
        service.is_paid = True
        service.save()
        
        # Send payment confirmation
        self.send_payment_confirmation(service)
        
        return Response({
            'success': True,
            'message': 'Service marked as paid',
            'service': PostSessionServiceCreateSerializer(service).data
        })
    
    def send_payment_confirmation(self, service):
        """Send payment confirmation email"""
        try:
            subject = f"Payment Confirmation - {service.booking.booking_reference}"
            
            context = {
                'service': service,
                'booking': service.booking,
                'date': timezone.now().strftime('%d/%m/%Y %I:%M %p'),
            }
            
            text_message = render_to_string('emails/payment_confirmation.txt', context)
            html_message = render_to_string('emails/payment_confirmation.html', context)
            
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[service.booking.customer_email],
                html_message=html_message,
                fail_silently=True,
            )
            
        except Exception as e:
            print(f"Failed to send payment confirmation email: {e}")


# ============ PRICE LIST VIEWS ============
class FiringChargeViewSet(viewsets.ReadOnlyModelViewSet):
    """Firing charges"""
    queryset = FiringCharge.objects.filter(is_active=True)
    serializer_class = FiringChargeSerializer
    permission_classes = [AllowAny]


class PaintingGlazingOptionViewSet(viewsets.ReadOnlyModelViewSet):
    """Painting/glazing options"""
    queryset = PaintingGlazingOption.objects.filter(is_active=True)
    serializer_class = PaintingGlazingOptionSerializer
    permission_classes = [AllowAny]


class ExtraServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """Extra services"""
    queryset = ExtraService.objects.filter(is_active=True)
    serializer_class = ExtraServiceSerializer
    permission_classes = [AllowAny]


class BookingRuleViewSet(viewsets.ReadOnlyModelViewSet):
    """Booking rules/policies"""
    queryset = BookingRule.objects.filter(is_active=True)
    serializer_class = BookingRuleSerializer
    permission_classes = [AllowAny]


# ============ UTILITY VIEWS ============
@api_view(['GET'])
@permission_classes([AllowAny])
def availability_check(request):
    """Quick availability check endpoint"""
    serializer = AvailabilityCheckSerializer(data=request.query_params)
    
    if serializer.is_valid():
        return Response(serializer.validated_data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def daily_schedule(request):
    """Get daily schedule"""
    serializer = DailyScheduleSerializer(data=request.query_params)
    
    if serializer.is_valid():
        return Response(serializer.validated_data['schedule'])
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def studio_status(request):
    """Get studio status"""
    config = StudioConfig.get_config()
    
    # Get today's bookings count
    today = timezone.now().date()
    today_bookings = Booking.objects.filter(
        booked_date=today,
        payment_status__in=['confirmed', 'pending']
    ).count()
    
    # Get available wheels
    from .utils import get_available_wheels_for_timeslot
    now = timezone.now()
    available_wheels = get_available_wheels_for_timeslot(
        now.date(), now.time(), require_wheel=True
    )
    
    return Response({
        'studio': {
            'name': 'Imani Ceramic',
            'is_open': config.is_open_today,
            'maintenance_mode': config.is_maintenance_mode,
            'maintenance_message': config.maintenance_message,
            'operating_hours': {
                'open': config.operating_time.strftime('%I:%M %p'),
                'close': config.closing_time.strftime('%I:%M %p'),
            }
        },
        'today': {
            'date': today,
            'bookings_count': today_bookings,
            'available_slots': config.max_daily_sessions - today_bookings,
            'available_wheels': available_wheels.count(),
            'total_wheels': config.total_wheels
        }
    })


# ============ EMAIL TEMPLATE VIEWS ============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def email_preview(request, booking_id):
    """Preview email templates for a booking"""
    booking = get_object_or_404(Booking, id=booking_id)
    
    context = {
        'booking': booking,
        'studio_config': StudioConfig.get_config(),
        'date': timezone.now().strftime('%d/%m/%Y %I:%M %p'),
    }
    
    templates = {
        'confirmation': {
            'subject': f"Booking Confirmation - {booking.booking_reference}",
            'text': render_to_string('emails/booking_confirmation.txt', context),
            'html': render_to_string('emails/booking_confirmation.html', context),
        },
        'receipt': {
            'subject': f"Receipt - {booking.booking_reference}",
            'text': render_to_string('emails/receipt.txt', context),
            'html': render_to_string('emails/receipt.html', context),
        }
    }
    
    return Response(templates)

@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def studio_config_endpoint(request):
    """Studio configuration singleton endpoint"""
    config = StudioConfig.get_config()
    
    if request.method == 'GET':
        serializer = StudioConfigSerializer(config)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = StudioConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)