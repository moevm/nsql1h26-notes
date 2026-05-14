import json
from pathlib import Path
from arango.database import StandardDatabase

from backup.backup_repository import BackupRepository
from db.database import COLLECTIONS
from backup.backup_service import BackupService

DEMO_DUMP_PATH = Path("demo_dump.json")


def ensure_demo_data(db: StandardDatabase):
    is_empty = all(
        db.collection(collection_name).count() == 0 for collection_name in COLLECTIONS
    )

    if not is_empty:
        print("[DB INIT] Database already contains data")
        return
    if not DEMO_DUMP_PATH.exists():
        print("[DB INIT] Demo dump file not found")
        return
    with open(DEMO_DUMP_PATH, "r", encoding="utf-8") as f:
        dump_data = json.load(f)
    backup_repo = BackupRepository(db)
    backup_service = BackupService(backup_repo)
    backup_service.restore_backup(dump_data)
    print("[DB INIT] Demo data restored from backup")
