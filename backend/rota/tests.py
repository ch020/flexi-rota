from django.test import TestCase
from django.contrib.auth import get_user_model
from rota.models import Shift, Organisation
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ValidationError

User = get_user_model()

class ShiftTests(TestCase):
    def setUp(self):
        # Create an organisation
        self.organisation = Organisation.objects.create(name="Test Organisation")

        # Create a manager
        self.manager = User.objects.create_user(
            username="manager1",
            password="password123",
            role="manager",
            organisation=self.organisation
        )

        # Create an employee
        self.employee = User.objects.create_user(
            username="employee1",
            password="password123",
            role="employee",
            organisation=self.organisation
        )

    def test_add_shift_for_employee(self):
        """
        Test adding a shift for an employee under a manager.
        """
        start_time = timezone.now()  # Use timezone-aware datetime
        end_time = start_time + timedelta(hours=8)

        # Create a shift
        shift = Shift.objects.create(
            employee=self.employee,
            manager=self.manager,
            start_time=start_time,
            end_time=end_time
        )

        # Verify the shift was created
        self.assertEqual(Shift.objects.count(), 1)
        self.assertEqual(shift.employee, self.employee)
        self.assertEqual(shift.manager, self.manager)
        self.assertEqual(shift.start_time, start_time)
        self.assertEqual(shift.end_time, end_time)

    def test_query_shifts_for_employee(self):
        """
        Test querying shifts for a specific employee.
        """
        start_time1 = timezone.now()
        end_time1 = start_time1 + timedelta(hours=8)
        Shift.objects.create(
            employee=self.employee,
            manager=self.manager,
            start_time=start_time1,
            end_time=end_time1
        )

        start_time2 = timezone.now() + timedelta(days=1)
        end_time2 = start_time2 + timedelta(hours=8)
        Shift.objects.create(
            employee=self.employee,
            manager=self.manager,
            start_time=start_time2,
            end_time=end_time2
        )

        # Query shifts for the employee
        shifts = Shift.objects.filter(employee=self.employee)

        # Verify the shifts were retrieved
        self.assertEqual(shifts.count(), 2)
        self.assertEqual(shifts[0].employee, self.employee)
        self.assertEqual(shifts[1].employee, self.employee)

    def test_query_shifts_for_manager(self):
        """
        Test querying shifts managed by a specific manager.
        """
        start_time = timezone.now()
        end_time = start_time + timedelta(hours=8)
        Shift.objects.create(
            employee=self.employee,
            manager=self.manager,
            start_time=start_time,
            end_time=end_time
        )

        # Query shifts managed by the manager
        shifts = Shift.objects.filter(manager=self.manager)

        # Verify the shifts were retrieved
        self.assertEqual(shifts.count(), 1)
        self.assertEqual(shifts[0].manager, self.manager)

    def test_add_shift_with_invalid_times(self):
        """
        Test adding a shift with invalid start and end times.
        """
        start_time = timezone.now()
        end_time = start_time - timedelta(hours=1)  # End time is before start time

        shift = Shift(
            employee=self.employee,
            manager=self.manager,
            start_time=start_time,
            end_time=end_time
        )

        # Call full_clean to trigger validation
        with self.assertRaises(ValidationError):
            shift.full_clean()
