from enum import Enum
from typing import Literal, Union, Annotated

from fastapi import HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator

from utils.datetime_utils import normalize_datetime, validate_date_range


# Enums

class LogType(str, Enum):
    REGISTRATION = "registration"
    NOTE = "note"
    PERMISSION = "permission"


class RegistrationAction(str, Enum):
    REGISTER = "register"


class NoteAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class PermissionAction(str, Enum):
    GRANT = "grant"
    REVOKE = "revoke"

class NoteSnapshot(BaseModel):
    title: str
    content: str
    parent_key: str | None
    tags: list[str]


class NotesLogCreate(BaseModel):
    action: NoteAction
    note_key: str
    state_before: NoteSnapshot
    state_after: NoteSnapshot
    diff: str


class PermissionLogCreate(BaseModel):
    action: PermissionAction
    note_key: str
    before_permission_type: str
    after_permission_type: str
    granted_by_key: str
    granted_to_key: str


class LogBase(BaseModel):
    log_key: str
    type: LogType
    created_at: str


class RegistrationLogResponse(LogBase):
    type: Literal[LogType.REGISTRATION]
    action: RegistrationAction
    user_key: str


class NotesLogResponse(LogBase):
    type: Literal[LogType.NOTE]
    action: NoteAction
    note_key: str
    state_before: NoteSnapshot
    state_after: NoteSnapshot
    diff: str
    user_key: str


class PermissionLogResponse(LogBase):
    type: Literal[LogType.PERMISSION]
    action: PermissionAction
    note_key: str
    before_permission_type: str
    after_permission_type: str
    granted_by_key: str
    granted_to_key: str


LogResponse = Annotated[
    Union[
        RegistrationLogResponse,
        NotesLogResponse,
        PermissionLogResponse
    ],
    Field(discriminator="type")
]


class LogFilter(BaseModel):
    type: LogType | None = None
    note_action: NoteAction | None = None
    permission_action: PermissionAction | None = None
    registration_action: RegistrationAction | None = None
    granted_by_key: str | None = None
    granted_to_key: str | None = None
    note_key: str | None = None
    target_user_key: str | None = None
    from_date: str | None = None
    to_date: str | None = None
    search: str | None = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)

    @field_validator("from_date", "to_date", mode="before")
    @classmethod
    def normalize(cls, v):
        return normalize_datetime(v)

    @model_validator(mode="after")
    def validate_range(self):
        validate_date_range(self.from_date, self.to_date, "from_date")
        return self

    @model_validator(mode="after")
    def validate_consistency(self):
        if self.type == LogType.NOTE:
            if self.permission_action or self.registration_action:
                raise HTTPException(400, "Only note_action allowed for NOTE type")
        if self.type == LogType.PERMISSION:
            if self.note_action or self.registration_action:
                raise HTTPException(400, "Only permission_action allowed for PERMISSION type")
        if self.type == LogType.REGISTRATION:
            if self.note_action or self.permission_action:
                raise HTTPException(400, "Only registration_action allowed for REGISTRATION type")
        return self

    @model_validator(mode="after")
    def validate_single_action(self):
        actions = [
            self.note_action,
            self.permission_action,
            self.registration_action
        ]
        filled = [a for a in actions if a is not None]
        if len(filled) > 1:
            raise HTTPException(
                400,
                "Only one action filter can be used at a time"
            )
        return self