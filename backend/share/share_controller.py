from fastapi import APIRouter, Depends

from auth.auth_dependencies import get_current_user
from model.user import User
from share.share_dependencies import get_share_service
from share.share_schemas import ShareLinkResponse, SharedNoteResponse
from share.share_service import ShareService

router = APIRouter(prefix="/share", tags=["share"])


@router.post("/notes/{note_key}", response_model=ShareLinkResponse)
def create_share_link(
    note_key: str,
    role: str = "read",
    user: User = Depends(get_current_user),
    service: ShareService = Depends(get_share_service),
):

    return service.create_share_link(user, note_key, role)


@router.get("/{share_key}", response_model=SharedNoteResponse)
def get_shared_note(
    share_key: str,
    service: ShareService = Depends(get_share_service),
    user: User = Depends(get_current_user),
):
    print(user)
    return service.get_shared_note(share_key, user)


@router.delete("/notes/{note_key}")
def disable_share_link(
    note_key: str,
    user: User = Depends(get_current_user),
    service: ShareService = Depends(get_share_service),
):
    return service.disable_share(user, note_key)
