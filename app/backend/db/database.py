from arango.database import StandardDatabase
from db.client import get_client
import os


def get_db() -> StandardDatabase:
    client = get_client()

    db = client.db(
        os.getenv("ARANGO_DB"),
        username=os.getenv("ARANGO_USER"),
        password=os.getenv("ARANGO_PASSWORD")
    )

    return db