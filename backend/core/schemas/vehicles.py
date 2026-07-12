from ninja import Schema

class VehicleSchema(Schema):
    id: int
    reg_no: str
    model_name: str
    vehicle_type: str
    max_capacity_kg: float
    odometer_km: int
    acquisition_cost: float
    status: str
    region: str

class CreateVehicleSchema(Schema):
    reg_no: str
    model_name: str
    vehicle_type: str
    max_capacity_kg: float
    odometer_km: int = 0
    acquisition_cost: float
    region: str = "Default"