from typing import List, Optional

from ninja import Router

from ..auth import require_roles
from ..models import User, Vehicle
from ..schemas.vehicles import CreateVehicleSchema, VehicleSchema

router = Router(tags=["Vehicles"], auth=require_roles(User.Role.FLEET_MANAGER, User.Role.DRIVER))


@router.get("", response=List[VehicleSchema], auth=require_roles(User.Role.FLEET_MANAGER))
def list_vehicles(request, status: Optional[str] = None):
    qs = Vehicle.objects.all()
    if status:
        qs = qs.filter(status=status)
    return qs


@router.get("/dispatch-pool", response=List[VehicleSchema], auth=require_roles(User.Role.FLEET_MANAGER, User.Role.DRIVER))
def get_dispatch_vehicles(request):
    return Vehicle.objects.exclude(status__in=[Vehicle.Status.IN_SHOP, Vehicle.Status.RETIRED])


@router.post("", response={201: VehicleSchema, 400: dict}, auth=require_roles(User.Role.FLEET_MANAGER))
def create_vehicle(request, payload: CreateVehicleSchema):
    if Vehicle.objects.filter(reg_no=payload.reg_no).exists():
        return 400, {"detail": "Vehicle registration number must be unique."}
    vehicle = Vehicle.objects.create(**payload.dict())
    return 201, vehicle