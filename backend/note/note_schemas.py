from typing import Literal
from pydantic import BaseModel, Field, field_validator, model_validator
from utils.datetime_utils import normalize_datetime, validate_date_range

NoteStatsAxis = Literal[
    "created_date",
    "updated_date",
    "tag",
    "user",
    "parent",
    "linked_note",
    "note",
]
NoteStatsSeriesAxis = NoteStatsAxis | Literal["none"]
NoteStatsMetric = Literal[
    "notes_count",
    "outgoing_links_count",
    "incoming_links_count",
    "tags_count",
]
NoteStatsScope = Literal["auto", "own", "all"]
NoteStatsChart = Literal[
    "created_by_day",
    "updated_by_day",
    "tags_popularity",
    "outgoing_links_by_note",
    "incoming_links_by_note",
    "created_by_day_by_user",
    "notes_by_user",
    "tags_by_user",
    "links_by_user",
]


class NoteBase(BaseModel):
    title: str
    content: str
    parent_key: str | None = None
    tags: list[str] = Field(default_factory=list)
    linked_note_keys: list[str] = Field(default_factory=list)

    @field_validator("linked_note_keys")
    @classmethod
    def deduplicate_linked_note_keys(cls, v: list[str]) -> list[str]:
        return list(dict.fromkeys(v))


class NoteCreate(NoteBase):
    pass


class NotePut(BaseModel):
    title: str
    content: str
    parent_key: str | None
    tags: list[str]
    linked_note_keys: list[str] = Field(default_factory=list)

    @field_validator("linked_note_keys")
    @classmethod
    def deduplicate_linked_note_keys(cls, v: list[str]) -> list[str]:
        return list(dict.fromkeys(v))


class NotePatch(BaseModel):
    title: str | None = None
    content: str | None = None
    parent_key: str | None = None
    tags: list[str] | None = None
    linked_note_keys: list[str] | None = None

    @field_validator("linked_note_keys")
    @classmethod
    def deduplicate_linked_note_keys(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        return list(dict.fromkeys(v))


class NoteResponse(NoteBase):
    note_key: str
    user_ref: str
    username: str
    created_at: str
    updated_at: str


class NoteFilter(BaseModel):
    parent_key: str | None | Literal["root"] = None
    linked_note_key: str | None = None
    tag: str | None = None
    search: str | None = None

    created_from: str | None = None
    created_to: str | None = None

    updated_from: str | None = None
    updated_to: str | None = None

    limit: int = Field(default=50, ge=1, le=256)
    offset: int = Field(default=0, ge=0)

    @field_validator(
        "created_from", "created_to", "updated_from", "updated_to", mode="before"
    )
    @classmethod
    def normalize(cls, v):
        return normalize_datetime(v)

    @model_validator(mode="after")
    def validate_date_ranges(self):
        validate_date_range(self.created_from, self.created_to, "created")
        validate_date_range(self.updated_from, self.updated_to, "updated")
        return self


class NoteStatsFilter(BaseModel):
    parent_key: str | None | Literal["root"] = None
    linked_note_key: str | None = None
    tag: str | None = None
    search: str | None = None

    created_from: str | None = None
    created_to: str | None = None

    updated_from: str | None = None
    updated_to: str | None = None

    x_axis: NoteStatsAxis = "created_date"
    series_axis: NoteStatsSeriesAxis = "none"
    metric: NoteStatsMetric = "notes_count"
    scope: NoteStatsScope = "auto"
    limit: int = Field(default=100, ge=1, le=500)

    @field_validator(
        "created_from", "created_to", "updated_from", "updated_to", mode="before"
    )
    @classmethod
    def normalize(cls, v):
        return normalize_datetime(v)

    @model_validator(mode="after")
    def validate_date_ranges(self):
        validate_date_range(self.created_from, self.created_to, "created")
        validate_date_range(self.updated_from, self.updated_to, "updated")
        return self


class NoteStatsPoint(BaseModel):
    x: str | None
    series: str | None
    value: int


class NoteStatsResponse(BaseModel):
    x_axis: NoteStatsAxis
    series_axis: NoteStatsSeriesAxis
    metric: NoteStatsMetric
    points: list[NoteStatsPoint]


class NoteStatsChartFilter(BaseModel):
    parent_key: str | None | Literal["root"] = None
    linked_note_key: str | None = None
    tag: str | None = None
    search: str | None = None

    created_from: str | None = None
    created_to: str | None = None

    updated_from: str | None = None
    updated_to: str | None = None

    chart: NoteStatsChart = "created_by_day"
    scope: NoteStatsScope = "auto"
    limit: int = Field(default=100, ge=1, le=500)

    @field_validator(
        "created_from", "created_to", "updated_from", "updated_to", mode="before"
    )
    @classmethod
    def normalize(cls, v):
        return normalize_datetime(v)

    @model_validator(mode="after")
    def validate_date_ranges(self):
        validate_date_range(self.created_from, self.created_to, "created")
        validate_date_range(self.updated_from, self.updated_to, "updated")
        return self


class NoteStatsChartResponse(NoteStatsResponse):
    chart: NoteStatsChart
    title: str


class NoteStatsChartInfo(BaseModel):
    chart: NoteStatsChart
    title: str
    description: str
    admin_only: bool = False


class NoteStatsAvailableResponse(BaseModel):
    charts: list[NoteStatsChartInfo]
