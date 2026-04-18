from typing import List
from fastapi import HTTPException

from log.log_repository import LogRepository
from user.user_service import UserService
from log.log_schemas import (
    RegistationLogCreate,
    RegistrationLogResponse,
    NotesLogCreate,
    NotesLogResponse,
    PermissionLogCreate,
    PermissionLogResponse
)


class Service:

    def __init__(self, repo: LogRepository, user_service: UserService):
        self.repo = repo
        self.user_service = user_service

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
    
    def _get_user_key_by_username(self, username: str):
        user = self.user_service.get_user_by_username(username)

        if not user:
            raise HTTPException(400, "User not found")

        return user.user_key

    def create_registration_log(
            self,
            user_ref: str,
            data: RegistationLogCreate
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
    
    def create_permission_response(
            self,
            granted_by_ref: str,
            granted_to_username: str,
            data: PermissionLogCreate
    ):
        granted_to_ref = self._get_user_key_by_username(granted_to_username)

        log = self.repo.create({
            **data.model_dump(),
            "granted_by_key": granted_by_ref,
            "granted_to_key": granted_to_ref
        })

        return self._to_permission_response(log)
    
    def get_notes_by_username(
            self,
            username: str
    ) -> List[NotesLogResponse | RegistrationLogResponse | PermissionLogResponse]:
        user_key = self._get_user_key_by_username(username)
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
        