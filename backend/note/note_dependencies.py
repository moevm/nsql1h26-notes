from typing import Annotated

from arango.database import StandardDatabase
from fastapi.params import Depends

from db.database import get_db
from note.note_repository import NoteRepository
from note.note_service import NoteService
from log.log_service import LogService
from log.log_dependencies import get_log_service

def get_note_repository(
    db: StandardDatabase = Depends(get_db)
) -> NoteRepository:
    return NoteRepository(db)

def get_note_service(
        note_repo: NoteRepository = Depends(get_note_repository),
        log_service: LogService = Depends(get_log_service)
    ) -> NoteService:
    return NoteService(note_repo, log_service)