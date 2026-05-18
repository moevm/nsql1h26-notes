from typing import List

from fastapi import HTTPException

from auth.auth_schemas import UserRole
from share.share_schemas import ShareRole
from model.user import User
from note.note_repository import NoteRepository
from note.note_schemas import (
    NoteCreate,
    NoteResponse,
    NotePut,
    NotePatch,
    NoteFilter,
    NoteStatsAvailableResponse,
    NoteStatsChart,
    NoteStatsChartFilter,
    NoteStatsChartInfo,
    NoteStatsChartResponse,
    NoteStatsFilter,
    NoteStatsPoint,
    NoteStatsResponse,
)
from log.log_service import LogService
from log.log_schemas import NotesLogCreate, NoteAction, NoteSnapshot
from permission.permission_repository import PermissionRepository


class NoteService:
    STATS_CHARTS: dict[NoteStatsChart, dict] = {
        "created_by_day": {
            "title": "Созданные заметки по дням",
            "description": "Сколько заметок было создано в каждый день.",
            "x_axis": "created_date",
            "series_axis": "none",
            "metric": "notes_count",
            "admin_only": False,
        },
        "updated_by_day": {
            "title": "Обновленные заметки по дням",
            "description": "Сколько заметок было обновлено в каждый день.",
            "x_axis": "updated_date",
            "series_axis": "none",
            "metric": "notes_count",
            "admin_only": False,
        },
        "tags_popularity": {
            "title": "Популярность тегов",
            "description": "Сколько заметок содержит каждый тег.",
            "x_axis": "tag",
            "series_axis": "none",
            "metric": "notes_count",
            "admin_only": False,
        },
        "outgoing_links_by_note": {
            "title": "Исходящие ссылки по заметкам",
            "description": "Какие заметки чаще всего ссылаются на другие заметки.",
            "x_axis": "note",
            "series_axis": "none",
            "metric": "outgoing_links_count",
            "admin_only": False,
        },
        "incoming_links_by_note": {
            "title": "Входящие ссылки по заметкам",
            "description": "На какие заметки чаще всего ссылаются.",
            "x_axis": "note",
            "series_axis": "none",
            "metric": "incoming_links_count",
            "admin_only": False,
        },
        "created_by_day_by_user": {
            "title": "Созданные заметки по дням и пользователям",
            "description": "Сколько заметок каждый пользователь создал в каждый день.",
            "x_axis": "created_date",
            "series_axis": "user",
            "metric": "notes_count",
            "admin_only": True,
        },
        "notes_by_user": {
            "title": "Заметки по пользователям",
            "description": "Сколько заметок принадлежит каждому пользователю.",
            "x_axis": "user",
            "series_axis": "none",
            "metric": "notes_count",
            "admin_only": True,
        },
        "tags_by_user": {
            "title": "Теги по пользователям",
            "description": "Сколько заметок с каждым тегом есть у каждого пользователя.",
            "x_axis": "tag",
            "series_axis": "user",
            "metric": "notes_count",
            "admin_only": True,
        },
        "links_by_user": {
            "title": "Ссылки по пользователям",
            "description": "Сколько ссылок на другие заметки создал каждый пользователь.",
            "x_axis": "user",
            "series_axis": "none",
            "metric": "outgoing_links_count",
            "admin_only": True,
        },
    }

    def __init__(
        self,
        repo: NoteRepository,
        log_service: LogService,
        permission_repo: PermissionRepository,
    ):
        self.repo = repo
        self.log_service = log_service
        self.permission_repo = permission_repo

    @staticmethod
    def _to_response(note: dict) -> NoteResponse:
        return NoteResponse(
            note_key=note["_key"],
            title=note["title"],
            content=note["content"],
            parent_key=note.get("parent_key"),
            tags=note.get("tags", []),
            linked_note_keys=note.get("linked_note_keys", []),
            created_at=note["created_at"],
            updated_at=note["updated_at"],
            user_ref=note["user_ref"],
            username=note["username"],
        )

    @staticmethod
    def _to_snapshot(note: dict) -> NoteSnapshot:
        return NoteSnapshot(
            title=note["title"],
            content=note["content"],
            parent_key=note.get("parent_key"),
            tags=note.get("tags", []),
            linked_note_keys=note.get("linked_note_keys", []),
        )

    def _check_note_access(
        self,
        note: dict,
        user: User,
        required_role: ShareRole = ShareRole.READ,
    ):
        if user.role == UserRole.ADMIN:
            return
        if note["user_ref"] == user.user_key:
            return
        permission = self.permission_repo.get(user.user_key, note["_key"])
        if not permission:
            raise HTTPException(403, "Access denied")

        role = ShareRole(permission["role"])

        if required_role == ShareRole.READ:
            if role not in (ShareRole.READ, ShareRole.WRITE):
                raise HTTPException(403, "Access denied")
        elif required_role == ShareRole.WRITE:
            if role != ShareRole.WRITE:
                raise HTTPException(403, "Write access denied")

    def _get_note_with_access(
        self,
        note_key: str,
        user: User,
        required_role: ShareRole = ShareRole.READ,
    ) -> dict:
        note = self.repo.get(note_key)

        if not note:
            raise HTTPException(404, "Note not found")

        self._check_note_access(note, user, required_role)

        return note

    def _check_cycle(self, parent_key: str, note_key: str):
        current = parent_key
        while current:
            if current == note_key:
                raise HTTPException(400, "Cycle detected in note hierarchy")

            parent = self.repo.get(current)
            if not parent:
                break
            current = parent.get("parent_key")

    def _validate_parent(
        self,
        parent_key: str,
        user: User,
        note_key: str | None = None,
    ):
        parent = self.repo.get(parent_key)

        if not parent:
            raise HTTPException(400, "Parent note does not exist")

        self._check_note_access(parent, user, ShareRole.WRITE)

        if note_key:
            if parent_key == note_key:
                raise HTTPException(400, "Note cannot be its own parent")

            self._check_cycle(parent_key, note_key)

    def _validate_linked_notes(
        self,
        linked_note_keys: list[str],
        user: User,
        note_key: str | None = None,
    ):
        for linked_note_key in linked_note_keys:
            if linked_note_key == note_key:
                raise HTTPException(400, "Note cannot link to itself")

            linked_note = self.repo.get(linked_note_key)

            if not linked_note:
                raise HTTPException(400, "Linked note does not exist")

            self._check_note_access(linked_note, user, ShareRole.READ)

    def create_note(self, user: User, data: NoteCreate) -> NoteResponse:
        if data.parent_key:
            self._validate_parent(data.parent_key, user)
        self._validate_linked_notes(data.linked_note_keys, user)

        note = self.repo.create({**data.model_dump(), "user_ref": user.user_key})
        response_note = self._to_response(note)
        self.log_service.create_note_log(
            user.user_key,
            user.username,
            NotesLogCreate(
                action=NoteAction.CREATE,
                note_key=response_note.note_key,
                state_before=NoteSnapshot(
                    title="",
                    content="",
                    parent_key=None,
                    tags=[],
                    linked_note_keys=[],
                ),
                state_after=self._to_snapshot(note),
                diff="",
            ),
        )

        return response_note

    def get_note(self, user: User, note_key: str) -> NoteResponse:
        note = self._get_note_with_access(note_key, user, ShareRole.READ)

        return self._to_response(note)

    def patch_note(self, note_key: str, user: User, data: NotePatch) -> NoteResponse:
        note = self._get_note_with_access(note_key, user, ShareRole.WRITE)
        before = self._to_snapshot(note)
        payload = data.model_dump(exclude_unset=True)
        if "parent_key" in payload and payload["parent_key"] is not None:
            self._validate_parent(payload["parent_key"], user, note_key)
        if "linked_note_keys" in payload and payload["linked_note_keys"] is not None:
            self._validate_linked_notes(payload["linked_note_keys"], user, note_key)
        updated = self.repo.update(note_key, payload)
        if not updated:
            raise HTTPException(404, "Note not found")
        after = self._to_snapshot(updated)
        self.log_service.create_note_log(
            user.user_key,
            user.username,
            NotesLogCreate(
                action=NoteAction.UPDATE,
                note_key=note_key,
                state_before=before,
                state_after=after,
                diff="",
            ),
        )
        return self._to_response(updated)

    def replace_note(self, note_key: str, user: User, data: NotePut) -> NoteResponse:
        note = self._get_note_with_access(note_key, user, ShareRole.WRITE)
        before = self._to_snapshot(note)
        if data.parent_key is not None:
            self._validate_parent(data.parent_key, user, note_key)
        self._validate_linked_notes(data.linked_note_keys, user, note_key)
        updated = self.repo.update(note_key, data.model_dump())
        if not updated:
            raise HTTPException(404, "Note not found")
        after = self._to_snapshot(updated)
        self.log_service.create_note_log(
            user.user_key,
            user.username,
            NotesLogCreate(
                action=NoteAction.UPDATE,
                note_key=note_key,
                state_before=before,
                state_after=after,
                diff="",
            ),
        )
        return self._to_response(updated)

    def delete_note(self, note_key: str, user: User) -> None:
        note = self._get_note_with_access(note_key, user, ShareRole.WRITE)
        before = self._to_snapshot(note)
        self.log_service.create_note_log(
            user.user_key,
            user.username,
            NotesLogCreate(
                action=NoteAction.DELETE,
                note_key=note_key,
                state_before=before.model_dump(),
                state_after=NoteSnapshot(
                    title="",
                    content="",
                    parent_key=None,
                    tags=[],
                    linked_note_keys=[],
                ),
                diff="",
            ),
        )
        ok = self.repo.delete(note_key)
        if not ok:
            raise HTTPException(404, "Note not found")

    def get_user_notes(self, user_ref: str, filters: NoteFilter) -> List[NoteResponse]:
        notes = self.repo.get_by_user(user_ref, filters)
        return [self._to_response(n) for n in notes]

    def get_user_note_stats(
        self,
        user: User,
        filters: NoteStatsFilter,
    ) -> NoteStatsResponse:
        if filters.scope == "all" and user.role != UserRole.ADMIN:
            raise HTTPException(403, "Admin access required for all users scope")

        user_ref = self._resolve_stats_user_ref(user, filters.scope)
        points = self.repo.get_stats(user_ref, filters)
        return NoteStatsResponse(
            x_axis=filters.x_axis,
            series_axis=filters.series_axis,
            metric=filters.metric,
            points=[NoteStatsPoint(**point) for point in points],
        )

    @staticmethod
    def _resolve_stats_user_ref(user: User, scope: str = "auto") -> str | None:
        if user.role != UserRole.ADMIN:
            return user.user_key
        if scope == "own":
            return user.user_key
        return None

    def get_available_note_stat_charts(self, user: User) -> NoteStatsAvailableResponse:
        is_admin = user.role == UserRole.ADMIN
        return NoteStatsAvailableResponse(
            charts=[
                NoteStatsChartInfo(
                    chart=chart,
                    title=config["title"],
                    description=config["description"],
                    admin_only=config["admin_only"],
                )
                for chart, config in self.STATS_CHARTS.items()
                if is_admin or not config["admin_only"]
            ]
        )

    def get_user_note_stat_chart(
        self,
        user: User,
        filters: NoteStatsChartFilter,
    ) -> NoteStatsChartResponse:
        config = self.STATS_CHARTS[filters.chart]
        if config["admin_only"] and user.role != UserRole.ADMIN:
            raise HTTPException(403, "Admin access required for this chart")

        if filters.scope == "all" and user.role != UserRole.ADMIN:
            raise HTTPException(403, "Admin access required for all users scope")

        stats_filter = NoteStatsFilter(
            parent_key=filters.parent_key,
            linked_note_key=filters.linked_note_key,
            tag=filters.tag,
            search=filters.search,
            created_from=filters.created_from,
            created_to=filters.created_to,
            updated_from=filters.updated_from,
            updated_to=filters.updated_to,
            x_axis=config["x_axis"],
            series_axis=config["series_axis"],
            metric=config["metric"],
            limit=filters.limit,
        )
        user_ref = self._resolve_stats_user_ref(user, filters.scope)
        points = self.repo.get_stats(user_ref, stats_filter)
        return NoteStatsChartResponse(
            chart=filters.chart,
            title=config["title"],
            x_axis=stats_filter.x_axis,
            series_axis=stats_filter.series_axis,
            metric=stats_filter.metric,
            points=[NoteStatsPoint(**point) for point in points],
        )
