from typing import List

from fastapi import APIRouter, Depends, Query

from auth.auth_dependencies import get_current_user_key
from log.log_dependencies import get_log_service
from log.log_service import LogService
from log.log_schemas import (
    RegistrationLogResponse,
    NotesLogResponse,
    PermissionLogResponse
)

router = APIRouter(prefix="/api/logs", tags=["Logs"])


@router.get("", response_model=List[RegistrationLogResponse | NotesLogResponse | PermissionLogResponse])
def get_logs(
    user_key: str = Depends(get_current_user_key),
    service: LogService = Depends(get_log_service)
) -> List[NotesLogResponse | RegistrationLogResponse | PermissionLogResponse]:
    return service.get_user_logs(user_key)
