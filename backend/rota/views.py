import secrets
from calendar import monthrange
from collections import defaultdict
from datetime import datetime
from statistics import stdev, mean
from typing import cast

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from rest_framework import status
from rest_framework import viewsets, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import *


@extend_schema(
    summary="Manage roles within an organisation",
    description="Only managers can view, create, or delete roles in their organisation.",
    responses={200: RoleSerializer(many=True)},
    tags=["Roles"]
)
class RoleViewSet(viewsets.ModelViewSet):
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return Role.objects.filter(organisation=user.organisation)

    def perform_create(self, serializer):
        user = cast(User, self.request.user)
        if user.role != 'manager':
            raise PermissionDenied("Only managers can create roles.")
        serializer.save(organisation=user.organisation)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'manager':
            return Response({"detail": "Only managers can delete roles."}, status=403)
        return super().destroy(request, *args, **kwargs)

@extend_schema(
    summary="Manage shift templates (unassigned shifts)",
    description="Create, update, and list unassigned shift templates. These represent future shift needs before employee assignment.",
    responses={200: ShiftTemplateSerializer(many=True)},
    tags=["Shifts"]
)
class ShiftTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = ShiftTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShiftTemplate.objects.filter(manager=self.request.user)

    def perform_create(self, serializer):
        serializer.save(manager=self.request.user)

    @extend_schema(
        summary="Add or update required roles for a shift template",
        description="Specify how many employees of each role are needed for this shift template. This will be used in auto-assignment.",
        request=ShiftRoleRequirementSerializer(many=True),
        responses={
            200: OpenApiResponse(
                description="Roles set",
                examples=[
                    OpenApiExample(
                        "Set required roles",
                        value=[
                            {"role": 3, "quantity": 2},
                            {"role": 5, "quantity": 1}
                        ]
                    )
                ]
            )
        },
        tags=["Shifts"]
    )
    @action(detail=True, methods=["post"], url_path='set-roles')
    def set_roles(self, request, pk=None):
        shift_template = self.get_object()
        ShiftRoleRequirement.objects.filter(shift_template=shift_template).delete()

        # support either POST [ {...}, {...} ]  or  { roles: [ {...}, {...} ] }
        payload = request.data.get('roles') if isinstance(request.data, dict) else request.data
        serializer = ShiftRoleRequirementSerializer(data=payload or [], many=True)

        serializer.is_valid(raise_exception=True)
        for item in serializer.validated_data:
            ShiftRoleRequirement.objects.create(
                shift_template=shift_template,
                role=item['role'],
                quantity=item['quantity'],
            )

        return Response({"detail": "Role updated successfully."})

