from arango.database import StandardDatabase

from db.database import get_db


def get_database() -> StandardDatabase:
    return get_db()