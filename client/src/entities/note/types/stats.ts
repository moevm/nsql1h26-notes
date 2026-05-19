export type NoteStatsAxis =
    | "created_date"
    | "updated_date"
    | "tag"
    | "user"
    | "note";

export type NoteStatsSeriesAxis = NoteStatsAxis | "none";

export type NoteStatsMetric = "notes_count" | "tags_count";

export type NoteStatsScope = "auto" | "own" | "all";

export type NoteStatsChart =
    | "created_by_day"
    | "updated_by_day"
    | "tags_popularity"
    | "created_by_day_by_user"
    | "notes_by_user"
    | "tags_by_user";

export interface NoteStatsPoint {
    x: string | null;
    series: string | null;
    value: number;
}

export interface NoteStatsChartInfo {
    chart: NoteStatsChart;
    title: string;
    description: string;
    admin_only: boolean;
}

export interface NoteStatsAvailableResponse {
    charts: NoteStatsChartInfo[];
}

export interface NoteStatsChartResponse {
    x_axis: NoteStatsAxis;
    series_axis: NoteStatsSeriesAxis;
    metric: NoteStatsMetric;
    points: NoteStatsPoint[];
    chart: NoteStatsChart;
    title: string;
}

export interface GetNoteStatsChartRequest {
    chart: NoteStatsChart;
    scope?: NoteStatsScope;
    limit?: number;
}
