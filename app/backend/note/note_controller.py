from typing import List

from fastapi import APIRouter, Depends, Query

from auth.auth_dependencies import get_current_user_key
from note.note_schemas import NoteResponse, NoteCreate, NotePatch, NotePut, NoteFilter
from note.note_service import NoteService
from note.note_dependencies import get_note_service

router = APIRouter(prefix="/api/notes", tags=["Notes"])


@router.get("", response_model=List[NoteResponse])
def get_notes(
        user_key: str = Depends(get_current_user_key),
        filters: NoteFilter = Depends(),
        service: NoteService = Depends(get_note_service)
) -> List[NoteResponse]:
    return service.get_user_notes(user_key, filters)


@router.post("", response_model=NoteResponse)
def create_note(
        note: NoteCreate,
        user_key: str = Depends(get_current_user_key),
        service: NoteService = Depends(get_note_service),
) -> NoteResponse:
    return service.create_note(user_key, note)


@router.get("/{note_key}", response_model=NoteResponse)
def get_note(
        note_key: str,
        user_ref: str = Depends(get_current_user_key),
        service: NoteService = Depends(get_note_service)
) -> NoteResponse:
    return service.get_note(user_ref, note_key)


@router.put("/{note_key}", response_model=NoteResponse)
def update_note(
        note_key: str,
        data: NotePut,
        service: NoteService = Depends(get_note_service)
) -> NoteResponse:
    return service.replace_note(note_key, data)


@router.patch("/{note_key}")
def patch_note(
        note_key: str,
        data: NotePatch,
        service: NoteService = Depends(get_note_service)
):
    return service.patch_note(note_key, data)


@router.delete("/{note_key}")
def delete_note(
        note_key: str,
        service: NoteService = Depends(get_note_service)
):
    service.delete_note(note_key)
