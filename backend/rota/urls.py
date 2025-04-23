from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rota.views import logout_view

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'availability', AvailabilityViewSet)
router.register(r'shift', ShiftViewSet)
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'shift-templates', ShiftTemplateViewSet, basename='shift-template')

urlpatterns = [
    # AUTH
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', logout_view, name='auth_logout'),
    path("users/change-password/", change_password, name="change-password"),
    path("users/me/", current_user, name="current-user"),

    # USERS & ROLES
    path('generate-invite/', generate_invite, name='generate_invite'),

    # NOTIFICATIONS
    path('notifications/', get_unread_notifications, name='get_unread_notifications'),
    path('notifications/send/', send_notification, name='send_notification'),
    path('notifications/<int:pk>/read/', mark_notification_read, name='mark_notification_read'),

    # SHIFTS & AVAILABILITY
    path('shifts/auto-assign/', auto_assign_shifts, name='auto_assign_shifts'),
    path('pay-estimate/', pay_estimate, name='pay_estimate'),

    # SWAPS
    path('swaps/request/', request_swap, name='request_swap'),
    path('swaps/pending/', get_pending_swaps, name='get_pending_swaps'),
    path('swaps/approve/<int:id>/', approve_swap, name='approve_swap'),
    path('swaps/reject/<int:id>/', reject_swap, name='reject_swap'),

    # ANALYTICS
    path('analytics/fairness/', shift_fairness_analytics, name='shift_fairness_analytics'),

    # CHATS
    path('chats/create/', create_chat, name='create_chat'),
    path('chats/<int:chat_id>/send/', send_message, name='send_message'),
    path('chats/<int:chat_id>/messages/', get_chat_messages, name='get_chat_messages'),
    path('messages/<int:message_id>/delete/', delete_message, name='delete_message'),

    # TEST
    path('testnoauth/', test_api_noauth),
    path('testauth/', test_api_auth),

    path("check-org-availability/", check_org_availability, name="check-org-availability"),
    # ROUTER
    path('', include(router.urls)),
]
