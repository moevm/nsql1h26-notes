from typing import Annotated

from arango.database import StandardDatabase
from fastapi.params import Depends

from permission.permission_dependencies import get_permission_repository
from permission.permission_repository import PermissionRepository
from db.database import get_db
from note.note_repository import NoteRepository
from note.note_service import NoteService
from log.log_service import LogService
from log.log_dependencies import get_log_service


def get_note_repository(db: StandardDatabase = Depends(get_db)) -> NoteRepository:
    return NoteRepository(db)


def get_note_service(
    repo: NoteRepository = Depends(get_note_repository),
    log_service: LogService = Depends(get_log_service),
    permission_repo: PermissionRepository = Depends(get_permission_repository),
) -> NoteService:
    return NoteService(repo, log_service, permission_repo)
