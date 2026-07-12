from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from django.db import transaction
from ..models import Vehicle, MaintenanceLog
from ..schemas.maintenance import MaintenanceCreateSchema  


router = Router(tags=["Maintenance"])

@router.post("", response={201: dict})
@transaction.atomic
def log_maintenance(request, payload: MaintenanceCreateSchema):
    vehicle = get_object_or_404(Vehicle, id=payload.vehicle_id)
    
    log = MaintenanceLog.objects.create(
        vehicle=vehicle,
        service_type=payload.service_type,
        cost=payload.cost,
        service_date=payload.service_date,
        status=MaintenanceLog.Status.IN_SHOP
    )

    vehicle.status = Vehicle.Status.IN_SHOP
    vehicle.save()

    return 201, {"id": log.id, "status": log.status, "vehicle_status": vehicle.status}

@router.get("", response=List[dict])
def list_maintenance_logs(request):
    logs = MaintenanceLog.objects.select_related('vehicle').all().order_by('-service_date')
    return [
        {
            "id": log.id,
            "vehicle_id": log.vehicle.id,
            "vehicle_reg": log.vehicle.reg_no,
            "vehicle_model": log.vehicle.model_name,
            "service_type": log.service_type,
            "cost": float(log.cost),
            "service_date": str(log.service_date),
            "status": log.status,
        }
        for log in logs
    ]

@router.patch("/{log_id}/complete", response={200: dict, 400: dict})
@transaction.atomic
def complete_maintenance(request, log_id: int):
    log = get_object_or_404(MaintenanceLog, id=log_id)
    
    if log.status == MaintenanceLog.Status.COMPLETED:
        return 400, {"detail": "Maintenance record is already marked as completed."}

    log.status = MaintenanceLog.Status.COMPLETED
    log.save()

    vehicle = log.vehicle
    if vehicle.status != Vehicle.Status.RETIRED:
        vehicle.status = Vehicle.Status.AVAILABLE
        vehicle.save()

    return 200, {
        "message": f"Maintenance completed for {vehicle.reg_no}. Vehicle restored to AVAILABLE status.",
        "vehicle_status": vehicle.status
    }