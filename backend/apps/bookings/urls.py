from django.urls import path, include
from rest_framework.routers import DefaultRouter
from bookings import views

router = DefaultRouter()
router.register(r'studio-config', views.StudioConfigViewSet, basename='studio-config')
router.register(r'packages', views.PackageViewSet, basename='package')
router.register(r'bookings', views.BookingViewSet, basename='booking')
router.register(r'wheels', views.WheelViewSet, basename='wheel')
router.register(r'firing-charges', views.FiringChargeViewSet, basename='firing-charge')
router.register(r'painting-options', views.PaintingGlazingOptionViewSet, basename='painting-option')
router.register(r'extra-services', views.ExtraServiceViewSet, basename='extra-service')
router.register(r'booking-rules', views.BookingRuleViewSet, basename='booking-rule')
router.register(r'post-session-services', views.PostSessionServiceViewSet, basename='post-session-service')

urlpatterns = [
    path('api/', include(router.urls)),
    
    # Quick booking
    path('api/quick-booking/', views.QuickBookingView.as_view(), name='quick-booking'),
    
    # Utility endpoints
    path('api/check-availability/', views.availability_check, name='check-availability'),
    path('api/daily-schedule/', views.daily_schedule, name='daily-schedule'),
    path('api/studio-status/', views.studio_status, name='studio-status'),
    path('api/email-preview/<int:booking_id>/', views.email_preview, name='email-preview'),
    
    # Authentication (if needed later)
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]