@extend_schema(
    summary="List all users",
    description="Returns a list of all registered users. Requires authentication.",
    responses={200: UserSerializer(many=True)},
    tags=["Users"]
)
class UserViewSet(viewsets.ModelViewSet):              # ← allow PATCH
    # base queryset so router can infer basename
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            # show everyone in the same organisation
            return User.objects.filter(organisation=user.organisation)
        # otherwise only yourself
        return User.objects.filter(id=user.id)

    def partial_update(self, request, *args, **kwargs):
        # only managers can change other users’ roles
        if request.user.role != 'manager':
            if request.user.id != kwargs['pk']:
                return Response({"detail": "Only managers can change other users."}, status=403)
        return super().partial_update(request, *args, **kwargs)

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
    # base queryset so router can infer `basename="availability"`
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        now = timezone.now()
        # 1) delete any expired slots
        Availability.objects.filter(end_time__lt=now).delete()

        user = self.request.user
        # 2) managers see everyone’s future/current slots
        if user.role == "manager":
            return Availability.objects.filter(
                user__organisation=user.organisation,
                end_time__gte=now
            )
        # 3) regular users see only their own future/current slots
        return Availability.objects.filter(
            user=user,
            end_time__gte=now
        )

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
    authentication_classes = []      # ← disable JWT/session auth here
    permission_classes     = [AllowAny]  # ← allow anyone to register

    def create(self, request, *args, **kwargs):
        invite_token = request.query_params.get("invite")
        role         = "employee"
        org          = None

        if invite_token:
            try:
                inv = InviteToken.objects.get(token=invite_token, expires_at__gte=timezone.now())
                role = inv.role            # "manager" or "employee"
                org  = inv.organisation
                inv.delete()              # one‐time use
            except InviteToken.DoesNotExist:
                return Response({"detail":"Invalid or expired invite."}, status=400)

        # inject role/org into the incoming data
        data = request.data.copy()
        data["role"] = role
        if org:
            data["organisation"] = org.pk

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        headers = self.get_success_headers(serializer.data)

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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
    request=LogoutRequestSerializer,
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
    description="""
Generates a unique invite link allowing a new user to register and join the authenticated manager's organisation.  
Only users with the `manager` role can access this endpoint.

The generated invite is valid for 3 days and is tied to the manager’s organisation.  
The `role` parameter determines whether the invited user will be a `manager` or an `employee`.

This endpoint is typically used for onboarding new team members while ensuring that only authorized managers can control access to their organisation.

### Request Body
- `role`: `"employee"` or `"manager"`  
  Determines the role assigned to the user when they sign up using the invite link.

### Behavior
- Requires authentication (`JWT`).
- Returns a unique `invite_url` for the frontend to distribute.
- Automatically sets the correct `organisation` and `role` for the invited user.
- Invite expires in 72 hours.

### Notes
- If no role is specified or an invalid role is passed, the server will still attempt to store it—consider adding input validation if needed.
- This endpoint does not currently validate the input role field against a strict set (`employee`, `manager`).
    """,
    request=InviteGenerationRequestSerializer,
    examples=[
        OpenApiExample(
            "Generate employee invite",
            value={"role": "employee"},
            request_only=True,
            description="Creates a link allowing an employee to register under the manager’s organisation."
        ),
        OpenApiExample(
            "Generate manager invite",
            value={"role": "manager"},
            request_only=True,
            description="Creates a link for another manager to join the organisation."
        )
    ],
    responses={
      201: OpenApiResponse(InviteLinkResponseSerializer, description="Invite link created"),
      403: OpenApiResponse(description="Only managers can generate invites")
    },
    tags=["Users"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_invite(request):
    if request.user.role != 'manager':
        return Response({"detail": "Only managers can generate invites"}, status=403)

    serializer = InviteGenerationRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    role = serializer.validated_data.get('role', 'employee')
    if role not in ('employee', 'manager'):
        return Response({"detail": "Invalid role"}, status=400)

    token      = secrets.token_urlsafe(16)
    expires_at = timezone.now() + timedelta(days=3)

    InviteToken.objects.create(
        organisation=request.user.organisation,
        role=role,
        token=token,
        expires_at=expires_at,
    )
    invite_url = settings.BACKEND_URL + f"api/register/?invite={token}"
    return Response({"invite_url": invite_url}, status=201)

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
        if user.role == 'manager' and obj.manager != user:
            raise PermissionDenied("You do not manage this shift.")
        if user.role != 'manager' and obj.employee != user:
            raise PermissionDenied("You do not have permission to access this shift.")
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
    serializer = SendNotificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    roles      = serializer.validated_data.get("roles", [])
    recipients = serializer.validated_data.get("recipients", [])
    message    = serializer.validated_data["message"]

    # build a queryset of users by role_title or explicit recipients
    users = User.objects.none()
    if roles:
        users = users | User.objects.filter(role_title__in=roles)
    if recipients:
        users = users | User.objects.filter(id__in=recipients)
    users = users.distinct()

    # 1) Create the notification
    notif = Notification.objects.create(message=message)

    # 2) Manually link each user via the through‑table (and track unread status)
    for u in users:
        NotificationReadStatus.objects.create(
            user=u,
            notification=notif,
            read=False
        )

    return Response({"detail":"Notifications sent"}, status=status.HTTP_201_CREATED)

@extend_schema(
    summary="Mark a specific notification as read",
    parameters=[OpenApiParameter("pk", int, OpenApiParameter.PATH, required=True, description="ID of the notification to mark as read")],
    responses={
        200: OpenApiResponse(OpenApiTypes.OBJECT, description='Read confirmation'),
        404: OpenApiResponse(OpenApiTypes.OBJECT, description='Notification not found or not assigned')
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
    request=ShiftSwapRequestSerializer,
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
    request=None,
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
    request=None,
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

# CHAT VIEWS
@extend_schema(
    summary="Create a new chat",
    description="Only managers can create a chat with specific users, roles, or both. The users must belong to the same organisation.",
    request=OpenApiTypes.OBJECT,
    examples=[
        OpenApiExample(
            "Create a chat with selected users and roles",
            value={
                "title": "Kitchen Staff Group",
                "user_ids": [4, 7],
                "role_ids": [2]
            }
        )
    ],
    responses={201: ChatSerializer},
    tags=["Chats"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_chat(request):
    if request.user.role != 'manager':
        return Response({'detail': 'Only managers can create chats.'}, status=403)

    title = request.data.get('title')
    user_ids = request.data.get('user_ids', [])
    role_ids = request.data.get('role_ids', [])

    if not title:
        return Response({'detail': 'Title is required.'}, status=400)

    chat = Chat.objects.create(title=title, created_by=request.user)

    users = User.objects.filter(id__in=user_ids, organisation=request.user.organisation)
    roles = Role.objects.filter(id__in=role_ids, organisation=request.user.organisation)

    for role in roles:
        users |= User.objects.filter(role_title=role)

    chat.participants.set(users.distinct())
    chat.save()
    return Response(ChatSerializer(chat).data, status=201)

@extend_schema(
    summary="Send a message in a chat",
    description="Send a new message in a specified chat. The user must be a participant of the chat.",
    request=OpenApiTypes.OBJECT,
    parameters=[
        OpenApiParameter(name="chat_id", type=int, location=OpenApiParameter.PATH, description="Chat ID")
    ],
    examples=[
        OpenApiExample(
            "Send a message",
            value={"content": "Don't forget the shift tomorrow at 9am!"}
        )
    ],
    responses={200: MessageSerializer},
    tags=["Chats"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, chat_id):
    chat = Chat.objects.get(id=chat_id)
    if request.user not in chat.participants.all():
        return Response({'detail': 'You are not a participant of this chat.'}, status=403)
    content = request.data.get('content')
    if not content:
        return Response({'detail': 'Message content is required.'}, status=400)
    message= Message.objects.create(chat=chat, sender=request.user, content=content)
    return Response(MessageSerializer(message).data)

@extend_schema(
    summary="Delete a message",
    description="Deletes a message sent by the user. Only the sender of the message can delete it.",
    parameters=[
        OpenApiParameter(name="message_id", type=int, location=OpenApiParameter.PATH, description="Message ID")
    ],
    responses={
        200: OpenApiResponse(description="Message deleted"),
        404: OpenApiResponse(description="Message not found or permission denied")
    },
    tags=["Chats"]
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    try:
        message = Message.objects.get(id=message_id, sender=request.user)
        message.delete()
        return Response({'detail': 'Message deleted.'})
    except Message.DoesNotExist:
        return Response({'detail': 'Message not found or you are not the sender.'}, status=404)

@extend_schema(
    summary="Get all messages in a chat",
    description="Returns all messages for a given chat ID. The user must be a participant in the chat.",
    parameters=[
        OpenApiParameter(name="chat_id", type=int, location=OpenApiParameter.PATH, description="Chat ID")
    ],
    responses={200: MessageSerializer(many=True)},
    tags=["Chats"]
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_messages(request, chat_id):
    chat = Chat.objects.get(id=chat_id)
    if request.user not in chat.participants.all():
        return Response({'detail': 'You are not a participant of this chat.'}, status=403)
    messages = chat.messages.all()
    return Response(MessageSerializer(messages, many=True).data)

@extend_schema(
    summary="Automatically assign unassigned shifts based on required roles and fairness",
    description="Assigns employees to all existing shift templates. Ensures fairness by distributing shifts across the least-burdened users.",
    request=None,
    responses={
        201: OpenApiResponse(
            description="Assignment success or failure",
            examples=[
                OpenApiExample(
                    "Success",
                    value={"detail": "Shifts auto-assigned based on fairness and role requirements."},
                    response_only=True
                ),
                OpenApiExample(
                    "Failure",
                    value={"detail": "Not enough users with role 'Chef' to fill shift template 4."},
                    response_only=True
                )
            ]
        )
    },
    tags=["Shifts"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auto_assign_shifts(request):
    if request.user.role != 'manager':
        return Response({'detail': 'Only managers can auto-assign shifts.'}, status=403)

    templates = ShiftTemplate.objects.filter(manager=request.user)

    past_weeks = timezone.now() - timedelta(weeks=4)
    employees = User.objects.filter(role='employee', organisation=request.user.organisation)

    workload = {
        emp.id: Shift.objects.filter(
            employee=emp,
            start_time__gte=past_weeks
        ).aggregate(
            hours=models.Sum(models.F('end_time') - models.F('start_time'))
        )['hours'] or timedelta()
        for emp in employees
    }

    for template in templates:
        role_requirements = ShiftRoleRequirement.objects.filter(shift_template=template)
        assigned_users = set()

        for req in role_requirements:
            eligible_users = [u for u in employees if u.role_title == req.role and u.id not in assigned_users]
            sorted_users = sorted(eligible_users, key=lambda u: workload[u.id])

            if len(sorted_users) < req.quantity:
                return Response({
                    "detail": f"Not enough users with role '{req.role.name}' to fill shift template {template.id}."
                }, status=400)

            for user in sorted_users[:req.quantity]:
                Shift.objects.create(
                    manager=template.manager,
                    start_time=template.start_time,
                    end_time=template.end_time,
                    employee=user
                )
                assigned_users.add(user)
                workload[user.id] += template.end_time - template.start_time

        template.delete()

    return Response({'detail': 'Shifts auto-assigned based on fairness and role requirements.'}, status=201)

@extend_schema(
    summary="Change user password",
    description="Allows an authenticated user to change their password by providing the current and new password.",
    request=ChangePasswordSerializer,
    examples=[
        OpenApiExample(
            "Change Password",
            value={
                "old_password": "currentPassword123",
                "new_password": "newSecurePassword456"
            },
            request_only=True
        )
    ],
    responses={
        200: OpenApiResponse(description="Password changed successfully"),
        400: OpenApiResponse(description="Invalid input or current password is incorrect"),
        401: OpenApiResponse(description="Authentication credentials were not provided")
    },
    tags=["Users"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = cast(User, request.user)
    old_password = serializer.validated_data["old_password"]
    new_password = serializer.validated_data["new_password"]

    if not user.check_password(old_password):
        return Response({"detail": "Current password is incorrect."}, status=400)

    try:
        validate_password(new_password, user=user)
    except serializers.ValidationError as e:
        return Response({"detail": e.messages}, status=400)

    user.set_password(new_password)
    user.save()
    return Response({"detail": "Password changed successfully."}, status=200)

@extend_schema(
    summary="Get current authenticated user",
    description="""
Returns the authenticated user's full profile, including username, email, role, role title, contact information, and pay rate.

This endpoint is useful for pre-filling forms or displaying the current user's settings and details in your frontend application.

**Authentication is required.**
""",
    responses={
        200: OpenApiResponse(
            response=UserSerializer,
            description="Authenticated user's information",
            examples=[
                OpenApiExample(
                    name="Successful Response",
                    value={
                        "id": 12,
                        "username": "jdoe",
                        "email": "jdoe@example.com",
                        "role": "employee",
                        "role_title": 5,
                        "first_name": "John",
                        "last_name": "Doe",
                        "phone_number": "+447123456789",
                        "pay_rate": "12.50",
                        "full_name": "John Doe"
                    },
                    response_only=True
                )
            ]
        ),
        401: OpenApiResponse(
            description="Unauthorized – user is not authenticated",
            examples=[
                OpenApiExample(
                    name="No Credentials",
                    value={"detail": "Authentication credentials were not provided."},
                    response_only=True
                )
            ]
        )
    },
    tags=["Users"]
)
@api_view(['GET']) #newly added to return the current user
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_template(request, pk):
    # only managers
    if request.user.role != 'manager':
        return Response({"detail":"Only managers can assign shifts"}, status=403)

    tmpl = get_object_or_404(
        ShiftTemplate, id=pk, manager=request.user
    )

    user_id = request.data.get("user_id")
    if not user_id:
        return Response({"detail":"user_id required"}, status=400)

    emp = get_object_or_404(
        User, id=user_id, organisation=request.user.organisation
    )

    # create real Shift and drop the template
    shift = Shift.objects.create(
        employee=emp,
        manager = request.user,
        start_time=tmpl.start_time,
        end_time=tmpl.end_time
    )
    tmpl.delete()

    return Response(ShiftSerializer(shift).data)
