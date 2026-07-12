from ninja import Router
from ninja.errors import HttpError
from pydantic import BaseModel

from ..auth import create_access_token, require_authenticated
from ..models import User

router = Router(tags=["Authentication"])


class LoginPayload(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


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
