from db.database import COLLECTIONS
from arango.database import StandardDatabase


class BackupRepository:
    def __init__(self, db: StandardDatabase):
        self.db = db

    def get_all_collections_docs(self) -> dict[str, list[dict]]:
        result = {}

        for collection_name in COLLECTIONS:
            collection = self.db.collection(collection_name)

            docs = list(collection.all())

            for doc in docs:
                doc.pop("_rev", None)

            result[collection_name] = docs

        return result

    def truncate_all(self):
        for collection_name in COLLECTIONS:
            self.db.collection(collection_name).truncate()

    def bulk_insert(self, collection_name: str, docs: list[dict]):
        if docs:
            self.db.collection(collection_name).import_bulk(docs)
