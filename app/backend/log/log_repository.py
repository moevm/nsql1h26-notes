from typing import Optional, List
from datetime import datetime, timezone
from arango.database import StandardDatabase

from log.log_schemas import LogFilter
from utils.datetime_utils import now_iso


class LogRepository:

    def __init__(self, db: StandardDatabase):
        self.db = db
        self.collection = db.collection("logs")

    def _build_filters(self, filters: LogFilter, bind_vars: dict):
        filters_list = []

        if filters.type is not None:
            filters_list.append("n.type == @type")
            bind_vars["type"] = filters.type

        if filters.note_action is not None:
            filters_list.append("n.action == @action")
            bind_vars["action"] = filters.note_action

        if filters.permission_action is not None:
            filters_list.append("n.action == @action")
            bind_vars["action"] = filters.permission_action

        if filters.registration_action is not None:
            filters_list.append("n.action == @action")
            bind_vars["action"] = filters.registration_action

        if filters.note_key is not None:
            filters_list.append("n.note_key == @note_key")
            bind_vars["note_key"] = filters.note_key

        if filters.granted_by_key is not None:
            filters_list.append("n.granted_by_key == @granted_by_key")
            bind_vars["granted_by_key"] = filters.granted_by_key

        if filters.granted_to_key is not None:
            filters_list.append("n.granted_to_key == @granted_to_key")
            bind_vars["granted_to_key"] = filters.granted_to_key

        if filters.from_date is not None:
            filters_list.append("n.created_at >= @from_date")
            bind_vars["from_date"] = filters.from_date

        if filters.to_date is not None:
            filters_list.append("n.created_at <= @to_date")
            bind_vars["to_date"] = filters.to_date

        if filters.target_user_key is not None:
            filters_list.append("n.user_key == @target_user_key")
            bind_vars["target_user_key"] = filters.target_user_key

        if filters.search is not None:
            filters_list.append("""
                (
                    CONTAINS(LOWER(n.type), LOWER(@search)) OR
                    (
                        n.state_after != null AND (
                            CONTAINS(LOWER(n.state_after.title), LOWER(@search)) OR
                            CONTAINS(LOWER(n.state_after.content), LOWER(@search))
                        )
                    )
                )
            """)
            bind_vars["search"] = filters.search

        return filters_list

    def create(self, data: dict) -> dict:
        log = {
            **data,
            "created_at": now_iso()
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

    def get_by_user(self, user_key: str, filters: LogFilter) -> List[dict]:
        filters_list = [
            """
            (
                n.user_key == @user_key
                OR n.granted_by_key == @user_key
                OR n.granted_to_key == @user_key
            )
            """
        ]
        bind_vars = {
            "user_key": user_key,
            "limit": filters.limit,
            "offset": filters.offset,
        }
        filters_list += self._build_filters(filters, bind_vars)
        query = f"""
        FOR n IN logs
            FILTER {" AND ".join(filters_list)}
            SORT n.created_at DESC
            LIMIT @offset, @limit
            RETURN n
        """
        cursor = self.db.aql.execute(query, bind_vars=bind_vars)
        return list(cursor)

    def get_all(self, filters: LogFilter) -> List[dict]:
        filters_list = []
        bind_vars = {
            "limit": filters.limit,
            "offset": filters.offset,
        }

        filters_list += self._build_filters(filters, bind_vars)

        query = f"""
        FOR n IN logs
            FILTER {" AND ".join(filters_list) if filters_list else "true"}
            SORT n.created_at DESC
            LIMIT @offset, @limit
            RETURN n
        """

        cursor = self.db.aql.execute(query, bind_vars=bind_vars)
        return list(cursor)
