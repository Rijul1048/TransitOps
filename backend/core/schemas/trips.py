from ninja import Schema
from typing import Optional

class CreateTripSchema(Schema):
    trip_code: str
    source: str
    destination: str
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    cargo_weight_kg: float
    planned_distance_km: float
    revenue: float = 0.00

class CompleteTripSchema(Schema):
    final_odometer: int
    fuel_consumed: float