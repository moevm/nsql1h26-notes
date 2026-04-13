from typing import Optional, List
from datetime import datetime, timezone
from arango.database import StandardDatabase


class NoteRepository:

    def __init__(self, db: StandardDatabase):
        self.db = db
        self.collection = db.collection("notes")

    def create(self, data: dict) -> dict:
        note = {
            "title": data.get("title"),
            "content": data.get("content"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "parent_key": data.get("parent_key"),
            "user_ref": data.get("user_ref"),
            "tags": data.get("tags", [])
        }

        result = self.collection.insert(note)
        note.update(result)

        return self._data_to_note_model(note)

    def get(self, note_key: str) -> Optional[dict]:
        query = """
        FOR n IN notes
            FILTER n._key == @key
            LIMIT 1
            RETURN n
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"key": note_key}
        )

        return self._data_to_note_model(next(cursor, None))

    def update(self, note_key: str, data: dict) -> Optional[dict]:
        note = self.get(note_key)
        if not note:
            return None

        update_query = """
        FOR n IN notes
            FILTER n._key == @key
            UPDATE n WITH @data IN notes
            RETURN NEW
        """

        cursor = self.db.aql.execute(
            update_query,
            bind_vars={
                "key": note_key,
                "data": {
                    **data,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )

        return self._data_to_note_model(next(cursor, None))

    def delete(self, note_key: str) -> bool:
        query = """
        FOR n IN notes
            FILTER n._key == @key
            REMOVE n IN notes
            RETURN OLD
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"key": note_key}
        )

        return next(cursor, None) is not None

    def get_by_user(self, user_ref: str) -> List[dict]:
        query = """
        FOR n IN notes
            FILTER n.user_ref == @user_ref
            RETURN n
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"user_ref": user_ref}
        )

        return [self._data_to_note_model(doc) for doc in cursor]

    def _data_to_note_model(self, data: dict | None):
        if not data:
            return None

        return {
            "note_key": data["_key"],
            "title": data["title"],
            "content": data["content"],
            "created_at": data["created_at"],
            "updated_at": data["updated_at"],
            "parent_key": data.get("parent_key"),
            "user_ref": data.get("user_ref"),
            "tags": data.get("tags", [])
        }