from arango.database import StandardDatabase
from note.note_schemas import NoteFilter
from utils.datetime_utils import now_iso


class NoteRepository:

    def __init__(self, db: StandardDatabase):
        self.db = db
        self.collection = db.collection("notes")

    @staticmethod
    def _note_id(note_key: str) -> str:
        return f"notes/{note_key}"

    @staticmethod
    def _pop_linked_note_keys(data: dict) -> list[str] | None:
        if "linked_note_keys" not in data:
            return None
        return data.pop("linked_note_keys")

    def _sync_note_links(self, note_key: str, linked_note_keys: list[str]):
        note_id = self._note_id(note_key)
        linked_note_ids = [self._note_id(key) for key in linked_note_keys]

        delete_query = """
        FOR e IN note_links
            FILTER e._from == @note_id
            REMOVE e IN note_links
        """

        self.db.aql.execute(delete_query, bind_vars={"note_id": note_id})

        insert_query = """
        FOR linked_note_id IN @linked_note_ids
            INSERT {
                _from: @note_id,
                _to: linked_note_id,
                created_at: @created_at
            } INTO note_links
        """

        self.db.aql.execute(
            insert_query,
            bind_vars={
                "note_id": note_id,
                "linked_note_ids": linked_note_ids,
                "created_at": now_iso(),
            },
        )

    def create(self, data: dict) -> dict:
        linked_note_keys = self._pop_linked_note_keys(data) or []
        note = {
            **data,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }

        result = self.collection.insert(note)
        note.update(result)
        self._sync_note_links(note["_key"], linked_note_keys)

        created = self.get(note["_key"])
        return created if created else note

    def get(self, note_key: str) -> dict | None:
        query = """
        FOR n IN notes
            FILTER n._key == @key
            LIMIT 1
            LET u = DOCUMENT("users", n.user_ref)
            RETURN MERGE(n, {
                username: u.username,
                linked_note_keys: (
                    FOR e IN note_links
                        FILTER e._from == n._id
                        RETURN PARSE_IDENTIFIER(e._to).key
                )
            })
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"key": note_key}
        )

        return next(cursor, None)

    def update(self, note_key: str, data: dict) -> dict | None:
        linked_note_keys = self._pop_linked_note_keys(data)
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
                    "updated_at": now_iso()
                }
            }
        )
        updated = next(cursor, None)
        if not updated:
            return None

        if linked_note_keys is not None:
            self._sync_note_links(note_key, linked_note_keys)

        return self.get(note_key)

    def delete(self, note_key: str) -> bool:
        delete_links_query = """
        LET note_id = CONCAT("notes/", @key)

        FOR e IN note_links
            FILTER e._from == note_id OR e._to == note_id
            REMOVE e IN note_links
        """

        self.db.aql.execute(delete_links_query, bind_vars={"key": note_key})

        delete_note_query = """
        FOR n IN notes
            FILTER n._key == @key
            REMOVE n IN notes
            RETURN OLD
        """

        cursor = self.db.aql.execute(
            delete_note_query,
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

        if filters.parent_key == "root":
            filters_list.append("n.parent_key == null")
        elif filters.parent_key is not None:
            filters_list.append("n.parent_key == @parent_key")
            bind_vars["parent_key"] = filters.parent_key

        if filters.linked_note_key is not None:
            filters_list.append(
                """
                LENGTH((
                    FOR e IN note_links
                        FILTER e._from == n._id
                            AND e._to == @linked_note_id
                        LIMIT 1
                        RETURN 1
                )) > 0
                """
            )
            bind_vars["linked_note_id"] = self._note_id(filters.linked_note_key)

        if filters.tag is not None:
            filters_list.append("@tag IN n.tags")
            bind_vars["tag"] = filters.tag
        if filters.created_from is not None:
            filters_list.append("n.created_at >= @created_from")
            bind_vars["created_from"] = filters.created_from

        if filters.created_to is not None:
            filters_list.append("n.created_at <= @created_to")
            bind_vars["created_to"] = filters.created_to

        if filters.updated_from is not None:
            filters_list.append("n.updated_at >= @updated_from")
            bind_vars["updated_from"] = filters.updated_from

        if filters.updated_to is not None:
            filters_list.append("n.updated_at <= @updated_to")
            bind_vars["updated_to"] = filters.updated_to

        if filters.search is not None:
            filters_list.append(
                """
                (
                    CONTAINS(LOWER(n.title), LOWER(@search)) OR
                    CONTAINS(LOWER(n.content), LOWER(@search))
                )
                """
            )
            bind_vars["search"] = filters.search

        query = f"""
        FOR n IN notes
            FILTER {" AND ".join(filters_list)}
            LET u = DOCUMENT("users", n.user_ref)
            LET linked_note_keys = (
                FOR e IN note_links
                    FILTER e._from == n._id
                    RETURN PARSE_IDENTIFIER(e._to).key
            )
            LIMIT @offset, @limit
            RETURN MERGE(n, {{
                username: u.username,
                linked_note_keys: linked_note_keys
            }})
        """

        cursor = self.db.aql.execute(query, bind_vars=bind_vars)
        return list(cursor)
