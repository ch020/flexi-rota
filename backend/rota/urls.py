from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AvailabilityViewSet, test_api_noauth, test_api_auth, RegisterView, logout_view, \
    generate_invite, ShiftViewSet
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
    path('', include(router.urls)),
]