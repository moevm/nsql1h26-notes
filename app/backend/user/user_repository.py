from typing import Optional, List
from datetime import datetime, timezone
from arango.database import StandardDatabase

from model.user import User
from core.security import hash_password
from utils.datetime_utils import now_iso


class UserRepository:

    def __init__(self, db: StandardDatabase):
        self.db = db
        self.collection = db.collection("users")
    
    def get_by_username(self, username: str) -> Optional[User]:
        query = """
        FOR u IN users
            FILTER u.username == @username
            LIMIT 1
            RETURN u
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"username": username}
        )

        return self._data_to_user_model(next(cursor, None))
    
    def get_by_key(self, key: str) -> Optional[User]:
        query = """
        FOR u IN users
            FILTER u._key == @key
            LIMIT 1
            RETURN u
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"key": key}
        )
        
        return self._data_to_user_model(next(cursor, None))
    
    def create(self, username: str, hashed_password: str) -> User:
        data = {
            "username": username,
            "hashed_password": hashed_password,
            "created_at": now_iso(),
            "role": "User"
        }

        result = self.collection.insert(data)
        data.update(result)

        return self._data_to_user_model(data)
    
    def _data_to_user_model(self, data: dict) -> User | None:
        if not data:
            return None
        
        return User(
            user_key=data["_key"],
            username=data["username"],
            password=data["hashed_password"],
            created_at=data["created_at"],
            role=data["role"]
        )