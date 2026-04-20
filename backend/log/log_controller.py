from typing import List

from fastapi import APIRouter, Depends, Query

from auth.auth_dependencies import get_current_user
from log.log_dependencies import get_log_service
from log.log_service import LogService
from log.log_schemas import LogResponse, LogFilter

router = APIRouter(prefix="/api/logs", tags=["Logs"])


@router.get("", response_model=List[LogResponse])
def get_logs(
    filters: LogFilter = Depends(),
    user = Depends(get_current_user),
    service: LogService = Depends(get_log_service)
) -> List[LogResponse]:
    return service.get_user_logs(user,filters)
