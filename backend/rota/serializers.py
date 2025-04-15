from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

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
    role_title = RoleSerializer()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role','role_title', 'first_name', 'last_name', 'phone_number', 'pay_rate')

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['full_name'] = f"{instance.first_name} {instance.last_name}"
        return rep

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True, validators=[UniqueValidator(queryset=User.objects.all())])
    password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'role', 'first_name', 'last_name', 'phone_number', 'pay_rate')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        invite_token = self.context['request'].query_params.get('invite')

        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = User(**validated_data)

        if user.role == 'employee':
            if invite_token:
                try:
                    invite = InviteToken.objects.get(token=invite_token, expires_at__gt=timezone.now())
                    user.organisation = invite.organisation
                except InviteToken.DoesNotExist:
                    raise serializers.ValidationError({"invite": "Invalid or expired invite link"})
            else:
                raise serializers.ValidationError({"invite": "Invite token is required for employees."})

        user.set_password(password)
        user.save()
        return user

class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        exclude = ['user']

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

    def get_read(self, obj):
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