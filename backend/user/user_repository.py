from typing import Optional, List
from datetime import datetime, timezone
from arango.database import StandardDatabase

from auth.auth_schemas import UserRole
from model.user import User
from core.security import hash_password
from utils.datetime_utils import now_iso


class UserRepository:

    def __init__(self, db: StandardDatabase):
        self.db = db
        self.collection = db.collection("users")

    def get_all(self) -> List[User]:
        query = """
        FOR u IN users
            RETURN u
        """
        cursor = self.db.aql.execute(query)
        return [
            self._data_to_user_model(row)
            for row in cursor
            if row
        ]

    def get_all_summaries(
        self,
        role: UserRole | None = None,
        search: str | None = None,
        created_from: str | None = None,
        created_to: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        bind_vars: dict[str, str | int] = {}
        filters = []
        if role:
            bind_vars["role"] = role.value
            filters.append("u.role == @role")

        if search:
            bind_vars["search"] = search
            filters.append(
                "(u._key == @search OR LIKE(LOWER(u.username), CONCAT('%', LOWER(@search), '%')) )"
            )

        if created_from:
            bind_vars["created_from"] = created_from
            filters.append("u.created_at >= @created_from")

        if created_to:
            bind_vars["created_to"] = created_to
            filters.append("u.created_at <= @created_to")

        bind_vars["limit"] = limit
        bind_vars["offset"] = offset

        query = f"""
        FOR u IN users
            LET notes_count = LENGTH(
                FOR n IN notes
                    FILTER n.user_ref == u._key
                    RETURN 1
            )
            FILTER {" AND ".join(filters) if filters else "true"}
            SORT u._key ASC
            LIMIT @offset, @limit
            RETURN {{
                user_key: u._key,
                username: u.username,
                role: u.role,
                created_at: u.created_at,
                notes_count: notes_count
            }}
        """
        cursor = self.db.aql.execute(query, bind_vars=bind_vars)
        return list(cursor)

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
            "role": UserRole.USER.value
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
