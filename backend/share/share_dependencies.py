from fastapi import Depends
from arango.database import StandardDatabase

from note.note_dependencies import get_note_repository
from note.note_repository import NoteRepository
from permission.permission_dependencies import get_permission_repository
from permission.permission_repository import PermissionRepository
from db.database import get_db
from share.share_repository import ShareRepository
from share.share_service import ShareService


def get_share_repository(db: StandardDatabase = Depends(get_db)) -> ShareRepository:
    return ShareRepository(db)


def get_share_service(
    share_repo: ShareRepository = Depends(get_share_repository),
    perm_repo: PermissionRepository = Depends(get_permission_repository),
    note_repo: NoteRepository = Depends(get_note_repository),
) -> ShareService:
    return ShareService(share_repo, note_repo, perm_repo)
