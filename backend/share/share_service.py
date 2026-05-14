from fastapi import HTTPException

from user.user_service import UserService
from log.log_schemas import PermissionAction, PermissionLogCreate
from log.log_service import LogService
from share.share_schemas import ShareRole
from model.user import User
from note.note_repository import NoteRepository
from permission.permission_repository import PermissionRepository
from share.share_repository import ShareRepository


class ShareService:
    def __init__(
        self,
        share_repo: ShareRepository,
        note_repo: NoteRepository,
        perm_repo: PermissionRepository,
        log_service: LogService,
        user_service: UserService,
    ):
        self.share_repo = share_repo
        self.note_repo = note_repo
        self.perm_repo = perm_repo
        self.log_service = log_service
        self.user_service = user_service

    def _get_note_for_owner(self, note_key: str, user: User):
        note = self.note_repo.get(note_key)
        if not note:
            raise HTTPException(404, "Note not found")
        if note["user_ref"] != user.user_key:
            raise HTTPException(403, "Not owner")
        return note

    def create_share_link(
        self, user: User, note_key: str, role: ShareRole = ShareRole.READ
    ):
        self._get_note_for_owner(note_key, user)

        share = self.share_repo.create(note_key, role, user.user_key)

        return {
            "share_key": share["share_key"],
            "role": share["role"],
            "enabled": share["enabled"],
            "created_at": share["created_at"],
        }

    def list_share_links(self, user: User, note_key: str):
        self._get_note_for_owner(note_key, user)
        links = self.share_repo.get_by_note(note_key)
        return {"links": links}

    def get_shared_note(self, share_key: str, user: User | None):
        share = self.share_repo.get_by_share_key(share_key)

        if not share or not share["enabled"]:
            raise HTTPException(404, "Share link not found or disabled")

        note = self.note_repo.get(share["note_key"])
        if not note:
            raise HTTPException(404, "Note not found")

        effective_role = ShareRole(share["role"]) if user else ShareRole.READ

        if user:
            if note["user_ref"] != user.user_key:
                existing = self.perm_repo.get(user.user_key, note["_key"])
                before_role = existing["role"] if existing else "none"
                self.perm_repo.upsert(
                    user_key=user.user_key,
                    note_key=note["_key"],
                    role=effective_role,
                    share_key=share["share_key"],
                )
                self.log_service.create_permission_log_by_key(
                    granted_by_key=note["user_ref"],
                    granted_by_username=note["username"],
                    granted_to_key=user.user_key,
                    granted_to_username=user.username,
                    data=PermissionLogCreate(
                        action=PermissionAction.GRANT,
                        note_key=note["_key"],
                        before_permission_type=before_role,
                        after_permission_type=effective_role,
                        granted_by_key=note["user_ref"],
                        granted_to_key=user.user_key,
                    ),
                )

        return {
            "note_key": note["_key"],
            "user_ref": note["user_ref"],
            "username": note["username"],
            "title": note["title"],
            "content": note["content"],
            "parent_key": note.get("parent_key"),
            "tags": note.get("tags", []),
            "created_at": note["created_at"],
            "updated_at": note["updated_at"],
            "access_role": effective_role,
        }

    def delete_share_link(self, user: User, share_key: str):
        share = self.share_repo.get_by_share_key(share_key)
        if not share:
            raise HTTPException(404, "Share link not found")

        note = self.note_repo.get(share["note_key"])
        if not note or note["user_ref"] != user.user_key:
            raise HTTPException(403, "Not owner")

        permissions = self.perm_repo.delete_by_share_key(share_key)
        self.share_repo.delete(share_key)

        for perm in permissions:
            granted_to_user = self.user_service.get_user(perm["user_key"])
            self.log_service.create_permission_log_by_key(
                granted_by_key=user.user_key,
                granted_by_username=user.username,
                granted_to_key=perm["user_key"],
                granted_to_username=granted_to_user.username,
                data=PermissionLogCreate(
                    action=PermissionAction.REVOKE,
                    note_key=note["_key"],
                    before_permission_type=perm["role"],
                    after_permission_type="none",
                    granted_by_key=user.user_key,
                    granted_to_key=perm["user_key"],
                ),
            )

        return {"deleted": True, "share_key": share_key}
