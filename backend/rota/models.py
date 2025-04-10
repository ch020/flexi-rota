from datetime import timedelta

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


# Create your models here.
class Organisation(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class InviteToken(models.Model):
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

class User(AbstractUser):
    ROLE_CHOICES = (
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    pay_rate = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True) # hourly rate
    organisation = models.ForeignKey(Organisation, on_delete=models.SET_NULL, null=True, blank=True)

def default_end_time():
    return timezone.now() + timedelta(hours=1)

class Availability(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(default=default_end_time)

    def __str__(self):
        return f"{self.user.username} unavailable from {self.start_time} to {self.end_time}"
