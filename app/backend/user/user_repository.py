from typing import Optional, List
from datetime import datetime, timezone
from model.user import User

from core.security import hash_password


class UserRepository:

    def __init__(self):
        self.users: List[User] = []
        self._id_counter = 3

        self.users.append(
            User(
                user_key="a",
                username="user",
                password=hash_password("123456"),
                created_at=datetime.now(timezone.utc),
                role="User"
            )
        )
        self.users.append(
            User(
                user_key="b",
                username="admin",
                password=hash_password("123456"),
                created_at=datetime.now(timezone.utc),
                role="Admin"
            )
        )
    
    def get_by_username(self, username: str) -> Optional[User]:
        for user in self.users:
            if user.username == username:
                return user
        return None
    
    def get_by_key(self, key: str) -> Optional[User]:
        for user in self.users:
            if user.user_key == key:
                return user
        return None
    
    def create(self, username: str, password: str) -> User:
        user = User(
            user_key=str(self._id_counter),
            username=username,
            password=password,
            created_at=datetime.now(timezone.utc),
            role="User"
        )

        self.users.append(user)
        self._id_counter += 1

        return user
    
    