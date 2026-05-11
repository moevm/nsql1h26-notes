class PermissionRepository:
    def __init__(self, db):
        self.db = db
        self.collection = db.collection("permissions")

    def get(self, user_key: str, note_key: str):
        query = """
        FOR p IN permissions
            FILTER p.user_key == @user_key AND p.note_key == @note_key
            LIMIT 1
            RETURN p
        """

        cursor = self.db.aql.execute(
            query, bind_vars={"user_key": user_key, "note_key": note_key}
        )

        return next(cursor, None)

    def update_role_by_note(self, note_key: str, role: str):
        query = """
        FOR p IN permissions
            FILTER p.note_key == @note_key
            UPDATE p WITH { role: @role } IN permissions
            RETURN NEW
        """
        cursor = self.db.aql.execute(
            query, bind_vars={"note_key": note_key, "role": role}
        )
        return list(cursor)

    def upsert(self, user_key: str, note_key: str, role: str):
        query = """
        UPSERT { user_key: @user_key, note_key: @note_key }
        INSERT { user_key: @user_key, note_key: @note_key, role: @role }
        UPDATE { role: @role }
        IN permissions
        RETURN NEW
        """

        cursor = self.db.aql.execute(
            query, bind_vars={"user_key": user_key, "note_key": note_key, "role": role}
        )

        return next(cursor, None)

    def delete_by_note(self, note_key: str):
        query = """
        FOR p IN permissions
            FILTER p.note_key == @note_key
            REMOVE p IN permissions
            RETURN OLD
        """
        cursor = self.db.aql.execute(query, bind_vars={"note_key": note_key})
        return list(cursor)
