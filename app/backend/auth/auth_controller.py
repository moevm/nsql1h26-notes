from fastapi import APIRouter, Depends, HTTPException

from auth.auth_schemas import RegisterRequest, LoginRequest, AuthResponse
from auth.auth_dependencies import (
    get_auth_service,
    get_refresh_token_payload
)
from auth.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse)
def register(
        request: RegisterRequest,
        service: AuthService = Depends(get_auth_service)
):
    access, refresh = service.register(
        request.username,
        request.password,
        request.confirm_password
    )
    return AuthResponse(access_token=access, refresh_token=refresh)


@router.post("/login", response_model=AuthResponse)
def login(
    request: LoginRequest,
    service: AuthService = Depends(get_auth_service)
):
    access, refresh = service.login(
        request.username,
        request.password
    )
    return AuthResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh")
def refresh(
        payload=Depends(get_refresh_token_payload),
        service: AuthService = Depends(get_auth_service)
):
    user_key = payload["sub"]
    access, refresh = service.issue_tokens(user_key)
    return AuthResponse(access_token=access, refresh_token=refresh)
