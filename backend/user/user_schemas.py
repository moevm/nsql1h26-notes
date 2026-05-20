from pydantic import BaseModel

from auth.auth_schemas import UserRole


class UserResponse(BaseModel):
    user_key: str
    username: str
    role: UserRole
    notes_count: int
    created_at: str


class UserDetailsResponse(BaseModel):
    user_key: str
    username: str
    role: UserRole
    notes_count: int
    created_at: str