from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from ..models import Vehicle, Driver, Trip, FuelLog
from ..schemas.trips import CreateTripSchema, CompleteTripSchema  


router = Router(tags=["Trips"])

@router.get("", response=List[dict])
def list_trips(request):
    trips = Trip.objects.select_related('vehicle', 'driver').all().order_by('-created_at')
    return [
        {
            "id": trip.id,
            "trip_code": trip.trip_code,
            "source": trip.source,
            "destination": trip.destination,
            "status": trip.status,
            "cargo_weight_kg": float(trip.cargo_weight_kg),
            "planned_distance_km": float(trip.planned_distance_km),
            "revenue": float(trip.revenue),
            "created_at": str(trip.created_at),
            "vehicle_id": trip.vehicle.id if trip.vehicle else None,
            "vehicle_reg": trip.vehicle.reg_no if trip.vehicle else None,
            "vehicle_model": trip.vehicle.model_name if trip.vehicle else None,
            "driver_id": trip.driver.id if trip.driver else None,
            "driver_name": trip.driver.name if trip.driver else None,
        }
        for trip in trips
    ]

@router.post("", response={201: dict, 400: dict})
def create_trip(request, payload: CreateTripSchema):
    vehicle = None
    driver = None

    if payload.vehicle_id:
        vehicle = get_object_or_404(Vehicle, id=payload.vehicle_id)
        if vehicle.status in [Vehicle.Status.IN_SHOP, Vehicle.Status.RETIRED]:
            return 400, {"detail": f"Vehicle {vehicle.reg_no} is currently {vehicle.status} and cannot be dispatched."}
        if vehicle.status == Vehicle.Status.ON_TRIP:
            return 400, {"detail": f"Vehicle {vehicle.reg_no} is already ON_TRIP."}
        if payload.cargo_weight_kg > vehicle.max_capacity_kg:
            exceeded = payload.cargo_weight_kg - vehicle.max_capacity_kg
            return 400, {"detail": f"Capacity exceeded by {exceeded:.1f} kg — dispatch blocked."}

    if payload.driver_id:
        driver = get_object_or_404(Driver, id=payload.driver_id)
        if driver.status == Driver.Status.ON_TRIP:
            return 400, {"detail": f"Driver {driver.name} is already ON_TRIP."}
        if driver.status == Driver.Status.SUSPENDED or driver.license_expiry < timezone.now().date():
            return 400, {"detail": f"Driver {driver.name} is suspended or has an expired license."}

    trip = Trip.objects.create(
        trip_code=payload.trip_code,
        source=payload.source,
        destination=payload.destination,
        vehicle=vehicle,
        driver=driver,
        cargo_weight_kg=payload.cargo_weight_kg,
        planned_distance_km=payload.planned_distance_km,
        revenue=payload.revenue,
        status=Trip.Status.DRAFT
    )
    return 201, {"id": trip.id, "trip_code": trip.trip_code, "status": trip.status}

@router.post("/{trip_id}/dispatch", response={200: dict, 400: dict})
@transaction.atomic
def dispatch_trip(request, trip_id: int):
    trip = get_object_or_404(Trip, id=trip_id)
    if not trip.vehicle or not trip.driver:
        return 400, {"detail": "Cannot dispatch trip without assigning both a vehicle and a driver."}

    trip.status = Trip.Status.DISPATCHED
    trip.save()

    trip.vehicle.status = Vehicle.Status.ON_TRIP
    trip.vehicle.save()

    trip.driver.status = Driver.Status.ON_TRIP
    trip.driver.save()

    return 200, {"detail": f"Trip {trip.trip_code} successfully dispatched."}

@router.post("/{trip_id}/complete", response={200: dict, 400: dict})
@transaction.atomic
def complete_trip(request, trip_id: int, payload: CompleteTripSchema):
    trip = get_object_or_404(Trip, id=trip_id)
    
    if trip.status == Trip.Status.COMPLETED:
        return 400, {"detail": "Trip is already completed."}
        
    trip.status = Trip.Status.COMPLETED
    trip.save()

    if trip.vehicle:
        trip.vehicle.odometer_km = payload.final_odometer
        trip.vehicle.status = Vehicle.Status.AVAILABLE
        trip.vehicle.save()
        
        if payload.fuel_consumed > 0:
            FuelLog.objects.create(
                vehicle=trip.vehicle,
                trip=trip,
                liters=payload.fuel_consumed,
                cost=0.00,
                date=timezone.now().date()
            )

    if trip.driver:
        trip.driver.status = Driver.Status.AVAILABLE
        trip.driver.save()

    return 200, {"detail": f"Trip {trip.trip_code} completed. Vehicle odometer updated and driver marked as Available."}

@router.post("/{trip_id}/cancel", response={200: dict, 400: dict})
@transaction.atomic
def cancel_trip(request, trip_id: int):
    trip = get_object_or_404(Trip, id=trip_id)
    
    if trip.status in [Trip.Status.COMPLETED, Trip.Status.CANCELLED]:
        return 400, {"detail": f"Cannot cancel a trip that is already {trip.status}."}
        
    trip.status = Trip.Status.CANCELLED
    trip.save()

    if trip.vehicle and trip.vehicle.status == Vehicle.Status.ON_TRIP:
        trip.vehicle.status = Vehicle.Status.AVAILABLE
        trip.vehicle.save()

    if trip.driver and trip.driver.status == Driver.Status.ON_TRIP:
        trip.driver.status = Driver.Status.AVAILABLE
        trip.driver.save()

    return 200, {"detail": f"Trip {trip.trip_code} cancelled. Resources released."}