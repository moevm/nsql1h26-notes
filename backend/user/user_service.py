from typing import List

from fastapi import HTTPException

from auth.auth_schemas import UserRole
from core.security import hash_password
from model.user import User
from user.user_repository import UserRepository
from user.user_schemas import UserResponse


class UserService:

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def get_all_users(self, user: User) -> List[UserResponse]:
        if user.role != UserRole.ADMIN:
            raise HTTPException(403, "You are not allowed to access this resource")
        users = self.user_repo.get_all()
        return [
            UserResponse(
                user_key=u.user_key,
                username=u.username,
                role=u.role
            )
            for u in users
        ]


    def create_user(self, username: str, password: str):
        hashed = hash_password(password)
        return self.user_repo.create(username, hashed)
    
    def get_user(self, user_key: str):
        return self.user_repo.get_by_key(user_key)
    
    def get_user_by_username(self, username: str):
        return self.user_repo.get_by_username(username)
    
    def update_user(self, user_key: str, data: dict):
        user = self.user_repo.update(user_key, data)
        return user

    def get_user_key_by_username(self, username: str):
        user = self.user_repo.get_by_username(username)

        if not user:
            raise HTTPException(404, "User not found")

        return user.user_key