from arango import ArangoClient
import os
from core.config import get_settings

settings = get_settings()

client = ArangoClient(
    hosts=settings.database_url
)
db = client.db(
    settings.ARANGO_DB,
    username=settings.ARANGO_USER,
    password=settings.ARANGO_PASSWORD
)


def get_db():
    return db
