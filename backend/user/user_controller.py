from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from model.user import User
from user.user_dependencies import get_user_service
from user.user_schemas import UserResponse, UserDetailsResponse
from user.user_service import UserService
from auth.auth_dependencies import get_current_user_key, get_current_user
from auth.auth_schemas import UserRole

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
    service: UserService = Depends(get_user_service),
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    created_from: Optional[str] = None,
    created_to: Optional[str] = None,
) -> List[UserResponse]:
    return service.get_all_users(
        user,
        role=role,
        search=search,
        created_from=created_from,
        created_to=created_to,
    )

@router.get("/{user_key}", response_model=UserDetailsResponse)
def get_user(
    user_key: str,
    _: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.get_user_details(user_key)