from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# 1. User & RBAC Model
class User(AbstractUser):
    class Role(models.TextChoices):
        FLEET_MANAGER = 'FLEET_MANAGER', 'Fleet Manager'
        DISPATCHER = 'DISPATCHER', 'Dispatcher'
        SAFETY_OFFICER = 'SAFETY_OFFICER', 'Safety Officer'
        FINANCIAL_ANALYST = 'FINANCIAL_ANALYST', 'Financial Analyst'
    
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.DISPATCHER)

# 2. Vehicle Model
class Vehicle(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        ON_TRIP = 'ON_TRIP', 'On Trip'
        IN_SHOP = 'IN_SHOP', 'In Shop'
        RETIRED = 'RETIRED', 'Retired'

    reg_no = models.CharField(max_length=50, unique=True)
    model_name = models.CharField(max_length=100)
    vehicle_type = models.CharField(max_length=50) # Van, Truck, Mini, etc.
    max_capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    odometer_km = models.PositiveIntegerField(default=0)
    acquisition_cost = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    region = models.CharField(max_length=50, default='Default')

    def __str__(self):
        return f"{self.model_name} ({self.reg_no})"

# 3. Driver Model
class Driver(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        ON_TRIP = 'ON_TRIP', 'On Trip'
        OFF_DUTY = 'OFF_DUTY', 'Off Duty'
        SUSPENDED = 'SUSPENDED', 'Suspended'

    name = models.CharField(max_length=100)
    license_no = models.CharField(max_length=50, unique=True)
    license_category = models.CharField(max_length=20) # LMV, HMV, etc.
    license_expiry = models.DateField()
    contact = models.CharField(max_length=20)
    safety_score = models.IntegerField(default=100)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)

    def __str__(self):
        return self.name

# 4. Trip Model
class Trip(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        DISPATCHED = 'DISPATCHED', 'Dispatched'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    trip_code = models.CharField(max_length=20, unique=True)
    source = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, null=True, blank=True)
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT, null=True, blank=True)
    cargo_weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    planned_distance_km = models.DecimalField(max_digits=8, decimal_places=2)
    revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.trip_code}: {self.source} -> {self.destination}"

# 5. Maintenance Log
class MaintenanceLog(models.Model):
    class Status(models.TextChoices):
        IN_SHOP = 'IN_SHOP', 'In Shop'
        COMPLETED = 'COMPLETED', 'Completed'

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_logs')
    service_type = models.CharField(max_length=100)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    service_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_SHOP)

# 6. Fuel & Expense Logs
class FuelLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    trip = models.ForeignKey(Trip, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField(default=timezone.now)
    liters = models.DecimalField(max_digits=8, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)

class MiscExpense(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    toll_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    other_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)