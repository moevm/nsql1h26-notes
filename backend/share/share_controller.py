from typing import Optional

from fastapi import APIRouter, Depends

from auth.auth_dependencies import get_current_user, get_optional_user
from model.user import User
from share.share_dependencies import get_share_service
from share.share_schemas import (
    ShareLinkListResponse,
    ShareLinkResponse,
    ShareRole,
    SharedNoteResponse,
)
from share.share_service import ShareService

router = APIRouter(prefix="/api/share", tags=["share"])


@router.post("/notes/{note_key}", response_model=ShareLinkResponse, status_code=201)
def create_share_link(
    note_key: str,
    role: ShareRole = ShareRole.READ,
    user: User = Depends(get_current_user),
    service: ShareService = Depends(get_share_service),
):
    """Создаёт новую share-ссылку для заметки с указанной ролью."""
    return service.create_share_link(user, note_key, role)


@router.get("/notes/{note_key}", response_model=ShareLinkListResponse)
def list_share_links(
    note_key: str,
    user: User = Depends(get_current_user),
    service: ShareService = Depends(get_share_service),
):
    """Возвращает все активные ссылки для заметки."""
    return service.list_share_links(user, note_key)


@router.get("/{share_key}", response_model=SharedNoteResponse)
def get_shared_note(
    share_key: str,
    service: ShareService = Depends(get_share_service),
    user: Optional[User] = Depends(get_optional_user),
):
    """Открывает заметку по share-ссылке."""
    return service.get_shared_note(share_key, user)


@router.delete("/{share_key}")
def delete_share_link(
    share_key: str,
    user: User = Depends(get_current_user),
    service: ShareService = Depends(get_share_service),
):
    """
    Физически удаляет ссылку.
    Отзывает permissions, выданные через неё.
    """
    return service.delete_share_link(user, share_key)
