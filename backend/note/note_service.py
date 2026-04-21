from typing import List

from fastapi import HTTPException

from auth.auth_schemas import UserRole
from model.user import User
from note.note_repository import NoteRepository
from note.note_schemas import NoteCreate, NoteResponse, NotePut, NotePatch, NoteFilter
from log.log_service import LogService
from log.log_schemas import NotesLogCreate, NoteAction, NoteSnapshot


class NoteService:

    def __init__(self, repo: NoteRepository, log_service: LogService):
        self.repo = repo
        self.log_service = log_service

    @staticmethod
    def _to_response(note: dict) -> NoteResponse:
        return NoteResponse(
            note_key=note["_key"],
            title=note["title"],
            content=note["content"],
            parent_key=note.get("parent_key"),
            tags=note.get("tags", []),
            created_at=note["created_at"],
            updated_at=note["updated_at"],
            user_ref=note["user_ref"],
            username=note["username"],
        )

    @staticmethod
    def _to_snapshot(note: dict) -> NoteSnapshot:
        return NoteSnapshot(
            title=note["title"],
            content=note["content"],
            parent_key=note.get("parent_key"),
            tags=note.get("tags", []),
        )

    def _get_owned_note(self, note_key: str, user: User) -> dict:
        note = self.repo.get(note_key)
        if not note:
            raise HTTPException(404, "Note not found")
        if user.role != UserRole.ADMIN and note["user_ref"] != user.user_key:
            raise HTTPException(403, "Access denied")
        return note

    def _check_cycle(self, parent_key: str, note_key: str):
        current = parent_key
        while current:
            if current == note_key:
                raise HTTPException(400, "Cycle detected in note hierarchy")

            parent = self.repo.get(current)
            if not parent:
                break

            current = parent.get("parent_key")

    def _validate_parent(self, parent_key: str, user: User, note_key: str | None = None):
        parent = self.repo.get(parent_key)

        if not parent:
            raise HTTPException(400, "Parent note does not exist")

        if user.role != UserRole.ADMIN and parent["user_ref"] != user.user_key:
            raise HTTPException(403, "Access denied to parent note")

        if note_key:
            if parent_key == note_key:
                raise HTTPException(400, "Note cannot be its own parent")

            self._check_cycle(parent_key, note_key)

    def create_note(self, user: User, data: NoteCreate) -> NoteResponse:
        if data.parent_key:
            self._validate_parent(data.parent_key, user)
        note = self.repo.create({
            **data.model_dump(),
            "user_ref": user.user_key
        })

        response_note = self._to_response(note)

        self.log_service.create_note_log(
            user.user_key,
            NotesLogCreate(
                action=NoteAction.CREATE,
                note_key=response_note.note_key,
                state_before=NoteSnapshot(
                    title="",
                    content="",
                    parent_key=None,
                    tags=[]
                ),
                state_after=self._to_snapshot(note),
                diff=""
            )
        )

        return response_note

    def get_note(self, user: User, note_key: str) -> NoteResponse:
        note = self._get_owned_note(note_key, user)
        return self._to_response(note)

    def patch_note(self, note_key: str, user: User, data: NotePatch) -> NoteResponse:
        note = self._get_owned_note(note_key, user)
        before = self._to_snapshot(note)
        payload = data.model_dump(exclude_unset=True)
        if "parent_key" in payload and payload["parent_key"] is not None:
            self._validate_parent(payload["parent_key"], user, note_key)
        updated = self.repo.update(note_key, payload)
        if not updated:
            raise HTTPException(404, "Note not found")
        after = self._to_snapshot(updated)
        self.log_service.create_note_log(
            user.user_key,
            NotesLogCreate(
                action=NoteAction.UPDATE,
                note_key=note_key,
                state_before=before,
                state_after=after,
                diff=""
            )
        )
        return self._to_response(updated)

    def replace_note(self, note_key: str, user: User, data: NotePut) -> NoteResponse:
        note = self._get_owned_note(note_key, user)
        before = self._to_snapshot(note)
        if data.parent_key is not None:
            self._validate_parent(data.parent_key, user, note_key)
        updated = self.repo.update(note_key, data.model_dump())
        if not updated:
            raise HTTPException(404, "Note not found")
        after = self._to_snapshot(updated)
        self.log_service.create_note_log(
            user.user_key,
            NotesLogCreate(
                action=NoteAction.UPDATE,
                note_key=note_key,
                state_before=before,
                state_after=after,
                diff=""
            )
        )
        return self._to_response(updated)

    def delete_note(self, note_key: str, user: User) -> None:
        note = self._get_owned_note(note_key, user)
        before = self._to_snapshot(note)
        self.log_service.create_note_log(
            user.user_key,
            NotesLogCreate(
                action=NoteAction.DELETE,
                note_key=note_key,
                state_before=before.model_dump(),
                state_after=NoteSnapshot(title="", content="", parent_key=None, tags=[]),
                diff=""
            )
        )
        ok = self.repo.delete(note_key)
        if not ok:
            raise HTTPException(404, "Note not found")

    def get_user_notes(self, user_ref: str, filters: NoteFilter) -> List[NoteResponse]:
        notes = self.repo.get_by_user(user_ref, filters)
        return [self._to_response(n) for n in notes]
