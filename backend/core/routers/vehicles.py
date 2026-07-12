from typing import List, Optional

from ninja import Router

from ..auth import require_roles
from ..models import User, Vehicle
from ..schemas.vehicles import CreateVehicleSchema, VehicleSchema
from ..utils import apply_search

router = Router(tags=["Vehicles"], auth=require_roles(User.Role.FLEET_MANAGER, User.Role.DRIVER))


@router.get("", response=List[VehicleSchema], auth=require_roles(User.Role.FLEET_MANAGER, User.Role.DRIVER))
def list_vehicles(request, status: Optional[str] = None, search: Optional[str] = None):
    qs = Vehicle.objects.all().order_by("-id")
    if status:
        qs = qs.filter(status=status)
    qs = apply_search(qs, ["reg_no", "model_name", "vehicle_type", "region"], search)
    return qs


@router.get("/dispatch-pool", response=List[VehicleSchema], auth=require_roles(User.Role.FLEET_MANAGER, User.Role.DRIVER))
def get_dispatch_vehicles(request):
    """Only AVAILABLE vehicles can be assigned to new trips."""
    return Vehicle.objects.filter(status=Vehicle.Status.AVAILABLE).order_by("-id")


@router.post("", response={201: VehicleSchema, 400: dict}, auth=require_roles(User.Role.FLEET_MANAGER))
def create_vehicle(request, payload: CreateVehicleSchema):
    if Vehicle.objects.filter(reg_no=payload.reg_no).exists():
        return 400, {"detail": "Vehicle registration number must be unique."}
    vehicle = Vehicle.objects.create(**payload.dict())
    return 201, vehicle
