from fastapi import APIRouter, Depends, HTTPException

from auth.auth_schemas import RegisterRequest, LoginRequest, AuthResponse
from auth.auth_dependencies import (
    get_auth_service,
    get_refresh_token_payload, get_token_service
)
from auth.auth_service import AuthService
from auth.token_service import TokenService
from user.user_dependencies import get_user_service
from user.user_service import UserService

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse)
def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
    token_service: TokenService = Depends(get_token_service)
):
    user = auth_service.register(request.username, request.password, request.confirm_password)
    access, refresh = token_service.create_tokens(user.user_key, user.username, user.role)
    return AuthResponse(access_token=access, refresh_token=refresh)


@router.post("/login", response_model=AuthResponse)
def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
    token_service: TokenService = Depends(get_token_service)
):
    user = auth_service.login(request.username, request.password)
    access, refresh = token_service.create_tokens(user.user_key, user.username, user.role)
    return AuthResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=AuthResponse)
def refresh(
    payload: dict = Depends(get_refresh_token_payload),
    user_service: UserService = Depends(get_user_service),
    token_service: TokenService = Depends(get_token_service)
):
    user = user_service.get_user(payload["sub"])
    if not user:
        raise HTTPException(404, "User not found")
    access, refresh = token_service.create_tokens(user.user_key, user.username, user.role)
    return AuthResponse(access_token=access, refresh_token=refresh)
