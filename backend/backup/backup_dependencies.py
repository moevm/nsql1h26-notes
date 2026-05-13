from fastapi import Depends
from arango.database import StandardDatabase
from backup.backup_repository import BackupRepository
from db.database import get_db
from backup.backup_service import BackupService


def get_backup_repository(db: StandardDatabase = Depends(get_db)) -> BackupRepository:
    return BackupRepository(db)


def get_backup_service(
    repo: BackupRepository = Depends(get_backup_repository),
) -> BackupService:
    return BackupService(repo)
