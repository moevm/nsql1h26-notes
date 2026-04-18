from typing import Annotated

from arango.database import StandardDatabase
from fastapi.params import Depends

from db.database import get_db
from log.log_repository import LogRepository
from log.log_service import LogService
from user.user_dependencies import get_user_service
from user.user_service import UserService


def get_log_repository(
    db: StandardDatabase = Depends(get_db)
) -> LogRepository:
    return LogRepository(db)

def get_log_service(log_repo: LogRepository = Depends(get_log_repository), user_service: UserService = Depends(get_user_service)) -> LogService:
    return LogService(log_repo,user_service)