from ninja import Router
from typing import List, Optional
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from ..models import Vehicle, Driver, Trip, FuelLog, MaintenanceLog
from ..schemas.trips import CreateTripSchema, CompleteTripSchema
from ..utils import apply_search


router = Router(tags=["Trips"])


def _resolve_vehicle_status_after_release(vehicle: Vehicle) -> str:
    """After a trip ends, keep vehicle IN_SHOP if active maintenance exists."""
    has_open_maintenance = MaintenanceLog.objects.filter(
        vehicle=vehicle,
        status=MaintenanceLog.Status.IN_SHOP,
    ).exists()
    if has_open_maintenance:
        return Vehicle.Status.IN_SHOP
    return Vehicle.Status.AVAILABLE


@router.get("", response=List[dict])
def list_trips(request, search: Optional[str] = None):
    trips = Trip.objects.select_related("vehicle", "driver").all().order_by("-updated_at", "-id")
    if search and search.strip():
        q = search.strip().lower()
        trips = [
            t for t in trips
            if q in t.trip_code.lower()
            or q in t.source.lower()
            or q in t.destination.lower()
            or q in t.status.lower()
            or (t.vehicle and q in t.vehicle.reg_no.lower())
            or (t.vehicle and q in t.vehicle.model_name.lower())
            or (t.driver and q in t.driver.name.lower())
        ]
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
            "updated_at": str(trip.updated_at),
            "vehicle_id": trip.vehicle.id if trip.vehicle else None,
            "vehicle_reg": trip.vehicle.reg_no if trip.vehicle else None,
            "vehicle_model": trip.vehicle.model_name if trip.vehicle else None,
            "vehicle_odometer": trip.vehicle.odometer_km if trip.vehicle else None,
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
        if vehicle.status != Vehicle.Status.AVAILABLE:
            return 400, {"detail": f"Vehicle {vehicle.reg_no} is {vehicle.status} and cannot be assigned."}
        if payload.cargo_weight_kg > vehicle.max_capacity_kg:
            exceeded = payload.cargo_weight_kg - vehicle.max_capacity_kg
            return 400, {"detail": f"Capacity exceeded by {exceeded:.1f} kg — dispatch blocked."}

    if payload.driver_id:
        driver = get_object_or_404(Driver, id=payload.driver_id)
        if driver.status != Driver.Status.AVAILABLE:
            return 400, {"detail": f"Driver {driver.name} is {driver.status} and cannot be assigned."}
        if driver.license_expiry < timezone.now().date():
            return 400, {"detail": f"Driver {driver.name} has an expired license."}

    trip = Trip.objects.create(
        trip_code=payload.trip_code,
        source=payload.source,
        destination=payload.destination,
        vehicle=vehicle,
        driver=driver,
        cargo_weight_kg=payload.cargo_weight_kg,
        planned_distance_km=payload.planned_distance_km,
        revenue=payload.revenue,
        status=Trip.Status.DRAFT,
    )
    return 201, {"id": trip.id, "trip_code": trip.trip_code, "status": trip.status}

@router.post("/{trip_id}/dispatch", response={200: dict, 400: dict})
@transaction.atomic
def dispatch_trip(request, trip_id: int):
    trip = get_object_or_404(Trip, id=trip_id)

    if trip.status != Trip.Status.DRAFT:
        return 400, {"detail": f"Only DRAFT trips can be dispatched. Current status: {trip.status}."}
    if not trip.vehicle or not trip.driver:
        return 400, {"detail": "Cannot dispatch trip without assigning both a vehicle and a driver."}
    if trip.vehicle.status != Vehicle.Status.AVAILABLE:
        return 400, {"detail": f"Vehicle {trip.vehicle.reg_no} is {trip.vehicle.status}, not Available."}
    if trip.driver.status != Driver.Status.AVAILABLE:
        return 400, {"detail": f"Driver {trip.driver.name} is {trip.driver.status}, not Available."}
    if trip.driver.license_expiry < timezone.now().date():
        return 400, {"detail": f"Driver {trip.driver.name} has an expired license."}
    if trip.cargo_weight_kg > trip.vehicle.max_capacity_kg:
        exceeded = trip.cargo_weight_kg - trip.vehicle.max_capacity_kg
        return 400, {"detail": f"Capacity exceeded by {exceeded:.1f} kg — dispatch blocked."}

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

    if trip.status != Trip.Status.DISPATCHED:
        return 400, {"detail": f"Only DISPATCHED trips can be completed. Current status: {trip.status}."}

    if trip.vehicle and payload.final_odometer < trip.vehicle.odometer_km:
        return 400, {
            "detail": (
                f"Final odometer reading ({payload.final_odometer} km) cannot be less than "
                f"the vehicle's current reading ({trip.vehicle.odometer_km} km)."
            )
        }

    trip.status = Trip.Status.COMPLETED
    trip.save()

    if trip.vehicle:
        trip.vehicle.odometer_km = payload.final_odometer
        trip.vehicle.status = _resolve_vehicle_status_after_release(trip.vehicle)
        trip.vehicle.save()

        if payload.fuel_consumed > 0:
            estimated_cost = round(float(payload.fuel_consumed) * 100, 2)
            FuelLog.objects.create(
                vehicle=trip.vehicle,
                trip=trip,
                liters=payload.fuel_consumed,
                cost=estimated_cost,
                date=timezone.now().date(),
            )

    if trip.driver:
        trip.driver.status = Driver.Status.AVAILABLE
        trip.driver.save()

    vehicle_status = trip.vehicle.status if trip.vehicle else None
    return 200, {
        "detail": (
            f"Trip {trip.trip_code} completed. Vehicle restored to {vehicle_status}. "
            "Driver marked as Available."
        ),
        "vehicle_status": vehicle_status,
    }

@router.post("/{trip_id}/cancel", response={200: dict, 400: dict})
@transaction.atomic
def cancel_trip(request, trip_id: int):
    trip = get_object_or_404(Trip, id=trip_id)

    if trip.status in [Trip.Status.COMPLETED, Trip.Status.CANCELLED]:
        return 400, {"detail": f"Cannot cancel a trip that is already {trip.status}."}

    was_dispatched = trip.status == Trip.Status.DISPATCHED
    trip.status = Trip.Status.CANCELLED
    trip.save()

    if was_dispatched and trip.vehicle and trip.vehicle.status == Vehicle.Status.ON_TRIP:
        trip.vehicle.status = _resolve_vehicle_status_after_release(trip.vehicle)
        trip.vehicle.save()

    if was_dispatched and trip.driver and trip.driver.status == Driver.Status.ON_TRIP:
        trip.driver.status = Driver.Status.AVAILABLE
        trip.driver.save()

    return 200, {"detail": f"Trip {trip.trip_code} cancelled. Resources released."}
