from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8)
    confirm_password: str


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str


class UserToken(BaseModel):
    user_key: str = Field(validation_alias="sub")
    username: str
    role: UserRole
    type: str
    jti: str | None = None


class RefreshToken(BaseModel):
    user_key: str = Field(validation_alias="sub")
    type: Literal["refresh"]
    jti: str
    exp: datetime
