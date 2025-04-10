import secrets
from datetime import timedelta
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes

from rest_framework import viewsets, generics
from .models import User, Availability, InviteToken
from .serializers import UserSerializer, AvailabilitySerializer, RegisterSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from drf_spectacular.utils import extend_schema

# Create your views here.
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

# TEST CLASSES
@extend_schema(
    summary="Test GET request (with no authentication)",
    responses={'200': OpenApiTypes.OBJECT}
)
@api_view(['GET'])
def test_api_noauth(request):
    return Response({"message": "API is working!"})

@extend_schema(
    summary="Test GET request (WITH authentication)",
    responses={'200': OpenApiTypes.OBJECT}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_api_auth(request):
    return Response({"message": f"API is working! Logged in as {request.user.username}"})

# USER CLASSES
@extend_schema(
    summary="Logs the user out",
)
@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    try:
        refresh_token = request.data['refresh']
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"detail": "Logout successful"})
    except Exception as e:
        return Response({"detail": "Invalid refresh token"}, status=400)

# INVITE LINK CLASSES
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_invite(request):
    if request.user.role != 'manager':
        return Response({"detail": "Only managers can generate invites"}, status=403)

    token = secrets.token_urlsafe(16)
    expiry = timezone.now() + timedelta(days=3)

    InviteToken.objects.create(
        organisation=request.user.organisation,
        token=token,
        expires_at=expiry
    )

    invite_url = settings.BACKEND_URL + f"register/?invite={token}"
    return Response({"invite_url": invite_url})