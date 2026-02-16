import os

from arango import ArangoClient
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

ARANGO_HOST = os.getenv("ARANGO_HOST", "arangodb")
ARANGO_PORT = os.getenv("ARANGO_PORT", "8529")
ARANGO_URL = f"http://{ARANGO_HOST}:{ARANGO_PORT}"
ARANGO_DB = os.getenv("ARANGO_DB", "")
ARANGO_USER = os.getenv("ARANGO_USER", "")
ARANGO_PASSWORD = os.getenv("ARANGO_PASSWORD", "")

client = ArangoClient(hosts=ARANGO_URL)
sys_db = client.db("_system", username=ARANGO_USER, password=ARANGO_PASSWORD)

if not sys_db.has_database(ARANGO_DB):
    sys_db.create_database(ARANGO_DB)

db = client.db(ARANGO_DB, username=ARANGO_USER, password=ARANGO_PASSWORD)

COLLECTION_NAME = "items"
if not db.has_collection(COLLECTION_NAME):
    db.create_collection(COLLECTION_NAME)

collection = db.collection(COLLECTION_NAME)

app = FastAPI(title="ArangoDB FastAPI Example")


class Item(BaseModel):
    key: str
    value: str


@app.post("/items/")
def create_item(item: Item):
    if collection.has(item.key):
        raise HTTPException(status_code=400, detail="Item already exists")
    collection.insert({"_key": item.key, "value": item.value})
    return {"message": "Item created", "item": item.dict()}


@app.get("/items/")
def read_items():
    items = [doc for doc in collection.all()]
    return {"items": items}
