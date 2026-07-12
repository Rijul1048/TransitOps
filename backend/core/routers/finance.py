from ninja import Router
from django.shortcuts import get_object_or_404
from ..models import Vehicle, Trip, FuelLog, MaintenanceLog
from ..schemas.finance import FuelLogCreateSchema  

router = Router(tags=["Finance & Analytics"])

@router.post("/fuel-logs", response={201: dict})
def create_fuel_log(request, payload: FuelLogCreateSchema):
    vehicle = get_object_or_404(Vehicle, id=payload.vehicle_id)
    trip = get_object_or_404(Trip, id=payload.trip_id) if payload.trip_id else None
    
    log = FuelLog.objects.create(
        vehicle=vehicle,
        trip=trip,
        date=payload.date,
        liters=payload.liters,
        cost=payload.cost
    )
    return 201, {"id": log.id, "message": "Fuel log recorded successfully."}

@router.get("/analytics/summary")
def get_analytics_summary(request):
    total_vehicles = Vehicle.objects.count()
    available_vehicles = Vehicle.objects.filter(status=Vehicle.Status.AVAILABLE).count()
    in_shop_vehicles = Vehicle.objects.filter(status=Vehicle.Status.IN_SHOP).count()
    active_trips = Trip.objects.filter(status=Trip.Status.DISPATCHED).count()
    
    utilization = (active_trips / total_vehicles * 100) if total_vehicles > 0 else 0

    vehicles_data = []
    for v in Vehicle.objects.all():
        total_fuel_cost = sum(f.cost for f in FuelLog.objects.filter(vehicle=v))
        total_maint_cost = sum(m.cost for m in MaintenanceLog.objects.filter(vehicle=v))
        total_revenue = sum(t.revenue for t in Trip.objects.filter(vehicle=v, status=Trip.Status.COMPLETED))
        
        net_profit = float(total_revenue) - (float(total_maint_cost) + float(total_fuel_cost))
        roi = (net_profit / float(v.acquisition_cost) * 100) if float(v.acquisition_cost) > 0 else 0

        vehicles_data.append({
            "id": v.id,
            "reg_no": v.reg_no,
            "model_name": v.model_name,
            "revenue": float(total_revenue),
            "fuel_cost": float(total_fuel_cost),
            "maintenance_cost": float(total_maint_cost),
            "roi_percent": round(roi, 2)
        })

    return {
        "kpis": {
            "total_vehicles": total_vehicles,
            "available_vehicles": available_vehicles,
            "in_shop": in_shop_vehicles,
            "active_trips": active_trips,
            "fleet_utilization_pct": round(utilization, 1)
        },
        "vehicle_financials": vehicles_data
    }