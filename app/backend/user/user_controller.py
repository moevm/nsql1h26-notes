from fastapi import APIRouter, Depends, HTTPException

from user.user_dependencies import get_user_service
from user.user_service import UserService
from auth.auth_dependencies import get_current_user_key


router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me")
def get_me(
    user_key: str = Depends(get_current_user_key),
    service: UserService = Depends(get_user_service)
):
    return service.get_user(user_key)


@router.get("/me/logs")
def get_my_logs(
    user_key: str = Depends(get_current_user_key),
    service: UserService = Depends(get_user_service)
):
    pass
