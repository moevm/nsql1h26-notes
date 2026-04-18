from typing import List

from fastapi import HTTPException

from note.note_repository import NoteRepository
from note.note_schemas import NoteCreate, NoteResponse, NotePut, NotePatch, NoteFilter
from log.log_service import LogService
from log.log_schemas import NotesLogCreate


class NoteService:

    def __init__(self, repo: NoteRepository, log_service: LogService):
        self.repo = repo
        self.log_service = log_service

    def _to_response(self, note: dict) -> NoteResponse:
        return NoteResponse(
            note_key=note["_key"],
            title=note["title"],
            content=note["content"],
            parent_key=note.get("parent_key"),
            tags=note.get("tags", []),
            created_at=note["created_at"],
            updated_at=note["updated_at"],
            user_ref=note["user_ref"],
        )

    def _check_cycle(self, parent_key: str, note_key: str):
        current = parent_key
        while current:
            if current == note_key:
                raise HTTPException(400, "Cycle detected in note hierarchy")

            parent = self.repo.get(current)
            if not parent:
                break

            current = parent.get("parent_key")

    def _validate_parent(self, parent_key: str, user_ref: str, note_key: str | None = None):
        parent = self.repo.get(parent_key)

        if not parent:
            raise HTTPException(400, "Parent note does not exist")

        if parent["user_ref"] != user_ref:
            raise HTTPException(403, "Access denied to parent note")

        if note_key:
            if parent_key == note_key:
                raise HTTPException(400, "Note cannot be its own parent")

            self._check_cycle(parent_key, note_key)

    def create_note(self, user_ref: str, data: NoteCreate) -> NoteResponse:
        if data.parent_key:
            self._validate_parent(data.parent_key, user_ref)
        note = self.repo.create({
            **data.model_dump(),
            "user_ref": user_ref
        })

        response_note = self._to_response(note)

        self.log_service.create_note_log(
            user_ref,
            NotesLogCreate(
                action="note create",
                note_key=response_note.note_key,
                state_before="",
                state_after="",
                diff=""
            )
        )

        return response_note

    def get_note(self, user_ref: str, note_key: str) -> NoteResponse:
        note = self.repo.get(note_key)

        if not note:
            raise HTTPException(404, "Note not found")

        if note["user_ref"] != user_ref:
            raise HTTPException(403, "Access denied")

        return self._to_response(note)

    def patch_note(self, note_key: str, data: NotePatch) -> NoteResponse:
        payload = data.model_dump(exclude_unset=True)
        if "parent_key" in payload and payload["parent_key"] is not None:
            note = self.repo.get(note_key)
            if not note:
                raise HTTPException(404, "Note not found")

            self._validate_parent(payload["parent_key"], note["user_ref"], note_key)
        
        note = self.repo.update(note_key, payload)
        if not note:
            raise HTTPException(404, "Note not found")
        
        response_note = self._to_response(note)

        self.log_service.create_note_log(
            response_note.user_ref,
            NotesLogCreate(
                action="note update",
                note_key=note_key,
                state_before="",
                state_after="",
                diff=""
            )
        )

        return response_note

    def replace_note(self, note_key: str, data: NotePut) -> NoteResponse:
        note = self.repo.get(note_key)
        if not note:
            raise HTTPException(404, "Note not found")

        if data.parent_key is not None:
            self._validate_parent(data.parent_key, note["user_ref"], note_key)

        updated = self.repo.update(note_key, data.model_dump())
        if not updated:
            raise HTTPException(404, "Note not found")

        response_note = self._to_response(updated)

        self.log_service.create_note_log(
            response_note.user_ref,
            NotesLogCreate(
                action="note replace",
                note_key=note_key,
                state_before="",
                state_after="",
                diff=""
            )
        )

        return response_note

    def delete_note(self, note_key: str) -> None:
        ok = self.repo.delete(note_key)
        if not ok:
            raise HTTPException(404, "Note not found")

    def get_user_notes(self, user_ref: str, filters: NoteFilter) -> List[NoteResponse]:
        notes = self.repo.get_by_user(user_ref, filters)
        return [self._to_response(n) for n in notes]
