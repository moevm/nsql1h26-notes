from typing import List

from fastapi import APIRouter, Depends, HTTPException

from model.user import User
from user.user_dependencies import get_user_service
from user.user_schemas import UserResponse
from user.user_service import UserService
from auth.auth_dependencies import get_current_user_key, get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me")
def get_me(
    user_key: str = Depends(get_current_user_key),
    service: UserService = Depends(get_user_service)
):
    return service.get_user(user_key)

@router.get("", response_model=List[UserResponse])
def get_users(
    user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
) -> List[UserResponse]:
    return service.get_all_users(user)