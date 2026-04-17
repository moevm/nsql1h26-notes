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