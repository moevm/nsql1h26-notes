from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from auth.auth_service import AuthService
from auth.token_service import TokenService
from auth.auth_schemas import UserRole, UserToken
from model.user import User
from user.user_service import UserService
from user.user_dependencies import get_user_service
from log.log_service import LogService
from log.log_dependencies import get_log_service
from core.security import decode_token

security = HTTPBearer(auto_error=False)


def get_auth_service(
    user_service: UserService = Depends(get_user_service),
    log_service: LogService = Depends(get_log_service),
) -> AuthService:
    return AuthService(user_service, log_service)


def get_token_service() -> TokenService:
    return TokenService()


def get_token_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> UserToken:
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    return decode_token(credentials.credentials)


def get_current_user_key(payload: UserToken = Depends(get_token_payload)) -> str:
    if payload.type != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_key = payload.user_key

    if not user_key:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user_key


def get_current_user(
    user_key: str = Depends(get_current_user_key),
    user_service: UserService = Depends(get_user_service),
):
    user = user_service.get_user(user_key)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_admin(
    user: User = Depends(get_current_user),
) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )
    return user


def get_refresh_token_payload(payload: dict = Depends(get_token_payload)) -> dict:
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return payload


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    user_service: UserService = Depends(get_user_service),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
    except Exception:
        return None
    if payload.type != "access" or not payload.user_key:
        return None
    return user_service.get_user(payload.user_key)
