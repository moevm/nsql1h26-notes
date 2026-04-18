from pydantic import BaseModel, Field


class LogBase(BaseModel):
    action: str
    

class RegistrationLogBase(LogBase):
    pass

class RegistrationLogCreate(RegistrationLogBase):
    pass

class RegistrationLogResponse(RegistrationLogBase):
    log_key: str
    user_key: str
    created_at: str


class PermissionLogBase(LogBase):
    note_key: str
    before_permission_type: str
    after_permission_type: str

class PermissionLogCreate(PermissionLogBase):
    pass

class PermissionLogResponse(PermissionLogBase):
    log_key: str
    granted_by_key: str
    granted_to_key: str
    created_at: str


class NotesLogBase(LogBase):
    note_key: str
    state_before: str
    state_after: str
    diff: str

class NotesLogCreate(NotesLogBase):
    pass

class NotesLogResponse(NotesLogBase):
    log_key: str
    user_key: str
    created_at: str
