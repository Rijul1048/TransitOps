from ninja import Schema
from datetime import date

class MaintenanceCreateSchema(Schema):
    vehicle_id: int
    service_type: str
    cost: float
    service_date: date