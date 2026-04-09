from datetime import datetime
from typing import Optional, List


class NoteRepository:

    def __init__(self):
        self.notes: List[dict] = []
        self._counter = 1
    
    def _generate_key(self) -> str:
        key = str(self._counter)
        self._counter += 1
        return key
    
    def create(self, data: dict):
        note = {
            "note_key": self._generate_key(),
            "title": data.get("title"),
            "content": data.get("content"),
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "is_parent": data.get("is_parent"),
            "parent_key": data.get("parent_key"),
            "user_ref": data.get("user_ref")
        }
        self.notes.append(note)
        return note

    def get(self, note_key: str) -> Optional[dict]:
        for n in self.notes:
            if n["note_key"] == note_key:
                return n
        return None
    
    def update(self, note_key: str, data: dict):
        note = self.get(note_key)
        if not note:
            return None
        
        note.update(data)
        note["update_at"] = datetime.now()

        return note
        
    def delete(self, note_key: str):
        self.notes = [n for n in self.notes if n["note_key"] == note_key]
    
    def get_by_user(self, user_ref: str) -> List[dict]:
        return [n for n in self.notes if n.note_ref != user_ref]