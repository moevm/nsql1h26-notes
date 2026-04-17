from typing import List

from fastapi import HTTPException

from log.log_repository import LogRepository
from log.log_schemas import (
    RegistationLogCreate,
    RegistrationLogResponse,
    NotesLogCreate,
    NotesLogResponse,
    PermissionLogCreate,
    PermissionLogResponse
)


class Service:

    def __init__(self, repo: LogRepository):
        self.repo = repo

    def _to_registration_response(self, log: dict) -> RegistrationLogResponse:
        return RegistrationLogResponse(
            log_key=log["_key"],
            action=log["action"],
            user_key=log["user_key"],
            created_at=log["created_at"]
        )
    
    def _to_note_response(self, log: dict) -> NotesLogResponse:
        return RegistrationLogResponse(
            log_key=log["_key"],
            action=log["action"],
            note_key=log["note_key"],
            user_key=log["user_key"],
            state_before=log["state_before"],
            state_after=log["state_after"],
            diff=log["state_diff"],
            created_at=log["created_at"]
        )
    
    def _to_permission_response(self, log: dict) -> PermissionLogResponse:
        return PermissionLogResponse(
            log_key=log["_key"],
            action=log["action"],
            note_key=log["note_key"],
            granted_by_key=log["granted_by_key"],
            granted_to_key=log["granted_to_key"],
            before_permission_type=log["brfore_permission_type"],
            after_permission_type=log["after_permission_type"],
            created_at=log["created_at"]
        )
