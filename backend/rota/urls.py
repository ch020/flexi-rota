from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, AvailabilityViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'availability', AvailabilityViewSet)

urlpatterns = [
    path('', include(router.urls)),
]