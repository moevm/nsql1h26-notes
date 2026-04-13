from pydantic import BaseModel, Field


class NoteRequest(BaseModel):
    title: str
    content: str
    parent_key: str | None = None
    tags: list[str] = Field(default_factory=list)

class NoteResponse(NoteRequest):
    _key: str
    _rev: str
    _id: str

    created_at: str
    updated_at: str

    is_parent: bool
    user_ref: str
