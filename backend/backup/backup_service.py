from datetime import datetime, timezone

from fastapi import HTTPException
from pydantic import ValidationError

from backup.backup_repository import BackupRepository
from backup.backup_schemas import BackupSchema
from db.database import DOCUMENT_COLLECTIONS, EDGE_COLLECTIONS


class BackupService:
    def __init__(self, repo: BackupRepository):
        self.repo = repo

    def export_backup(self):
        return {
            "version": 1,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "collections": self.repo.get_all_collections_docs(),
        }

    def restore_backup(self, data: dict):
        backup = self._validate_backup(data)

        self.repo.truncate_all()

        for collection_name, docs in backup.collections.items():
            self.repo.bulk_insert(collection_name, docs)

    def _validate_backup(self, data: dict) -> BackupSchema:
        try:
            backup = BackupSchema.model_validate(data)

            if backup.version != 1:
                raise ValueError("Unsupported backup version")

            for collection_name in DOCUMENT_COLLECTIONS:
                if collection_name not in backup.collections:
                    raise ValueError(f"Missing collection: {collection_name}")

            for collection_name in EDGE_COLLECTIONS:
                if collection_name not in backup.collections:
                    backup.collections[collection_name] = []

            return backup

        except (ValidationError, ValueError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid backup: {str(e)}")
