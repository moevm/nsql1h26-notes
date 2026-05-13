from datetime import datetime, timezone

from db.database import COLLECTIONS
from backup.backup_schemas import BackupSchema


class BackupService:
    def __init__(self, db):
        self.db = db
    
    def export_backup(self):
        result = {
            "version": 1,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "collections": {},
        }

        for collection_name in COLLECTIONS:
            collection = self.db.collection(collection_name)

            docs = list(collection.all())

            for doc in docs:
                doc.pop("_rev", None)
            
            result["collections"][collection_name] = docs
        
        return result
    
    def restore_backup(self, data: dict):
        backup = BackupSchema.model_validate(data)

        self._validate_collections(backup)

        for collection_name in COLLECTIONS:
            self.db.collection(collection_name).truncate()

        for collection_name in COLLECTIONS:
            docs = backup.collections.get(collection_name, [])

            if docs:
                self.db.collection(collection_name).import_bulk(docs)

    def _validate_collections(self, backup: BackupSchema):
        for collection_name in COLLECTIONS:
            if collection_name not in backup.collections:
                raise ValueError(
                    f"Collection '{collection_name}' is missing"
                )