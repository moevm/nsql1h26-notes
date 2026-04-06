from fastapi import APIRouter, Depends, HTTPException
from auth.auth_schemas import RegisterRequest, LoginRequest, AuthResponse
from auth.auth_dependencies import get_auth_service
from auth.auth_service import AuthService


router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse)
def register(
    request: RegisterRequest,
    service: AuthService = Depends(get_auth_service)
):
    try:
        token = service.register(request.username, request.password)
        return AuthResponse(access_token=token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
def login(
    request: LoginRequest,
    service: AuthService = Depends(get_auth_service)
):
    try:
        token = service.login(request.username, request.password)
        return AuthResponse(access_token=token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))