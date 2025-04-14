import secrets
from calendar import monthrange
from collections import defaultdict
from datetime import datetime
from statistics import stdev, mean
from typing import cast

from django.conf import settings
from django.core.exceptions import PermissionDenied
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from rest_framework import viewsets, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import *


# Create your views here.
@extend_schema(
    summary="List all users",
    description="Returns a list of all registered users. Requires authentication.",
    responses={200: UserSerializer(many=True)},
    tags=["Users"]
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
        401: OpenApiResponse(description='Not authenticated'),
        403: OpenApiResponse(description='Unauthorized'),
    },
    tags=["Availabilities"]
)
class AvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]
    queryset = Availability.objects.all()

    def get_queryset(self):
        user = cast(User, self.request.user)

        if user.role == "manager":
            return Availability.objects.filter(user__organisation=user.organisation)
        else:
            return Availability.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_object(self):
        obj = super().get_object()
        user = cast(User, self.request.user)
        if user.role != 'manager' and obj.user != user:
            raise PermissionDenied("You do not have permission to access this object.")
        return obj


@extend_schema(
    summary="Register a new user",
    description="Registers a new user account. If an invite token is present in the query string, links the user to an organisation.",
    request=RegisterSerializer,
    responses={
        201: UserSerializer,
        400: OpenApiResponse(description='Passwords did not match or input was invalid')
    },
    examples=[
        OpenApiExample(
            "Register as Employee",
            value={
                "username": "testuser",
                "email": "test@example.com",
                "password": "strongpassword123",
                "password2": "strongpassword123",
                "role": "employee",
                "first_name": "Test",
                "last_name": "User",
                "phone_number": "+447123456789",
                "pay_rate": "10.50"
            }
        )
    ],
    tags=["Users"]
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

# TEST CLASSES

# noinspection PyUnusedLocal
@extend_schema(
    summary="Test GET request (no authentication required)",
    description="Returns a simple success message to confirm the API is running.",
    responses={200: OpenApiTypes.OBJECT},
    tags=["Tests"]
)
@api_view(['GET'])
@permission_classes([AllowAny])
def test_api_noauth(request):
    return Response({"message": "API is working!"})

@extend_schema(
    summary="Test GET request (requires authentication)",
    description="Returns a personalized message for the authenticated user.",
    responses={200: OpenApiTypes.OBJECT, 401: OpenApiResponse(description="Unauthorized")},
    tags=["Tests"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_api_auth(request):
    return Response({"message": f"API is working! Logged in as {request.user.username}"})

# USER CLASSES
# noinspection PyBroadException
@extend_schema(
    summary="Logout user",
    description="Blacklists the provided refresh token, effectively logging out the user.\n\n**Required field:** `refresh` (string).",
    request={
        "type": "object",
        "properties": {
            "refresh": {"type": "string", "example": "your-refresh-token"}
        },
        "required": ["refresh"]
    },
    responses={
        200: OpenApiResponse(description='Logout successful'),
        400: OpenApiResponse(description='Invalid refresh token')
    },
    tags=["Users"]
)
@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    try:
        refresh_token = request.data['refresh']
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"detail": "Logout successful"})
    except Exception:
        return Response({"detail": "Invalid refresh token"}, status=400)

# INVITE LINK CLASSES
@extend_schema(
    summary="Generate an invite link",
    description="Only accessible by users with role 'manager'.\n\nGenerates a time-limited (3 days) invite link that new employees can use to register under the manager's organisation.",
    responses={
        200: OpenApiTypes.OBJECT,
        403: OpenApiResponse(description='Only managers can generate invites')
    },
    tags=["Users"]
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
        401: OpenApiResponse(description='Not authenticated'),
        403: OpenApiResponse(description='Unauthorized'),
    },
    tags=["Shifts"]
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
    responses=NotificationSerializer(many=True),
tags=["Notifications"]
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
        201: OpenApiResponse(
            description="Confirmation Message",
            examples=[
                OpenApiExample(
                    "Success",
                    value={"detail": "Notification sent."},
                    response_only=True
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Send to All Users",
            value={"message": "Shift schedule updated", "recipients": []}
        ),
        OpenApiExample(
            "Send to Specific Users",
            value={"message": "Meeting at 10am", "recipients": [2, 5]}
        )
    ],
    tags=["Notifications"]
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
    parameters=[OpenApiParameter("pk", int, OpenApiParameter.PATH, required=True, description="ID of the notification to mark as read")],
    responses={
        200: OpenApiResponse(description='Read confirmation'),
        404: OpenApiResponse(description='Notification not found or not assigned')
    },
    tags=["Notifications"]
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

@extend_schema(
    summary="Estimate gross pay for current and previous month",
    responses={200: OpenApiResponse(
        response=PayEstimateSerializer,
        description="Estimated pay breakdown",
        examples=[
            OpenApiExample(
                "Example Response",
                value={
                    "this_month": "387.50",
                    "last_month": "472.00"
                },
                response_only=True
            )
        ]
    )},
    tags=["Analytics"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pay_estimate(request):
    user = request.user
    now = timezone.now()

    def calculate_pay(year, month):
        first = datetime(year, month, 1)
        last = datetime(year, month, monthrange(year, month)[1], 23, 59, 59)
        shifts = Shift.objects.filter(employee=user, start_time__range=(first, last))
        total_hours = sum([(s.end_time - s.start_time).total_seconds() / 3600 for s in shifts])
        return round(total_hours * user.pay_rate, 2)

    this_month_pay = calculate_pay(now.year, now.month)
    last_month = (now.replace(day=1) - timedelta(days=1))
    last_month_pay = calculate_pay(last_month.year, last_month.month)

    return Response({
        "this_month": this_month_pay,
        "last_month": last_month_pay,
    })

@extend_schema(
    summary="Request a shift swap",
    responses={
        201: OpenApiResponse(
            description="Swap request submitted",
            examples=[
                OpenApiExample(
                    "Success",
                    value={"detail": "Swap request submitted."},
                    response_only=True
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Request Swap",
            value={
                "shift": 12,
                "requested_by": 3,
                "requested_to": 7
            }
        )
    ],
    tags=["Shifts"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_swap(request):
    serializer = ShiftSwapRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"detail": "Swap request submitted."}, status=201)

@extend_schema(
    summary="Get pending swap requests relevant to the user",
    responses={200: ShiftSwapRequestSerializer(many=True)},
    tags=["Shifts"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_swaps(request):
    swaps = ShiftSwapRequest.objects.filter(
        is_approved=False,
        manager_approved=False
    ).filter(
        models.Q(shift__manager=request.user) |
        models.Q(requested_to=request.user)
    )
    serializer = ShiftSwapRequestSerializer(swaps, many=True)
    return Response(serializer.data)

@extend_schema(
    summary="Approve a shift swap request",
    parameters=[OpenApiParameter(name="id", type=int, location=OpenApiParameter.PATH)],
    responses={
        200: OpenApiResponse(
            description="Approval registered",
            examples=[
                OpenApiExample(
                    "Manager or Recipient Approved",
                    value={"detail": "Approval recorded. Waiting for the other party."},
                    response_only=True
                ),
                OpenApiExample(
                    "Swap Fully Approved",
                    value={"detail": "Swap fully approved and completed."},
                    response_only=True
                )
            ]
        ),
        403: OpenApiResponse(
            description="Permission denied",
            examples=[
                OpenApiExample(
                    "Not Allowed",
                    value={"detail": "Only the shift manager or proposed user can approve this swap."},
                    response_only=True
                )
            ]
        ),
        404: OpenApiResponse(
            description="Swap request not found",
            examples=[
                OpenApiExample(
                    "Invalid ID",
                    value={"detail": "Swap request not found."},
                    response_only=True
                )
            ]
        )
    },
    tags=["Shifts"]
)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def approve_swap(request, id):
    try:
        swap = ShiftSwapRequest.objects.get(id=id)
    except ShiftSwapRequest.DoesNotExist:
        return Response({"detail": "Swap request not found."}, status=404)

    user = request.user
    shift = swap.shift

    if user == shift.manager:
        swap.manager_approved = True
    elif user == swap.requested_to:
        swap.recipient_approved = True
    else:
        return Response({"detail": "Only the shift manager or proposed user can approve this swap."}, status=403)

    if swap.manager_approved and swap.recipient_approved:
        swap.is_approved = True
        swap.approved_at = timezone.now()
        shift.employee = swap.requested_to
        shift.swap_approved = True
        shift.is_swap_requested = False
        shift.save()
        swap.save()
        return Response({"detail": "Swap fully approved and completed."})

    swap.save()
    return Response({"detail": "Approval recorded. Waiting for the other party."})

@extend_schema(
    summary="Reject a shift swap request",
    parameters=[OpenApiParameter(name="id", type=int, location=OpenApiParameter.PATH)],
    responses={
        200: OpenApiResponse(
            description="Swap request rejected",
            examples=[
                OpenApiExample(
                    "Rejected",
                    value={"detail": "Swap request has been rejected."},
                    response_only=True
                )
            ]
        ),
        403: OpenApiResponse(
            description="Permission denied",
            examples=[
                OpenApiExample(
                    "Not Allowed",
                    value={"detail": "Only the manager or recipient can reject this request."},
                    response_only=True
                )
            ]
        ),
        404: OpenApiResponse(
            description="Swap request not found",
            examples=[
                OpenApiExample(
                    "Invalid ID",
                    value={"detail": "Swap request not found."},
                    response_only=True
                )
            ]
        )
    },
    tags=["Shifts"]
)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def reject_swap(request, id):
    try:
        swap = ShiftSwapRequest.objects.get(id=id)
    except ShiftSwapRequest.DoesNotExist:
        return Response({"detail": "Swap request not found."}, status=404)

    user = request.user
    shift = swap.shift

    if user != shift.manager and user != swap.requested_to:
        return Response({"detail": "Only the manager or recipient can reject this request."}, status=403)

    swap.is_approved = False
    swap.manager_approved = False
    swap.recipient_approved = False
    swap.approved_at = None
    shift.swap_approved = False
    shift.is_swap_requested = False

    swap.save()
    shift.save()

    return Response({"detail": "Swap request has been rejected."})

@extend_schema(
    summary="View shift distribution fairness within an organisation",
    responses={
        200: OpenApiResponse(
            response=FairnessAnalyticsSerializer,
            description="Shift count and weekly hours breakdown",
            examples=[
                OpenApiExample(
                    "Example Response",
                    value={
                        "total_employees": 3,
                        "average_shifts": 4.0,
                        "fairness_score": 0.88,
                        "shift_distribution": [
                            {
                                "employee": {
                                    "id": 7,
                                    "username": "alice",
                                    "first_name": "Alice",
                                    "last_name": "Evans"
                                },
                                "shifts": 5,
                                "weekly_hours": {
                                    "2025-W15": 40.0,
                                    "2025-W16": 36.5
                                }
                            },
                            {
                                "employee": {
                                    "id": 8,
                                    "username": "bob",
                                    "first_name": "Bob",
                                    "last_name": "Smith"
                                },
                                "shifts": 3,
                                "weekly_hours": {
                                    "2025-W15": 24.0,
                                    "2025-W16": 30.0
                                }
                            }
                        ]
                    },
                    response_only=True
                )
            ]
        )
    },
    tags=["Analytics"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shift_fairness_analytics(request):
    user = request.user

    if user.role != 'manager':
        return Response({"detail": "Only managers can access this data."}, status=403)

    employees = User.objects.filter(organisation=user.organisation, role='employee')
    now = timezone.now()
    start_date = now - timedelta(weeks=4)

    data = []
    shift_counts = []

    for emp in employees:
        shifts = Shift.objects.filter(
            employee=emp,
            start_time__gte=start_date,
        )

        shift_count = shifts.count()
        shift_counts.append(shift_count)

        weekly_totals = defaultdict(float)
        for shift in shifts:
            week_label = shift.start_time.strftime("%Y-W%V")
            weekly_totals[week_label] += shift.duration_hours()

        data.append({
            "employee": BasicUserSerializer(emp).data,
            "shifts": shift_count,
            "weekly_hours": {week: round(hours, 2) for week, hours in weekly_totals.items()}
        })

    avg = mean(shift_counts) if shift_counts else 0
    fairness = 1 / (1 + stdev(shift_counts)) if len(shift_counts) > 1 else 1.0

    return Response({
        "total_employees": employees.count(),
        "average_shifts": round(avg, 2),
        "fairness_score": round(fairness, 2),
        "shift_distribution": data
    })


