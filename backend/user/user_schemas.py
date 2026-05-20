from pydantic import BaseModel, Field, field_validator, model_validator

from auth.auth_schemas import UserRole
from utils.datetime_utils import normalize_datetime, validate_date_range


class UserResponse(BaseModel):
    user_key: str
    username: str
    role: UserRole
    notes_count: int
    created_at: str

class UserFilter(BaseModel):
    role: UserRole | None = None
    search: str | None = None
    created_from: str | None = None
    created_to: str | None = None
    limit: int = Field(default=50, ge=1, le=256)
    offset: int = Field(default=0, ge=0)

    @field_validator("created_from", "created_to", mode="before")
    @classmethod
    def normalize_datetime(cls, v):
        return normalize_datetime(v)

    @model_validator(mode="after")
    def validate_date_ranges(self):
        validate_date_range(self.created_from, self.created_to, "created")
        return self

class UserDetailsResponse(BaseModel):
    user_key: str
    username: str
    role: UserRole
    notes_count: int
    created_at: str