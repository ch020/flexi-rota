from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import *


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'phone_number', 'pay_rate')

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

        if invite_token:
            try:
                invite = InviteToken.objects.get(token=invite_token, expires_at__gt=timezone.now())
                user.organisation = invite.organisation
            except InviteToken.DoesNotExist:
                raise serializers.ValidationError({"invite": "Invalid or expired invite link"})

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

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        exclude = []

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

    class Meta:
        ref_name = "SendNotificationSerializer"

class PayEstimateSerializer(serializers.Serializer):
    this_month = serializers.DecimalField(max_digits=10, decimal_places=2)
    last_month = serializers.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ref_name = "PayEstimateSerializer"

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
