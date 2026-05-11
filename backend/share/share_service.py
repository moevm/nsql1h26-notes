from fastapi import HTTPException

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
    ):
        self.share_repo = share_repo
        self.note_repo = note_repo
        self.perm_repo = perm_repo

    def create_share_link(self, user, note_key: str, role: str = "read"):
        note = self.note_repo.get(note_key)

        if not note:
            raise HTTPException(404, "Note not found")

        if note["user_ref"] != user.user_key:
            raise HTTPException(403, "Not owner")

        existing = self.share_repo.get_by_note(note_key)

        if existing:
            share = self.share_repo.update_role(note_key, role)
            self.perm_repo.update_role_by_note(note_key, role)
        else:
            share = self.share_repo.create(note_key, role, user.user_key)

        return {
            "share_key": share["share_key"],
            "role": share["role"],
            "enabled": share["enabled"],
        }

    def get_shared_note(self, share_key: str, user: User):
        share = self.share_repo.get_by_share_key(share_key)

        if not share or not share["enabled"]:
            raise HTTPException(404, "Link disabled")

        note = self.note_repo.get(share["note_key"])

        if not note:
            raise HTTPException(404, "Note not found")
        if user:
            self.perm_repo.upsert(
                user_key=user.user_key, note_key=note["_key"], role=share["role"]
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
            "access_role": share["role"],
        }

    def disable_share(self, user, note_key: str):
        note = self.note_repo.get(note_key)

        if not note:
            raise HTTPException(404, "Note not found")

        if note["user_ref"] != user.user_key:
            raise HTTPException(403)

        self.perm_repo.delete_by_note(note_key)

        return self.share_repo.disable(note_key)
