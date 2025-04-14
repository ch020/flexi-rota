from datetime import timedelta

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import RegexValidator


# Create your models here.
class Organisation(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class InviteToken(models.Model):
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Token for {self.organisation.name} (expires {self.expires_at.date()})"

class User(AbstractUser):
    """
    Represents an authenticated user.
    """
    ROLE_CHOICES = (
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone_number = models.CharField(max_length=15, blank=True, null=True, validators=[
        RegexValidator(
            regex=r'^\+?44\d{10}$',
            message='Enter a valid UK phone number starting with +44 and 10 digits.'
        )
    ])
    pay_rate = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True) # hourly rate
    organisation = models.ForeignKey(Organisation, on_delete=models.SET_NULL, null=True, blank=True)

    REQUIRED_FIELDS = ['first_name', 'last_name', 'email']

def default_end_time():
    return timezone.now() + timedelta(hours=1)

class Availability(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(default=default_end_time)

    def __str__(self):
        return f"{self.user.username} unavailable from {self.start_time} to {self.end_time}"

class Shift(models.Model):
    """
    A work shift assigned to an employee, managed by a specific manager.
    Supports swap requests between users.
    """
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='employee')
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='manager')
    start_time = models.DateTimeField(default=timezone.now, db_index=True)
    end_time = models.DateTimeField(default=default_end_time)
    is_swap_requested = models.BooleanField(default=False)
    swap_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.employee.username}'s shift starts at {self.start_time} to {self.end_time} and is managed by {self.manager.username}"

    def duration_hours(self):
        """Calculates the length of the shift in hours."""
        return (self.end_time - self.start_time).total_seconds() / 3600

class ShiftSwapRequest(models.Model):
    """
    Represents a work shift swapping request.
    """
    shift = models.ForeignKey(Shift, related_name="shift", on_delete=models.CASCADE)
    requested_by = models.ForeignKey(User, related_name="swap_requests_sent", on_delete=models.CASCADE)
    requested_to = models.ForeignKey(User, related_name="swap_requests_received", on_delete=models.CASCADE)
    is_approved = models.BooleanField(default=False) # Final state: both manager and recipient have approved
    manager_approved = models.BooleanField(default=False) # Shift.manager must approve
    recipient_approved = models.BooleanField(default=False) # requested_to must approve
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Swap: {self.shift} → {self.requested_to.username} (Approved: {self.is_approved})"

class Notification(models.Model):
    """
    Represents a notification sent from a manager to one or more users.
    """
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    recipients = models.ManyToManyField(User, through='NotificationReadStatus', related_name='notifications')

    def __str__(self):
        return self.message[:50]

class NotificationReadStatus(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} read {self.notification} = {self.read}"

    class Meta:
        unique_together = ('user', 'notification')