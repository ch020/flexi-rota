import secrets
from datetime import timedelta
from typing import cast

from django.core.exceptions import PermissionDenied
from django.utils import timezone
from django.conf import settings

from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import User, Availability, InviteToken, Shift, Notification, NotificationReadStatus
from .serializers import UserSerializer, AvailabilitySerializer, RegisterSerializer, ShiftSerializer, \
    NotificationSerializer, SendNotificationSerializer


# Create your views here.
@extend_schema(
    summary="List all users",
    description="Returns a list of all registered users. Requires authentication.",
    responses={200: UserSerializer(many=True)}
)
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

@extend_schema(
    summary="CRUD operations on availability",
    description="Create, retrieve, update, and delete availability periods.\n\n- Regular users: can only see and manage their own availability.\n- Managers: can see and manage all availability entries within their organisation.",
    request=AvailabilitySerializer,
    responses={
        200: AvailabilitySerializer(many=True),
        201: AvailabilitySerializer,
        400: OpenApiResponse(description='Invalid input'),
        403: OpenApiResponse(description='Not authenticated'),
        401: OpenApiResponse(description='Unauthorized'),
    }
)
class AvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]
    queryset = Availability.objects.all()

    def get_queryset(self):
        user = self.request.user

        if user.role == "manager":
            return Availability.objects.filter(user__organisation=user.organisation)
        else:
            return Availability.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if user.role != 'manager' and obj.user != user:
            raise PermissionDenied("You do not have permission to access this object.")
        return obj


@extend_schema(
    summary="Register a new user",
    description="Registers a new user account with required fields: username, password, password2, role, name, email. Optionally accepts phone_number and pay_rate.",
    request=RegisterSerializer,
    responses={
        201: UserSerializer,
        400: OpenApiResponse(description='Passwords did not match or input was invalid')
    }
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

# TEST CLASSES

@extend_schema(
    summary="Test GET request (no authentication required)",
    description="Returns a simple success message to confirm the API is running.",
    responses={200: OpenApiTypes.OBJECT}
)
@api_view(['GET'])
@permission_classes([AllowAny])
def test_api_noauth(request):
    return Response({"message": "API is working!"})

@extend_schema(
    summary="Test GET request (requires authentication)",
    description="Returns a personalized message for the authenticated user.",
    responses={200: OpenApiTypes.OBJECT, 401: OpenApiResponse(description="Unauthorized")}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_api_auth(request):
    return Response({"message": f"API is working! Logged in as {request.user.username}"})

# USER CLASSES
@extend_schema(
    summary="Logout user",
    description="Blacklists the provided refresh token, effectively logging out the user.\n\n**Required field:** `refresh` (string).",
    request=OpenApiTypes.OBJECT,
    responses={
        200: OpenApiResponse(description='Logout successful'),
        400: OpenApiResponse(description='Invalid refresh token')
    }
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
@extend_schema(
    summary="Generate an invite link",
    description="Only accessible by users with role 'manager'.\n\nGenerates a time-limited (3 days) invite link that new employees can use to register under the manager's organisation.",
    responses={
        200: OpenApiTypes.OBJECT,
        403: OpenApiResponse(description='Only managers can generate invites')
    }
)
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

#SHIFT CLASSES
@extend_schema(
    summary="CRUD operations on shifts",
    description="Create, retrieve, update, and delete shifts.\n\n- Regular users: can only see and manage their own shifts.\n- Managers: can see and manage all shift entries within their organisation.",
    request=ShiftSerializer,
    responses={
        200: ShiftSerializer(many=True),
        201: ShiftSerializer,
        400: OpenApiResponse(description='Invalid input'),
        403: OpenApiResponse(description='Not authenticated'),
        401: OpenApiResponse(description='Unauthorized'),
    }
)
class ShiftViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated]
    queryset = Shift.objects.all()

    def get_queryset(self):
        user = cast(User, self.request.user)

        if user.role == "manager":
            return Shift.objects.filter(manager=user)
        else:
            return Shift.objects.filter(employee=user)

    def perform_create(self, serializer):
        user = cast(User, self.request.user)

        if user.role != "manager":
            raise PermissionDenied("Only managers can create shifts")

        serializer.save(manager=user)

    def get_object(self):
        obj = super().get_object()
        user = cast(User, self.request.user)

        if user.role != 'manager' and obj.employee != user:
            raise PermissionDenied("You do not have permission to access this shift.")

        if user.role == 'manager' and obj.manager != user:
            raise PermissionDenied("You do not manage this shift.")

        return obj

@extend_schema(
    summary="Retrieve unread notifications",
    responses=NotificationSerializer(many=True)
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_notifications(request):
    user = request.user
    unread_notifications = Notification.objects.filter(
        recipients=user,
        notificationreadstatus__read=False
    )
    serializer = NotificationSerializer(unread_notifications, many=True, context={'request': request})
    return Response(serializer.data)

@extend_schema(
    summary="Send a notification to one or more users",
    request=SendNotificationSerializer,
    responses={
        201: OpenApiParameter(type='object', description='Confirmation Message'),
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_notification(request):
    if request.user.role != 'manager':
        return Response({"detail": "Only managers can send notifications."}, status=403)

    serializer = SendNotificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    notification = Notification.objects.create(message=data['message'])

    if not data['recipients']:
        users = User.objects.all()
    else:
        users = User.objects.filter(id__in=data['recipients'])

    for user in users:
        NotificationReadStatus.objects.create(notification=notification, user=user)

    return Response({"detail": "Notification sent."}, status=201)

@extend_schema(
    summary="Mark a specific notification as read",
    parameters=[OpenApiParameter("pk", int, OpenApiParameter.PATH)],
    responses={
        200: OpenApiParameter(type='object', description='Read confirmation'),
        404: OpenApiParameter(type='object', description='Notification not found or not assigned')
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    try:
        read_status = NotificationReadStatus.objects.get(user=request.user, notification_id=pk)
        read_status.read = True
        read_status.read_at = timezone.now()
        read_status.save()
        return Response({"detail": "Marked as read."})
    except NotificationReadStatus.DoesNotExist:
        return Response({"detail": "Notification not found or not assigned."}, status=404)