from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import User, Availability, InviteToken
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'name', 'phone_number', 'pay_rate')

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True, validators=[UniqueValidator(queryset=User.objects.all())])
    password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'role', 'name', 'phone_number', 'pay_rate')

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