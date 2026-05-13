from datetime import datetime
from typing import Dict, List, Any
from pydantic import BaseModel


class BackupSchema(BaseModel):
    version: int
    exported_at: datetime
    collections: Dict[str, List[dict[str, Any]]]