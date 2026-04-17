from datetime import datetime, timezone

from fastapi import HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator


class NoteBase(BaseModel):
    title: str
    content: str
    parent_key: str | None = None
    tags: list[str] = Field(default_factory=list)


class NoteCreate(NoteBase):
    pass


class NotePut(BaseModel):
    title: str
    content: str
    parent_key: str | None
    tags: list[str]


class NotePatch(BaseModel):
    title: str | None = None
    content: str | None = None
    parent_key: str | None = None
    tags: list[str] | None = None


class NoteResponse(NoteBase):
    note_key: str
    user_ref: str
    created_at: str
    updated_at: str


class NoteFilter(BaseModel):
    parent_key: str | None = None
    tag: str | None = None
    search: str | None = None

    created_from: str | None = None
    created_to: str | None = None

    updated_from: str | None = None
    updated_to: str | None = None

    limit: int = Field(default=50, ge=1, le=256)
    offset: int = Field(default=0, ge=0)

    @field_validator("created_from", "created_to", "updated_from", "updated_to", mode="before")
    @classmethod
    def validate_datetime_format(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            dt = datetime.fromisoformat(v)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt.strftime("%Y-%m-%dT%H:%M:%S+00:00")
        except ValueError:
            raise HTTPException(422, "Invalid datetime format")

    @model_validator(mode="after")
    def validate_date_ranges(self) -> "NoteFilter":
        if self.created_from and self.created_to and self.created_from > self.created_to:
            raise HTTPException(400, "created_from must be before created_to")
        if self.updated_from and self.updated_to and self.updated_from > self.updated_to:
            raise HTTPException(400, "updated_from must be before updated_to")
        return self
