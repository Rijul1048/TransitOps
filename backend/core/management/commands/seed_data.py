"""
Seed TransitOps with realistic fake data for local testing.

Usage:
    python manage.py seed_data
    python manage.py seed_data --flush
    python manage.py seed_data --vehicles 15 --drivers 10 --trips 20
"""

import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

from core.models import (
    Driver,
    FuelLog,
    MaintenanceLog,
    MiscExpense,
    Trip,
    User,
    Vehicle,
)

fake = Faker("en_IN")

VEHICLE_TYPES = ["Van", "Truck", "Mini Truck", "Pickup", "Trailer"]
REGIONS = ["North", "South", "East", "West", "Central"]
LICENSE_CATEGORIES = ["LMV", "HMV", "MCWG", "TRANS"]
SERVICE_TYPES = [
    "Oil Change",
    "Brake Inspection",
    "Tire Rotation",
    "Engine Tune-up",
    "Transmission Service",
    "AC Repair",
    "Battery Replacement",
    "Wheel Alignment",
]
CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",
    "Pune", "Ahmedabad", "Kolkata", "Jaipur", "Lucknow",
]


class Command(BaseCommand):
    help = "Populate the database with fake TransitOps data for testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete existing seedable data before inserting new records",
        )
        parser.add_argument("--vehicles", type=int, default=12, help="Number of vehicles to create")
        parser.add_argument("--drivers", type=int, default=10, help="Number of drivers to create")
        parser.add_argument("--trips", type=int, default=18, help="Number of trips to create")
        parser.add_argument(
            "--with-users",
            action="store_true",
            help="Also create demo users for each RBAC role (password: testpass123)",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            self._flush_data()

        with transaction.atomic():
            vehicles = self._seed_vehicles(options["vehicles"])
            drivers = self._seed_drivers(options["drivers"])
            self._seed_example_workflow(vehicles, drivers)
            self._seed_trips(vehicles, drivers, options["trips"])
            self._seed_maintenance(vehicles)
            self._seed_fuel_logs(vehicles)
            self._seed_misc_expenses(vehicles)

            if options["with_users"]:
                self._seed_users()

        self.stdout.write(self.style.SUCCESS("Database seeded successfully."))

    def _flush_data(self):
        self.stdout.write("Flushing existing data...")
        MiscExpense.objects.all().delete()
        FuelLog.objects.all().delete()
        MaintenanceLog.objects.all().delete()
        Trip.objects.all().delete()
        Driver.objects.all().delete()
        Vehicle.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    def _seed_vehicles(self, count: int) -> list[Vehicle]:
        self.stdout.write(f"Creating {count} vehicles...")
        vehicles = []
        statuses = (
            [Vehicle.Status.AVAILABLE] * 6
            + [Vehicle.Status.ON_TRIP] * 2
            + [Vehicle.Status.IN_SHOP] * 2
            + [Vehicle.Status.RETIRED] * 1
        )

        for i in range(count):
            vtype = random.choice(VEHICLE_TYPES)
            status = statuses[i % len(statuses)] if i < len(statuses) else Vehicle.Status.AVAILABLE
            vehicle = Vehicle.objects.create(
                reg_no=f"{fake.bothify(text='??-##-??').upper()}-{fake.random_int(1000, 9999)}",
                model_name=f"{vtype} {fake.word().title()} {fake.random_int(2018, 2024)}",
                vehicle_type=vtype,
                max_capacity_kg=Decimal(str(random.choice([500, 750, 1000, 1500, 2000, 3000, 5000]))),
                odometer_km=fake.random_int(5000, 120000),
                acquisition_cost=Decimal(str(fake.random_int(300000, 2500000))),
                status=status,
                region=random.choice(REGIONS),
            )
            vehicles.append(vehicle)

        return vehicles

    def _seed_drivers(self, count: int) -> list[Driver]:
        self.stdout.write(f"Creating {count} drivers...")
        drivers = []
        statuses = (
            [Driver.Status.AVAILABLE] * 5
            + [Driver.Status.ON_TRIP] * 2
            + [Driver.Status.OFF_DUTY] * 2
            + [Driver.Status.SUSPENDED] * 1
        )

        for i in range(count):
            # ~20% expired licenses for testing validation rules
            if i == count - 1:
                expiry = timezone.now().date() - timedelta(days=fake.random_int(30, 365))
            else:
                expiry = timezone.now().date() + timedelta(days=fake.random_int(90, 730))

            status = statuses[i % len(statuses)] if i < len(statuses) else Driver.Status.AVAILABLE
            driver = Driver.objects.create(
                name=fake.name(),
                license_no=fake.bothify(text="DL-########"),
                license_category=random.choice(LICENSE_CATEGORIES),
                license_expiry=expiry,
                contact=fake.phone_number()[:20],
                safety_score=fake.random_int(60, 100),
                status=status,
            )
            drivers.append(driver)

        return drivers

    def _seed_example_workflow(self, vehicles: list[Vehicle], drivers: list[Driver]):
        """Seed the mandatory workflow example from the spec (Van-05 / Alex)."""
        self.stdout.write("Creating example workflow data (Van-05 / Alex)...")

        van, _ = Vehicle.objects.get_or_create(
            reg_no="Van-05",
            defaults={
                "model_name": "Tata Ace HT",
                "vehicle_type": "Van",
                "max_capacity_kg": Decimal("500"),
                "odometer_km": 25000,
                "acquisition_cost": Decimal("450000"),
                "status": Vehicle.Status.AVAILABLE,
                "region": "Central",
            },
        )
        if van not in vehicles:
            vehicles.append(van)

        alex, _ = Driver.objects.get_or_create(
            license_no="DL-ALEX-001",
            defaults={
                "name": "Alex",
                "license_category": "LMV",
                "license_expiry": timezone.now().date() + timedelta(days=365),
                "contact": "+91-9876543210",
                "safety_score": 95,
                "status": Driver.Status.AVAILABLE,
            },
        )
        if alex not in drivers:
            drivers.append(alex)

        if not Trip.objects.filter(trip_code="TRIP-VAN05-001").exists():
            trip = Trip.objects.create(
                trip_code="TRIP-VAN05-001",
                source="Mumbai Warehouse",
                destination="Pune Distribution Hub",
                vehicle=van,
                driver=alex,
                cargo_weight_kg=Decimal("450"),
                planned_distance_km=Decimal("150"),
                revenue=Decimal("8500"),
                status=Trip.Status.COMPLETED,
            )
            van.odometer_km = 25150
            van.status = Vehicle.Status.AVAILABLE
            van.save()
            alex.status = Driver.Status.AVAILABLE
            alex.save()

            FuelLog.objects.create(
                vehicle=van,
                trip=trip,
                date=timezone.now().date() - timedelta(days=3),
                liters=Decimal("18.5"),
                cost=Decimal("1850"),
            )

            MaintenanceLog.objects.create(
                vehicle=van,
                service_type="Oil Change",
                cost=Decimal("2500"),
                service_date=timezone.now().date() - timedelta(days=30),
                status=MaintenanceLog.Status.COMPLETED,
            )

    def _seed_trips(self, vehicles: list[Vehicle], drivers: list[Driver], count: int):
        self.stdout.write(f"Creating {count} trips...")
        available_vehicles = [v for v in vehicles if v.status == Vehicle.Status.AVAILABLE]
        available_drivers = [
            d for d in drivers
            if d.status == Driver.Status.AVAILABLE and d.license_expiry >= timezone.now().date()
        ]

        status_distribution = (
            [Trip.Status.DRAFT] * 4
            + [Trip.Status.DISPATCHED] * 3
            + [Trip.Status.COMPLETED] * 8
            + [Trip.Status.CANCELLED] * 2
        )

        for i in range(count):
            source, destination = random.sample(CITIES, 2)
            status = status_distribution[i % len(status_distribution)]

            vehicle = None
            driver = None

            if status in (Trip.Status.DISPATCHED, Trip.Status.COMPLETED):
                if available_vehicles and available_drivers:
                    vehicle = available_vehicles.pop()
                    driver = available_drivers.pop()
                    vehicle.status = Vehicle.Status.ON_TRIP
                    vehicle.save()
                    driver.status = Driver.Status.ON_TRIP
                    driver.save()
            elif status == Trip.Status.DRAFT and available_vehicles and available_drivers:
                vehicle = random.choice(available_vehicles)
                driver = random.choice(available_drivers)

            max_cap = float(vehicle.max_capacity_kg) if vehicle else 2000
            cargo = Decimal(str(round(random.uniform(100, max_cap * 0.85), 1)))

            trip = Trip.objects.create(
                trip_code=f"TRP-{fake.bothify(text='??####').upper()}",
                source=f"{source} Depot",
                destination=f"{destination} Hub",
                vehicle=vehicle,
                driver=driver,
                cargo_weight_kg=cargo,
                planned_distance_km=Decimal(str(fake.random_int(50, 800))),
                revenue=Decimal(str(fake.random_int(3000, 50000))),
                status=status,
            )

            if status == Trip.Status.COMPLETED and vehicle:
                distance = int(trip.planned_distance_km)
                vehicle.odometer_km += distance
                vehicle.status = Vehicle.Status.AVAILABLE
                vehicle.save()
                if driver:
                    driver.status = Driver.Status.AVAILABLE
                    driver.save()

                liters = Decimal(str(round(distance / random.uniform(8, 14), 1)))
                FuelLog.objects.create(
                    vehicle=vehicle,
                    trip=trip,
                    date=timezone.now().date() - timedelta(days=fake.random_int(1, 60)),
                    liters=liters,
                    cost=Decimal(str(round(float(liters) * random.uniform(95, 110), 2))),
                )

            elif status == Trip.Status.CANCELLED:
                if vehicle and vehicle.status == Vehicle.Status.ON_TRIP:
                    vehicle.status = Vehicle.Status.AVAILABLE
                    vehicle.save()
                if driver and driver.status == Driver.Status.ON_TRIP:
                    driver.status = Driver.Status.AVAILABLE
                    driver.save()

    def _seed_maintenance(self, vehicles: list[Vehicle]):
        self.stdout.write("Creating maintenance logs...")
        shop_vehicles = [v for v in vehicles if v.status == Vehicle.Status.IN_SHOP]

        for vehicle in shop_vehicles:
            if not MaintenanceLog.objects.filter(vehicle=vehicle, status=MaintenanceLog.Status.IN_SHOP).exists():
                MaintenanceLog.objects.create(
                    vehicle=vehicle,
                    service_type=random.choice(SERVICE_TYPES),
                    cost=Decimal(str(fake.random_int(500, 15000))),
                    service_date=timezone.now().date() - timedelta(days=fake.random_int(0, 14)),
                    status=MaintenanceLog.Status.IN_SHOP,
                )

        completed_candidates = [v for v in vehicles if v.status == Vehicle.Status.AVAILABLE][:4]
        for vehicle in completed_candidates:
            MaintenanceLog.objects.create(
                vehicle=vehicle,
                service_type=random.choice(SERVICE_TYPES),
                cost=Decimal(str(fake.random_int(500, 12000))),
                service_date=timezone.now().date() - timedelta(days=fake.random_int(30, 180)),
                status=MaintenanceLog.Status.COMPLETED,
            )

    def _seed_fuel_logs(self, vehicles: list[Vehicle]):
        self.stdout.write("Creating standalone fuel logs...")
        for vehicle in random.sample(vehicles, min(5, len(vehicles))):
            liters = Decimal(str(round(random.uniform(20, 80), 1)))
            FuelLog.objects.create(
                vehicle=vehicle,
                trip=None,
                date=timezone.now().date() - timedelta(days=fake.random_int(1, 45)),
                liters=liters,
                cost=Decimal(str(round(float(liters) * random.uniform(95, 110), 2))),
            )

    def _seed_misc_expenses(self, vehicles: list[Vehicle]):
        self.stdout.write("Creating misc expenses (tolls, etc.)...")
        completed_trips = Trip.objects.filter(status=Trip.Status.COMPLETED).select_related("vehicle")[:8]

        for trip in completed_trips:
            if trip.vehicle:
                MiscExpense.objects.create(
                    trip=trip,
                    vehicle=trip.vehicle,
                    toll_cost=Decimal(str(fake.random_int(100, 2500))),
                    other_cost=Decimal(str(fake.random_int(0, 1500))),
                )

    def _seed_users(self):
        self.stdout.write("Creating demo users (password: testpass123)...")
        demo_users = [
            ("fleet.manager@transitops.test", User.Role.FLEET_MANAGER),
            ("dispatcher@transitops.test", User.Role.DISPATCHER),
            ("safety.officer@transitops.test", User.Role.SAFETY_OFFICER),
            ("analyst@transitops.test", User.Role.FINANCIAL_ANALYST),
        ]
        for email, role in demo_users:
            if not User.objects.filter(email=email).exists():
                user = User.objects.create_user(
                    username=email.split("@")[0],
                    email=email,
                    password="testpass123",
                    role=role,
                )
                user.save()
