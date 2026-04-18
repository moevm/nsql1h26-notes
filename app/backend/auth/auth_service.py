from fastapi import HTTPException

from core.security import verify_password
from user.user_service import UserService
from log.log_service import LogService
from log.log_schemas import RegistrationLogCreate


class AuthService:

    def __init__(self, user_service: UserService, log_service: LogService):
        self.user_service = user_service
        self.log_service = log_service

    def register(self, username: str, password: str, confirm_password: str):
        if self.user_service.get_user_by_username(username):
            raise HTTPException(400, "User already exists")
        if not self._validate_password(password, confirm_password):
            raise HTTPException(400, "Passwords do not match")
        
        user = self.user_service.create_user(username, password)
        self.log_service.create_registration_log(
            user.user_key,
            RegistrationLogCreate()
        )

        return user

    def login(self, username: str, password: str):
        user = self.user_service.get_user_by_username(username)
        if not user or not verify_password(password, user.password):
            raise HTTPException(401, "Invalid credentials")
        return user

    def _validate_password(self, password: str, confirm_password: str):
        return password == confirm_password
