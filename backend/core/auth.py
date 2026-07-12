from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from django.conf import settings
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.http import HttpRequest
from ninja.errors import HttpError
from ninja.security.http import HttpBearer

from .models import User


class TokenAuth(HttpBearer):
    """Bearer-token authentication for Django Ninja endpoints."""

    header = "Authorization"
    openapi_scheme = "bearer"

    def authenticate(self, request: HttpRequest, token: str) -> Optional[User]:
        signer = TimestampSigner(salt="transitops-auth")
        try:
            payload = signer.unsign(token, max_age=60 * 60 * 8)
        except (BadSignature, SignatureExpired):
            return None

        try:
            user = User.objects.get(pk=payload)
        except User.DoesNotExist:
            return None

        if not user.is_active:
            return None
        return user


def create_access_token(user: User) -> str:
    signer = TimestampSigner(salt="transitops-auth")
    return signer.sign(str(user.pk))


def require_authenticated(request) -> User:
    user = getattr(request, "auth", None)
    if not isinstance(user, User):
        auth_result = jwt_auth(request)
        if isinstance(auth_result, User):
            request.auth = auth_result
            user = auth_result
        else:
            raise HttpError(401, "Authentication required.")
    return user


def require_roles(*allowed_roles):
    def _dependency(request) -> User:
        user = require_authenticated(request)
        if user.role not in allowed_roles:
            raise HttpError(403, "You do not have permission to perform this action.")
        return user

    return _dependency


jwt_auth = TokenAuth()
