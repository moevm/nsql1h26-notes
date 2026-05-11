from utils.datetime_utils import now_iso
import uuid


class ShareRepository:
    def __init__(self, db):
        self.db = db
        self.collection = db.collection("shares")

    def get_by_note(self, note_key: str):
        query = """
        FOR s IN shares
            FILTER s.note_key == @note_key
            LIMIT 1
            RETURN s
        """

        cursor = self.db.aql.execute(query, bind_vars={"note_key": note_key})
        return next(cursor, None)

    def get_by_share_key(self, share_key: str):
        query = """
        FOR s IN shares
            FILTER s.share_key == @share_key
            LIMIT 1
            RETURN s
        """

        cursor = self.db.aql.execute(query, bind_vars={"share_key": share_key})
        return next(cursor, None)

    def create(self, note_key: str, role: str, created_by: str) -> dict:
        data = {
            "_key": str(uuid.uuid4()),
            "share_key": str(uuid.uuid4()),
            "note_key": note_key,
            "role": role,
            "enabled": True,
            "created_by": created_by,
            "created_at": now_iso(),
        }

        self.collection.insert(data)
        return data

    def update_role(self, note_key: str, role: str):
        query = """
        FOR s IN shares
            FILTER s.note_key == @note_key
            UPDATE s WITH { role: @role, enabled: true } IN shares
            RETURN NEW
        """

        cursor = self.db.aql.execute(
            query, bind_vars={"note_key": note_key, "role": role}
        )

        return next(cursor, None)

    def disable(self, note_key: str):
        query = """
        FOR s IN shares
            FILTER s.note_key == @note_key
            UPDATE s WITH { enabled: false } IN shares
            RETURN NEW
        """

        cursor = self.db.aql.execute(query, bind_vars={"note_key": note_key})
        return next(cursor, None)
