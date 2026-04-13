from pydantic import BaseModel, Field


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
