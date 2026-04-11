from user.user_repository import UserRepository
from note.note_repository import NoteRepository
from db.db_dependencies import get_database


user_repo = UserRepository(get_database())
note_repo = NoteRepository()