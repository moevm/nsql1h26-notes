from note.note_repository import NoteRepository
from note.note_schemas import NoteRequest


class NoteService:

    def __init__(self, note_repo: NoteRepository):
        self.note_repo = note_repo

    def create_note(self, user_ref: str, note: NoteRequest):
        note_dict = note.model_dump()
        note = self.note_repo.create({
            **note_dict,
            "user_ref": user_ref
        })
        return note
    
    def get_note(self, user_ref: str, note_key: str):
        note = self.note_repo.get(note_key)

        if not note:
            raise Exception("Note not found")

        if note["user_ref"] != user_ref:
            raise Exception("Access denied")
        
        return note
    
    def update_note(self, note_key: str, data: dict):
        return self.note_repo.update(note_key, data)
    
    def delete_note(self, note_key: str):
        self.note_repo.delete(note_key)
    
    def get_user_notes(self, user_ref: str):
        return self.note_repo.get_by_user(user_ref)
    
    def move_note(self, note_key: str, data: dict):
        self.note_repo.update(
            note_key,
            {"parent_key": data.get("parent_key")}
        )