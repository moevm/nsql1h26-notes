from note.note_repository import NoteRepository
from note.note_schemas import NoteCreate, NoteResponse, NotePut, NotePatch


class NoteService:

    def __init__(self, repo: NoteRepository):
        self.repo = repo

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

    def create_note(self, user_ref: str, data: NoteCreate):
        note = self.repo.create({
            **data.model_dump(),
            "user_ref": user_ref
        })
        return self._to_response(note)

    def get_note(self, user_ref: str, note_key: str):
        note = self.repo.get(note_key)

        if not note:
            raise Exception("Note not found")

        if note["user_ref"] != user_ref:
            raise Exception("Access denied")

        return self._to_response(note)

    def patch_note(self, note_key: str, data: NotePatch):
        payload = data.model_dump(exclude_unset=True)

        note = self.repo.update(note_key, payload)
        if not note:
            raise ValueError("Note not found")

        return self._to_response(note)

    def replace_note(self, note_key: str, data: NotePut):
        note = self.repo.update(note_key, data.model_dump())
        if not note:
            raise ValueError("Note not found")
        return self._to_response(note)

    def delete_note(self, note_key: str):
        return self.repo.delete(note_key)

    def get_user_notes(self, user_ref: str):
        notes = self.repo.get_by_user(user_ref)
        return [self._to_response(n) for n in notes]
