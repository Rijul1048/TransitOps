from ninja import Schema
from datetime import date

class DriverSchema(Schema):
    id: int
    name: str
    license_no: str
    license_category: str
    license_expiry: date
    contact: str
    safety_score: int
    status: str

class CreateDriverSchema(Schema):
    name: str
    license_no: str
    license_category: str
    license_expiry: date
    contact: str