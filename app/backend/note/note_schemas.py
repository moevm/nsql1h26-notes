from datetime import datetime, timezone

from fastapi import HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator

from utils.datetime_utils import normalize_datetime, validate_date_range


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
    def normalize(cls, v):
        return normalize_datetime(v)

    @model_validator(mode="after")
    def validate_date_ranges(self):
        validate_date_range(self.created_from, self.created_to, "created")
        validate_date_range(self.updated_from, self.updated_to, "updated")
        return self