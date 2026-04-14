from datetime import datetime, timezone
from arango.database import StandardDatabase
from note.note_schemas import NoteFilter



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

    def get_by_user(self, user_ref: str, filters: NoteFilter) -> list[dict]:
        filters_list = ["n.user_ref == @user_ref"]
        bind_vars = {
            "user_ref": user_ref,
            "limit": filters.limit,
            "offset": filters.offset,
        }

        if filters.parent_key is not None:
            filters_list.append("n.parent_key == @parent_key")
            bind_vars["parent_key"] = filters.parent_key

        if filters.tag is not None:
            filters_list.append("@tag IN n.tags")
            bind_vars["tag"] = filters.tag

        if filters.search is not None:
            filters_list.append(
                "CONTAINS(LOWER(n.title), LOWER(@search)) OR CONTAINS(LOWER(n.content), LOWER(@search))"
            )
            bind_vars["search"] = filters.search

        query = f"""
        FOR n IN notes
            FILTER {" AND ".join(filters_list)}
            LIMIT @offset, @limit
            RETURN n
        """

        cursor = self.db.aql.execute(query, bind_vars=bind_vars)
        return list(cursor)