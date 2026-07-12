from typing import List, Optional

from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router

from ..auth import require_roles
from ..models import Driver, User
from ..schemas.drivers import CreateDriverSchema, DriverSchema
from ..utils import apply_search

router = Router(tags=["Drivers"], auth=require_roles(User.Role.SAFETY_OFFICER, User.Role.DRIVER, User.Role.FLEET_MANAGER))


@router.get("", response=List[DriverSchema], auth=require_roles(User.Role.SAFETY_OFFICER, User.Role.DRIVER, User.Role.FLEET_MANAGER))
def list_drivers(request, search: Optional[str] = None):
    qs = Driver.objects.all().order_by("-id")
    qs = apply_search(qs, ["name", "license_no", "license_category", "contact", "status"], search)
    return qs


@router.get("/dispatch-pool", response=List[DriverSchema], auth=require_roles(User.Role.SAFETY_OFFICER, User.Role.DRIVER, User.Role.FLEET_MANAGER))
def get_dispatch_drivers(request):
    """Only eligible drivers: Available status with a valid license."""
    today = timezone.now().date()
    return Driver.objects.filter(
        status=Driver.Status.AVAILABLE,
        license_expiry__gte=today,
    ).order_by("-id")


@router.post("", response={201: DriverSchema, 400: dict}, auth=require_roles(User.Role.SAFETY_OFFICER, User.Role.FLEET_MANAGER))
def create_driver(request, payload: CreateDriverSchema):
    if Driver.objects.filter(license_no=payload.license_no).exists():
        return 400, {"detail": "Driver license number must be unique."}
    driver = Driver.objects.create(**payload.dict())
    return 201, driver


@router.patch("/{driver_id}/status", response=DriverSchema, auth=require_roles(User.Role.SAFETY_OFFICER, User.Role.FLEET_MANAGER))
def update_driver_status(request, driver_id: int, status: str):
    driver = get_object_or_404(Driver, id=driver_id)
    driver.status = status
    driver.save()
    return driver
