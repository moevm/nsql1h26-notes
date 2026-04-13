from typing import Annotated

from arango.database import StandardDatabase
from fastapi.params import Depends

from db.database import get_db
from note.note_repository import NoteRepository
from note.note_service import NoteService

def get_note_repository(
    db: StandardDatabase = Depends(get_db)
) -> NoteRepository:
    return NoteRepository(db)

def get_note_service(note_repo: NoteRepository = Depends(get_note_repository)) -> NoteService:
    return NoteService(note_repo)