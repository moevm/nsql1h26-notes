from enum import Enum
from typing import Literal, Union, Annotated

from pydantic import BaseModel, Field


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


class NotesLogCreate(BaseModel):
    action: NoteAction
    note_key: str
    state_before: str
    state_after: str
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
    state_before: str
    state_after: str
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
