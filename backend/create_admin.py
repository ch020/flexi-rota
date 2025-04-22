import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

if os.getenv("SKIP_ADMIN", "False").lower() == "true":
    print("ℹ️ SKIP_ADMIN is True — skipping superuser creation.")
    exit()

User = get_user_model()

username = os.getenv("ADMIN_USERNAME", "admin")
email = os.getenv("ADMIN_EMAIL", "admin@example.com")
password = os.getenv("ADMIN_PASSWORD", "adminpass")
first_name = os.getenv("ADMIN_FIRSTNAME", "Admin")
last_name = os.getenv("ADMIN_LASTNAME", "User")

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    print("✅ Superuser created.")
else:
    print("ℹ️ Superuser already exists.")