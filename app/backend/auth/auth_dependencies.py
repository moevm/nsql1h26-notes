from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from auth.auth_service import AuthService
from user.user_service import UserService
from user.user_dependencies import get_user_service
from core.security import decode_token


security = HTTPBearer()


def get_auth_service(user_service: UserService = Depends(get_user_service)) -> AuthService:
    return AuthService(user_service)


def get_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    return decode_token(credentials.credentials)


def get_current_user_key(
    payload: dict = Depends(get_token_payload)
) -> str:
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user_key = payload.get("sub")

    if not user_key:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user_key


def get_current_user(
    user_key: str = Depends(get_current_user_key),
    user_service: UserService = Depends(get_user_service)
):
    user = user_service.get_user(user_key)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


def get_refresh_token_payload(
    payload: dict = Depends(get_token_payload)
) -> dict:
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    return payload