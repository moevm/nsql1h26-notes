from arango import ArangoClient
import os

client = ArangoClient(
    hosts=f"http://{os.getenv('ARANGO_HOST')}:{os.getenv('ARANGO_PORT')}"
)
db = client.db(
    os.getenv("ARANGO_DB"),
    username=os.getenv("ARANGO_USER"),
    password=os.getenv("ARANGO_PASSWORD")
)


def get_db():
    return db
