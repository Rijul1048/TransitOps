from ninja import Schema
from typing import Optional
from datetime import date

class FuelLogCreateSchema(Schema):
    vehicle_id: int
    trip_id: Optional[int] = None
    date: date
    liters: float
    cost: float

class MiscExpenseCreateSchema(Schema):
    trip_id: int
    vehicle_id: int
    toll_cost: float = 0.0
    other_cost: float = 0.0