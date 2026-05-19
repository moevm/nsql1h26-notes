from typing import List

from fastapi import APIRouter, Depends

from auth.auth_dependencies import get_current_user_key, get_current_user
from model.user import User
from note.note_schemas import (
    NoteCreate,
    NoteFilter,
    NotePatch,
    NotePut,
    NoteResponse,
    NoteStatsAvailableResponse,
    NoteStatsChartFilter,
    NoteStatsChartResponse,
    NoteStatsFilter,
    NoteStatsResponse,
)
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
        user: User = Depends(get_current_user),
        service: NoteService = Depends(get_note_service),
) -> NoteResponse:
    return service.create_note(user, note)


@router.get("/stats", response_model=NoteStatsResponse)
def get_note_stats(
        user: User = Depends(get_current_user),
        filters: NoteStatsFilter = Depends(),
        service: NoteService = Depends(get_note_service),
) -> NoteStatsResponse:
    return service.get_user_note_stats(user, filters)


@router.get("/stats/available", response_model=NoteStatsAvailableResponse)
def get_available_note_stat_charts(
        user: User = Depends(get_current_user),
        service: NoteService = Depends(get_note_service),
) -> NoteStatsAvailableResponse:
    return service.get_available_note_stat_charts(user)


@router.get("/stats/chart", response_model=NoteStatsChartResponse)
def get_note_stat_chart(
        user: User = Depends(get_current_user),
        filters: NoteStatsChartFilter = Depends(),
        service: NoteService = Depends(get_note_service),
) -> NoteStatsChartResponse:
    return service.get_user_note_stat_chart(user, filters)


@router.get("/{note_key}", response_model=NoteResponse)
def get_note(
        note_key: str,
        user: User = Depends(get_current_user),
        service: NoteService = Depends(get_note_service),
) -> NoteResponse:
    return service.get_note(user, note_key)


@router.put("/{note_key}", response_model=NoteResponse)
def update_note(
        note_key: str,
        data: NotePut,
        user: User = Depends(get_current_user),
        service: NoteService = Depends(get_note_service),
) -> NoteResponse:
    return service.replace_note(note_key, user, data)


@router.patch("/{note_key}", response_model=NoteResponse)
def patch_note(
        note_key: str,
        data: NotePatch,
        user: User = Depends(get_current_user),
        service: NoteService = Depends(get_note_service),
) -> NoteResponse:
    return service.patch_note(note_key, user, data)


@router.delete("/{note_key}", status_code=204)
def delete_note(
        note_key: str,
        user: User = Depends(get_current_user),
        service: NoteService = Depends(get_note_service)
) -> None:
    service.delete_note(note_key, user)
