from ninja import NinjaAPI
from .routers.vehicles import router as vehicles_router
from .routers.drivers import router as drivers_router
from .routers.trips import router as trips_router
from .routers.maintenance import router as maintenance_router
from .routers.finance import router as finance_router

api = NinjaAPI(
    title="TransitOps API",
    version="1.0.0",
    description="Transport Operations Platform API"
)

api.add_router("/vehicles", vehicles_router)
api.add_router("/drivers", drivers_router)
api.add_router("/trips", trips_router)
api.add_router("/maintenance", maintenance_router)
api.add_router("/finance", finance_router)