from fastapi import HTTPException

from user.user_service import UserService
from core.security import hash_password, verify_password, create_tokens, pwd_context


class AuthService:

    def __init__(self, user_service: UserService):
        self.user_service = user_service

    def register(self, username: str, password: str, confirm_password: str):
        existing = self.user_service.get_user_by_username(username)

        if existing:
            raise HTTPException(400, "User already exists")

        if not self._validate_password(password, confirm_password):
            raise HTTPException(400, "Passwords do not match")
        user = self.user_service.create_user(username, password)

        return create_tokens(user.user_key)

    def login(self, username: str, password: str):
        user = self.user_service.get_user_by_username(username)

        if not user:
            raise HTTPException(401, "Invalid credentials")
        if not verify_password(password, user.password):
            raise HTTPException(401,"Invalid credentials")

        return create_tokens(user.user_key)

    def _validate_password(self, password: str, confirm_password: str):
        return password == confirm_password

    def issue_tokens(self, user_key: str):
        return create_tokens(user_key)
