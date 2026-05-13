from fastapi import Depends

from db.database import get_db
from backup.backup_service import BackupService


def get_backup_service(db=Depends(get_db)):
    return BackupService(db)