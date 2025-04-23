from django.contrib.auth.password_validation import validate_password
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils import timezone

from .models import *

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']

class BasicUserSerializer(serializers.ModelSerializer):
    role_title = RoleSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'role_title', 'first_name', 'last_name']

class UserSerializer(serializers.ModelSerializer):
    # accept a role’s ID on write
    role_title = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.none(),
        allow_null=True,
        required=False
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'role_title', 'first_name', 'last_name', 'phone_number', 'pay_rate')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request.user, 'organisation'):
            self.fields['role_title'].queryset = Role.objects.filter(organisation=request.user.organisation)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['full_name'] = f"{instance.first_name} {instance.last_name}"
        return rep

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True
    )
    organisation_name = serializers.CharField(
        required=False,
        write_only=True,
        help_text="Required if registering as a manager without an invite"
    )

    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'password',
            'password2',
            'first_name',
            'last_name',
            'phone_number',
            'pay_rate',
            'role',
            'organisation' # Will be set from invite if present
        )
        extra_kwargs = {
            'role': {'read_only': True},
            'organisation': {'read_only': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                'password': "Password fields didn't match."
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        raw_password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(raw_password)
        user.save()
        return user

class AvailabilitySerializer(serializers.ModelSerializer):
    # expose the user ID so front‑end can filter per employee
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Availability
        fields = ['id', 'user', 'start_time', 'end_time']

    def validate(self, data):
        start = data.get('start_time')
        end = data.get('end_time')

        if start and end and end <= start:
            raise serializers.ValidationError("Start time must be before end time.")

        return data

class ShiftRoleRequirementSerializer(serializers.ModelSerializer):
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.none())

    class Meta:
        model = ShiftRoleRequirement
        fields = ['role', 'quantity']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')
        if request and hasattr(request.user, 'organisation'):
            self.fields['role'].queryset = Role.objects.filter(organisation=request.user.organisation)

class ShiftTemplateSerializer(serializers.ModelSerializer):
    required_roles = ShiftRoleRequirementSerializer(
        source='shiftrolerequirement_set', many=True, read_only=True
    )

    class Meta:
        model = ShiftTemplate
        fields = ['id', 'start_time', 'end_time', 'required_roles']

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'

    def validate(self, data):
        start = data.get('start_time')
        end = data.get('end_time')

        if start and end and end <= start:
            raise serializers.ValidationError("Start time must be before end time.")

        return data

class NotificationSerializer(serializers.ModelSerializer):
    read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'message', 'created_at', 'read']

    @extend_schema_field(field=serializers.BooleanField())
    def get_read(self, obj) -> bool:
        user = self.context['request'].user
        return NotificationReadStatus.objects.filter(user=user, notification=obj, read=True).exists()

class SendNotificationSerializer(serializers.Serializer):
    message = serializers.CharField()
    recipients = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True
    )
    roles = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True
    )

    class Meta:
        ref_name = "SendNotification"

class PayEstimateSerializer(serializers.Serializer):
    this_month = serializers.DecimalField(max_digits=10, decimal_places=2)
    last_month = serializers.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ref_name = "PayEstimate"

class ShiftSwapRequestSerializer(serializers.ModelSerializer):
    shift = serializers.PrimaryKeyRelatedField(queryset=Shift.objects.all())
    requested_by = serializers.StringRelatedField()
    requested_to = serializers.StringRelatedField()
    manager_approved = serializers.BooleanField(read_only=True)
    recipient_approved = serializers.BooleanField(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)

    class Meta:
        model = ShiftSwapRequest
        fields = [
            'id',
            'shift',
            'requested_by',
            'requested_to',
            'is_approved',
            'manager_approved',
            'recipient_approved',
            'requested_at',
            'approved_at'
        ]
        read_only_fields = [
            'is_approved',
            'manager_approved',
            'recipient_approved',
            'requested_at',
            'approved_at'
        ]

class EmployeeShiftCountSerializer(serializers.Serializer):
    employee = BasicUserSerializer()
    shifts = serializers.IntegerField()
    weekly_hours = serializers.DictField(
        child=serializers.FloatField(), help_text="Hours worked per ISO week"
    )

    class Meta:
        ref_name = "EmployeeShiftCount"

class FairnessAnalyticsSerializer(serializers.Serializer):
    total_employees = serializers.IntegerField()
    average_shifts = serializers.FloatField()
    fairness_score = serializers.FloatField()
    shift_distribution = EmployeeShiftCountSerializer(many=True)

    class Meta:
        ref_name = "FairnessAnalytics"

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp']

class ChatSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'title', 'participants', 'messages']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True, help_text="Current password")
    new_password = serializers.CharField(write_only=True, required=True, help_text="New password")

    class Meta:
        ref_name = "ChangePasswordRequest"

class InviteLinkResponseSerializer(serializers.Serializer):
    invite_url = serializers.URLField()

class InviteGenerationRequestSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=[("manager", "Manager"), ("employee", "Employee")],
        help_text="Role to assign to the invited user. Must be either 'manager' or 'employee'.",
    )

    class Meta:
        ref_name = "InviteGenerationRequest"

class LogoutRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=True)
