import json

from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import Response

from auth.auth_dependencies import require_admin
from backup.backup_dependencies import get_backup_service
from backup.backup_service import BackupService


router = APIRouter(prefix="/backup", tags=["backup"])


@router.get("/export")
def export_backup(
    _: dict = Depends(require_admin),
    service: BackupService = Depends(get_backup_service),
):
    data = service.export_backup()

    return Response(
        content=json.dumps(data, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={
            "Content-Disposition": (
                "attachment; filename=backup.json"
            )
        },
    )


@router.post("/import")
async def import_backup(
    file: UploadFile = File(...),
    _: dict = Depends(require_admin),
    service: BackupService = Depends(get_backup_service),
):
    raw = await file.read()

    data = json.loads(raw)

    service.restore_backup(data)

    return {
        "status": "ok"
    }