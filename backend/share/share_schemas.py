from pydantic import BaseModel

from note.note_schemas import NoteResponse


class ShareLinkResponse(BaseModel):
    share_key: str
    role: str
    enabled: bool


class SharedNoteResponse(NoteResponse):
    access_role: str
