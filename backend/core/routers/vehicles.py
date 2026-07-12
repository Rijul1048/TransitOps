from ninja import Router
from typing import List, Optional
from ..models import Vehicle
from ..schemas.vehicles import VehicleSchema, CreateVehicleSchema
from ..utils import apply_search


router = Router(tags=["Vehicles"])

@router.get("", response=List[VehicleSchema])
def list_vehicles(request, status: Optional[str] = None, search: Optional[str] = None):
    qs = Vehicle.objects.all().order_by("-id")
    if status:
        qs = qs.filter(status=status)
    qs = apply_search(qs, ["reg_no", "model_name", "vehicle_type", "region"], search)
    return qs

@router.get("/dispatch-pool", response=List[VehicleSchema])
def get_dispatch_vehicles(request):
    """Only AVAILABLE vehicles can be assigned to new trips."""
    return Vehicle.objects.filter(status=Vehicle.Status.AVAILABLE).order_by("-id")

@router.post("", response={201: VehicleSchema, 400: dict})
def create_vehicle(request, payload: CreateVehicleSchema):
    if Vehicle.objects.filter(reg_no=payload.reg_no).exists():
        return 400, {"detail": "Vehicle registration number must be unique."}
    vehicle = Vehicle.objects.create(**payload.dict())
    return 201, vehicle
