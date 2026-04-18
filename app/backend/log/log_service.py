from typing import List
from fastapi import HTTPException

from log.log_repository import LogRepository
from user.user_service import UserService
from log.log_schemas import (
    RegistrationLogResponse,
    NotesLogCreate,
    NotesLogResponse,
    PermissionLogCreate,
    PermissionLogResponse, LogType, LogResponse, RegistrationAction, LogFilter
)


class LogService:

    def __init__(self, repo: LogRepository, user_service: UserService):
        self.repo = repo
        self.user_service = user_service
        self._handlers = {
            LogType.REGISTRATION: self._to_registration_response,
            LogType.NOTE: self._to_note_response,
            LogType.PERMISSION: self._to_permission_response,
        }

    @staticmethod
    def _to_registration_response(log: dict) -> RegistrationLogResponse:
        return RegistrationLogResponse(
            type=log["type"],
            log_key=log["_key"],
            action=log["action"],
            user_key=log["user_key"],
            created_at=log["created_at"]
        )

    @staticmethod
    def _to_note_response(log: dict) -> NotesLogResponse:
        return NotesLogResponse(
            type=log["type"],
            log_key=log["_key"],
            action=log["action"],
            note_key=log["note_key"],
            user_key=log["user_key"],
            state_before=log["state_before"],
            state_after=log["state_after"],
            diff=log["diff"],
            created_at=log["created_at"]
        )

    @staticmethod
    def _to_permission_response(log: dict) -> PermissionLogResponse:
        return PermissionLogResponse(
            type=log["type"],
            log_key=log["_key"],
            action=log["action"],
            note_key=log["note_key"],
            granted_by_key=log["granted_by_key"],
            granted_to_key=log["granted_to_key"],
            before_permission_type=log["before_permission_type"],
            after_permission_type=log["after_permission_type"],
            created_at=log["created_at"]
        )

    def _to_response(self, log: dict) -> LogResponse:
        handler = self._handlers.get(log["type"])
        if not handler:
            raise HTTPException(404, "Unknown log type")
        return handler(log)

    def create_registration_log(self, user_ref: str):
        log = self.repo.create({
            "user_key": user_ref,
            "type": LogType.REGISTRATION,
            "action": RegistrationAction.REGISTER,
        })
        return self._to_registration_response(log)

    def create_note_log(self, user_ref: str, data: NotesLogCreate):
        log = self.repo.create({
            **data.model_dump(),
            "user_key": user_ref,
            "type": LogType.NOTE,
        })
        return self._to_note_response(log)

    def create_permission_log(
            self,
            granted_by_ref: str,
            granted_to_username: str,
            data: PermissionLogCreate
    ):
        granted_to_ref = self.user_service.get_user_key_by_username(granted_to_username)

        log = self.repo.create({
            **data.model_dump(),
            "type": LogType.PERMISSION,
            "granted_by_key": granted_by_ref,
            "granted_to_key": granted_to_ref
        })

        return self._to_permission_response(log)

    def get_user_logs(self, user_key: str, filters: LogFilter) -> List[LogResponse]:
        raw_logs = self.repo.get_by_user(user_key, filters)
        return [self._to_response(log) for log in raw_logs]
