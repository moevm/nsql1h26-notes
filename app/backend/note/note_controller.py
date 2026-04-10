from fastapi import APIRouter, Depends, Query

from auth.auth_dependencies import get_current_user_key
from note.note_service import NoteService
from note.note_dependencies import get_note_service


router = APIRouter(prefix="/api/notes", tags=["Notes"])


@router.post("")
def create_note(
    data: dict,
    user_key: str = Depends(get_current_user_key),
    service: NoteService = Depends(get_note_service)
):
    return service.create_note(user_key, data)

@router.get("/{note_key}")
def get_note(
    note_key: str,
    user_ref: str = Depends(get_current_user_key),
    service: NoteService = Depends(get_note_service)
):
    return service.get_note(user_ref, note_key)


@router.put("/{note_key}")
def update_note(
    note_key: str,
    data: dict,
    service: NoteService = Depends(get_note_service)
):
    return service.update_note(note_key, data)


@router.delete("/{note_key}")
def delete_note(
    note_key: str,
    service: NoteService = Depends(get_note_service)
):
    return service.delete_note(note_key)


@router.get("")
def get_notes(
    user_key: str = Depends(get_current_user_key),
    service: NoteService = Depends(get_note_service)
):
    return service.get_user_notes(user_key)


@router.patch("/{note_key}/move")
def move_note(
    note_key: str,
    data: dict,
    service: NoteService = Depends(get_note_service)
):
    return service.move_note(note_key, data)