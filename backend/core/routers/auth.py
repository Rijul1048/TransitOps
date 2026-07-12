from ninja import Router
from ninja.errors import HttpError
from pydantic import BaseModel

from ..auth import create_access_token, require_authenticated
from ..models import User

router = Router(tags=["Authentication"])


class LoginPayload(BaseModel):
    email: str
    password: str


class RegisterPayload(BaseModel):
    email: str
    password: str
    role: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register", response=TokenResponse, auth=None)
def register(request, payload: RegisterPayload):
    if User.objects.filter(email__iexact=payload.email).exists():
        raise HttpError(409, "A user with this email already exists")

    role = payload.role or User.Role.FLEET_MANAGER
    if role not in {choice[0] for choice in User.Role.choices}:
        raise HttpError(400, "Invalid role")

    user = User.objects.create_user(
        email=payload.email,
        password=payload.password,
        role=role,
    )
    token = create_access_token(user)
    return TokenResponse(access_token=token)


@router.post("/login", response=TokenResponse, auth=None)
def login(request, payload: LoginPayload):
    user = User.objects.filter(email__iexact=payload.email).first()
    if user is None or not user.check_password(payload.password):
        raise HttpError(401, "Invalid email or password")

    token = create_access_token(user)
    return TokenResponse(access_token=token)


@router.get("/me", response=dict)
def me(request):
    user = require_authenticated(request)
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
    }
