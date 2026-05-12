from arango.database import StandardDatabase
from fastapi import Depends

from db.database import get_db
from permission.permission_repository import PermissionRepository


def get_permission_repository(
    db: StandardDatabase = Depends(get_db),
) -> PermissionRepository:
    return PermissionRepository(db)
