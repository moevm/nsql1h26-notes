from typing import List
from fastapi import HTTPException

from auth.auth_schemas import UserRole
from log.log_repository import LogRepository
from model.user import User
from user.user_service import UserService
from log.log_schemas import (
    RegistrationLogResponse,
    NotesLogCreate,
    NotesLogResponse,
    PermissionLogCreate,
    PermissionLogResponse,
    LogType,
    LogResponse,
    RegistrationAction,
    LogFilter,
)


class LogService:

    def __init__(self, repo: LogRepository):
        self.repo = repo
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
            created_at=log["created_at"],
            username=log["username"],
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
            username=log["username"],
            diff=log["diff"],
            created_at=log["created_at"],
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
            granted_by_username=log["granted_by_username"],
            granted_to_username=log["granted_to_username"],
            before_permission_type=log["before_permission_type"],
            after_permission_type=log["after_permission_type"],
            created_at=log["created_at"],
        )

    def _to_response(self, log: dict) -> LogResponse:
        handler = self._handlers.get(log["type"])
        if not handler:
            raise HTTPException(404, "Unknown log type")
        return handler(log)

    def create_registration_log(self, user_ref: str, username: str):
        log = self.repo.create(
            {
                "user_key": user_ref,
                "username": username,
                "type": LogType.REGISTRATION,
                "action": RegistrationAction.REGISTER,
            }
        )
        return self._to_registration_response(log)

    def create_note_log(self, user_ref: str, username: str, data: NotesLogCreate):
        log = self.repo.create(
            {
                **data.model_dump(),
                "user_key": user_ref,
                "username": username,
                "type": LogType.NOTE,
            }
        )
        return self._to_note_response(log)

    def get_user_logs(self, user: User, filters: LogFilter) -> List[LogResponse]:
        if user.role == UserRole.ADMIN:
            raw_logs = self.repo.get_all(filters)
        else:
            raw_logs = self.repo.get_by_user(user.user_key, filters)
        return [self._to_response(log) for log in raw_logs]

    def create_permission_log_by_key(
        self,
        granted_by_key: str,
        granted_by_username: str,
        granted_to_key: str,
        granted_to_username: str,
        data: PermissionLogCreate,
    ):
        log = self.repo.create(
            {
                **data.model_dump(),
                "type": LogType.PERMISSION,
                "granted_by_key": granted_by_key,
                "granted_by_username": granted_by_username,
                "granted_to_key": granted_to_key,
                "granted_to_username": granted_to_username,
            }
        )
        return self._to_permission_response(log)

    def get_log(self, log_key: str, user: User) -> LogResponse:
        log = self.repo.get_by_key(log_key)
        if not log:
            raise HTTPException(404, "Log not found")
        if user.role != UserRole.ADMIN:
            allowed = (
                    log.get("user_key") == user.user_key
                    or log.get("granted_by_key") == user.user_key
                    or log.get("granted_to_key") == user.user_key
            )

            if not allowed:
                raise HTTPException(403, "Access denied")
        return self._to_response(log)
