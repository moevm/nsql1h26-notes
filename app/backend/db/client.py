from arango import ArangoClient
import os


def get_client() -> ArangoClient:
    return ArangoClient(
        hosts=f"http://{os.getenv('ARANGO_HOST')}:{os.getenv('ARANGO_PORT')}"
    )