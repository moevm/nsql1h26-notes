from pydantic import BaseModel

from auth.auth_schemas import UserRole


class UserResponse(BaseModel):
    user_key: str
    username: str
    role: UserRole