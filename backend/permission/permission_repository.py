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
