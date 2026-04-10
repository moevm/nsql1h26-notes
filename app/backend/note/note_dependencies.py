from core.container import note_repo
from note.note_service import NoteService


def get_note_service():
    return NoteService(note_repo)