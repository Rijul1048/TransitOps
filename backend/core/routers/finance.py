from typing import Optional

from django.db.models import Max
from django.shortcuts import get_object_or_404
from ninja import Router

from ..auth import require_roles
from ..models import Driver, FuelLog, MaintenanceLog, Trip, User, Vehicle
from ..schemas.finance import FuelLogCreateSchema
from ..utils import apply_search

router = Router(tags=["Finance & Analytics"], auth=require_roles(User.Role.FINANCIAL_ANALYST, User.Role.FLEET_MANAGER))


@router.post("/fuel-logs", response={201: dict}, auth=require_roles(User.Role.FINANCIAL_ANALYST))
def create_fuel_log(request, payload: FuelLogCreateSchema):
    vehicle = get_object_or_404(Vehicle, id=payload.vehicle_id)
    trip = get_object_or_404(Trip, id=payload.trip_id) if payload.trip_id else None

    log = FuelLog.objects.create(
        vehicle=vehicle,
        trip=trip,
        date=payload.date,
        liters=payload.liters,
        cost=payload.cost,
    )
    return 201, {"id": log.id, "message": "Fuel log recorded successfully."}


@router.get("/fuel-logs", response=list, auth=require_roles(User.Role.FINANCIAL_ANALYST, User.Role.FLEET_MANAGER))
def list_fuel_logs(request, search: Optional[str] = None):
    logs = FuelLog.objects.select_related("vehicle", "trip").all().order_by("-id")
    if search and search.strip():
        q = search.strip().lower()
        logs = [
            log for log in logs
            if q in log.vehicle.reg_no.lower()
            or q in log.vehicle.model_name.lower()
            or (log.trip and q in log.trip.trip_code.lower())
            or q in str(log.date).lower()
        ]
    return [
        {
            "id": log.id,
            "vehicle_id": log.vehicle.id,
            "vehicle_reg": log.vehicle.reg_no,
            "vehicle_model": log.vehicle.model_name,
            "trip_code": log.trip.trip_code if log.trip else None,
            "date": str(log.date),
            "liters": float(log.liters),
            "cost": float(log.cost),
        }
        for log in logs
    ]


@router.get("/analytics/summary", auth=require_roles(User.Role.FINANCIAL_ANALYST, User.Role.FLEET_MANAGER))
def get_analytics_summary(request):
    total_vehicles = Vehicle.objects.count()
    available_vehicles = Vehicle.objects.filter(status=Vehicle.Status.AVAILABLE).count()
    in_shop_vehicles = Vehicle.objects.filter(status=Vehicle.Status.IN_SHOP).count()
    active_trips = Trip.objects.filter(status=Trip.Status.DISPATCHED).count()
    pending_trips = Trip.objects.filter(status=Trip.Status.DRAFT).count()
    drivers_on_duty = Driver.objects.filter(status=Driver.Status.ON_TRIP).count()

    utilization = (active_trips / total_vehicles * 100) if total_vehicles > 0 else 0

    vehicles_data = []
    for v in Vehicle.objects.all():
        fuel_logs = FuelLog.objects.filter(vehicle=v)
        maint_logs = MaintenanceLog.objects.filter(vehicle=v)
        completed_trips = Trip.objects.filter(vehicle=v, status=Trip.Status.COMPLETED)
        all_trips = Trip.objects.filter(vehicle=v)

        total_fuel_cost = sum(f.cost for f in fuel_logs)
        total_fuel_liters = sum(f.liters for f in fuel_logs)
        total_maint_cost = sum(m.cost for m in maint_logs)
        total_revenue = sum(t.revenue for t in completed_trips)
        total_distance = sum(t.planned_distance_km for t in completed_trips)

        last_trip_at = completed_trips.aggregate(latest=Max("updated_at"))["latest"]
        last_fuel_id = fuel_logs.aggregate(latest=Max("id"))["latest"] or 0
        last_activity = str(last_trip_at or "") + str(last_fuel_id)

        net_profit = float(total_revenue) - (float(total_maint_cost) + float(total_fuel_cost))
        roi = (net_profit / float(v.acquisition_cost) * 100) if float(v.acquisition_cost) > 0 else 0
        fuel_efficiency = (float(total_distance) / float(total_fuel_liters)) if float(total_fuel_liters) > 0 else 0

        vehicles_data.append({
            "id": v.id,
            "reg_no": v.reg_no,
            "model_name": v.model_name,
            "status": v.status,
            "revenue": float(total_revenue),
            "fuel_cost": float(total_fuel_cost),
            "maintenance_cost": float(total_maint_cost),
            "total_distance_km": float(total_distance),
            "fuel_liters": float(total_fuel_liters),
            "fuel_efficiency_km_l": round(fuel_efficiency, 2),
            "roi_percent": round(roi, 2),
            "last_activity": last_activity,
            "last_trip_at": str(last_trip_at) if last_trip_at else None,
            "trip_codes": [t.trip_code for t in all_trips],
        })

    vehicles_data.sort(key=lambda x: x["last_activity"], reverse=True)

    recent_trips = Trip.objects.select_related("vehicle", "driver").order_by("-updated_at")[:5]
    recent_fuel_logs = FuelLog.objects.select_related("vehicle", "trip").order_by("-id")[:5]

    return {
        "kpis": {
            "total_vehicles": total_vehicles,
            "available_vehicles": available_vehicles,
            "in_shop": in_shop_vehicles,
            "active_trips": active_trips,
            "pending_trips": pending_trips,
            "drivers_on_duty": drivers_on_duty,
            "fleet_utilization_pct": round(utilization, 1),
        },
        "vehicle_financials": vehicles_data,
        "recent_trips": [
            {
                "trip_code": t.trip_code,
                "status": t.status,
                "vehicle_reg": t.vehicle.reg_no if t.vehicle else None,
                "updated_at": str(t.updated_at),
            }
            for t in recent_trips
        ],
        "recent_fuel_logs": [
            {
                "vehicle_reg": log.vehicle.reg_no,
                "trip_code": log.trip.trip_code if log.trip else None,
                "liters": float(log.liters),
                "cost": float(log.cost),
                "date": str(log.date),
            }
            for log in recent_fuel_logs
        ],
    }
