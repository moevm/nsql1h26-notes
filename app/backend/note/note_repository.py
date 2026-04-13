from datetime import datetime, timezone
from arango.database import StandardDatabase


class NoteRepository:

    def __init__(self, db: StandardDatabase):
        self.db = db
        self.collection = db.collection("notes")

    def create(self, data: dict) -> dict:
        note = {
            **data,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        result = self.collection.insert(note)
        note.update(result)

        return note

    def get(self, note_key: str) -> dict | None:
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

        return next(cursor, None)

    def update(self, note_key: str, data: dict) -> dict | None:
        query = """
        FOR n IN notes
            FILTER n._key == @key
            UPDATE n WITH @data IN notes
            RETURN NEW
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={
                "key": note_key,
                "data": {
                    **data,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )

        return next(cursor, None)

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

    def get_by_user(self, user_ref: str) -> list[dict]:
        query = """
        FOR n IN notes
            FILTER n.user_ref == @user_ref
            RETURN n
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"user_ref": user_ref}
        )

        return list(cursor)