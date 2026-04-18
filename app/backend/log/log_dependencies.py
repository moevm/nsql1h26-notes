from typing import Annotated

from arango.database import StandardDatabase
from fastapi.params import Depends

from db.database import get_db
from log.log_repository import LogRepository
from log.log_service import LogService

def get_log_repository(
    db: StandardDatabase = Depends(get_db)
) -> LogRepository:
    return LogRepository(db)

def get_log_service(log_repo: LogRepository = Depends(get_log_repository)) -> LogService:
    return LogService(log_repo)