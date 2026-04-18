from typing import List
from fastapi import HTTPException

from log.log_repository import LogRepository
from user.user_service import UserService
from log.log_schemas import (
    RegistrationLogCreate,
    RegistrationLogResponse,
    NotesLogCreate,
    NotesLogResponse,
    PermissionLogCreate,
    PermissionLogResponse
)


class LogService:

    def __init__(self, repo: LogRepository, user_service: UserService):
        self.repo = repo
        self.user_service = user_service

    @staticmethod
    def _to_registration_response(log: dict) -> RegistrationLogResponse:
        return RegistrationLogResponse(
            log_key=log["_key"],
            action=log["action"],
            user_key=log["user_key"],
            created_at=log["created_at"]
        )

    @staticmethod
    def _to_note_response(log: dict) -> NotesLogResponse:
        return NotesLogResponse(
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
            log_key=log["_key"],
            action=log["action"],
            note_key=log["note_key"],
            granted_by_key=log["granted_by_key"],
            granted_to_key=log["granted_to_key"],
            before_permission_type=log["before_permission_type"],
            after_permission_type=log["after_permission_type"],
            created_at=log["created_at"]
        )

    def create_registration_log(
            self,
            user_ref: str,
            data: RegistrationLogCreate
    ):
        log = self.repo.create({
            **data.model_dump(),
            "user_key": user_ref,
        })
        return self._to_registration_response(log)

    def create_note_log(
            self,
            user_ref: str,
            data: NotesLogCreate
    ):
        log = self.repo.create({
            **data.model_dump(),
            "user_key": user_ref,
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
            "granted_by_key": granted_by_ref,
            "granted_to_key": granted_to_ref
        })

        return self._to_permission_response(log)

    def get_user_logs(
            self,
            user_key: str
    ) -> List[NotesLogResponse | RegistrationLogResponse | PermissionLogResponse]:
        raw_logs = self.repo.get_by_user(user_key)
        res_logs = []

        # костыль
        for log in raw_logs:
            if "before_permission_type" in log.keys():
                res_logs.append(self._to_permission_response(log))
            elif "state_before" in log.keys():
                res_logs.append(self._to_note_response(log))
            else:
                res_logs.append(self._to_registration_response(log))

        return res_logs
