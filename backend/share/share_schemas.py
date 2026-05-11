from enum import Enum
from typing import List
from pydantic import BaseModel

from note.note_schemas import NoteResponse


class ShareRole(str, Enum):
    READ = "read"
    WRITE = "write"


class ShareLinkResponse(BaseModel):
    share_key: str
    role: ShareRole
    enabled: bool
    created_at: str


class ShareLinkListResponse(BaseModel):
    links: List[ShareLinkResponse]


class SharedNoteResponse(NoteResponse):
    access_role: ShareRole
