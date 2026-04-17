from typing import Optional, List
from datetime import datetime, timezone
from arango.database import StandardDatabase


class LogRepository:

    def __init__(self, db: StandardDatabase):
        self.db = db
        self.collection = db.collection("logs")
    
    def create(self, data: dict) -> dict:
        log = {
            **data,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        result = self.collection.insert(log)
        log.update(result)

        return log
    
    def get_by_key(self, log_key: str) -> Optional[dict]:
        query = """
        FOR n IN logs
            FILTER n._key == @key
            LIMIT 1
            RETURN n
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"key": log_key}
        )

        return next(cursor, None)

    def delete(self, log_key: str) -> bool:
        query = """
        FOR n IN logs
            FILTER n._key == @key
            REMOVE n IN logs
            RETURN OLD
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"key": log_key}
        )

        return next(cursor, None) is not None
    
    def get_by_user(self, user_key: str) -> List[dict]:
        query = """
        FOR n IN logs
            FILTER n.granted_by_key == @user_key
                OR n.granted_to_key == @user_key
                OR n.user_key == @user_key
            RETURN n
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"user_key": user_key}
        )

        return list(cursor)
    
    def get_by_note(self, note_key: str) -> List[dict]:
        query = """
        FOR n IN logs
            FILTER n.note_key == @note_key
            RETURN n
        """

        cursor = self.db.aql.execute(
            query,
            bind_vars={"note_key": note_key}
        )

        return list(cursor)