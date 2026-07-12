from typing import List

from django.shortcuts import get_object_or_404
from ninja import Router

from ..auth import require_roles
from ..models import Driver
from ..schemas.drivers import CreateDriverSchema, DriverSchema

router = Router(tags=["Drivers"], auth=require_roles("SAFETY_OFFICER", "DISPATCHER"))


@router.get("", response=List[DriverSchema], auth=require_roles("SAFETY_OFFICER", "DISPATCHER"))
def list_drivers(request):
    return Driver.objects.all()


@router.post("", response={201: DriverSchema, 400: dict}, auth=require_roles("SAFETY_OFFICER"))
def create_driver(request, payload: CreateDriverSchema):
    if Driver.objects.filter(license_no=payload.license_no).exists():
        return 400, {"detail": "Driver license number must be unique."}
    driver = Driver.objects.create(**payload.dict())
    return 201, driver


@router.patch("/{driver_id}/status", response=DriverSchema, auth=require_roles("SAFETY_OFFICER"))
def update_driver_status(request, driver_id: int, status: str):
    driver = get_object_or_404(Driver, id=driver_id)
    driver.status = status
    driver.save()
    return driver