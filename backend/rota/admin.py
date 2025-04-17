from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(User)
admin.site.register(Availability)
admin.site.register(Shift)
admin.site.register(Organisation)
admin.site.register(InviteToken)
admin.site.register(Notification)
admin.site.register(NotificationReadStatus)
admin.site.register(ShiftSwapRequest)
admin.site.register(Role)
admin.site.register(ShiftTemplate)
admin.site.register(Chat)
admin.site.register(Message)