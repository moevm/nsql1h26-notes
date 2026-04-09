from note.note_repository import NoteRepository
from note.note_service import NoteService


note_repo = NoteRepository()


def get_note_service():
    return NoteService(note_repo)