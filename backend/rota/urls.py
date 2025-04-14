from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'availability', AvailabilityViewSet)
router.register(r'shift', ShiftViewSet)

urlpatterns = [
    path('testnoauth/', test_api_noauth),
    path('testauth/', test_api_auth),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', logout_view, name='auth_logout'),
    path('generate-invite/', generate_invite, name='generate_invite'),
    path('notifications/', get_unread_notifications, name='get_unread_notifications'),
    path('notifications/send/', send_notification, name='send_notification'),
    path('notifications/<int:pk>/read/', mark_notification_read, name='mark_notification_read'),
    path('pay-estimate/', pay_estimate, name='pay_estimate'),
    path('swaps/request/', request_swap, name='request_swap'),
    path('swaps/pending/', get_pending_swaps, name='get_pending_swaps'),
    path('swaps/approve/<int:id>/', approve_swap, name='approve_swap'),
    path('swaps/reject/<int:id>/', reject_swap, name='reject_swap'),
    path('analytics/fairness/', shift_fairness_analytics, name='shift_fairness_analytics'),
    path('', include(router.urls)),
]