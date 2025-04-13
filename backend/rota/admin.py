from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(User)
admin.site.register(Availability)
admin.site.register(Shift)
admin.site.register(Organisation)
admin.site.register(InviteToken)