import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {BarChart3, Loader2} from "lucide-react";

import {noteProxy} from "@/entities/note/api/proxy";
import type {
    NoteStatsAxis,
    NoteStatsChart,
    NoteStatsChartInfo,
    NoteStatsChartResponse,
    NoteStatsMetric,
    NoteStatsPoint,
    NoteStatsResponse,
    NoteStatsScope,
    NoteStatsSeriesAxis,
} from "@/entities/note/types/stats";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import {Header} from "@/shared/layout/Header";
import {useAccessTokenPayload} from "@/shared/hooks/use-access-token-payload";
import {isAdminRole} from "@/shared/lib/access-token-payload";
import {getAccessToken, setAccessToken} from "@/shared/lib/auth-state";
import {clearRefreshToken, clearStoredAccessToken, getRefreshToken,} from "@/shared/lib/token-storage";

const chartOrder: NoteStatsChart[] = [
    "created_by_day",
    "updated_by_day",
    "tags_popularity",
    "created_by_day_by_user",
    "notes_by_user",
    "tags_by_user",
];

const palette = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#be123c",
    "#4f46e5",
];

type ChartState = {
    info: NoteStatsChartInfo;
    data: NoteStatsChartResponse | null;
    loading: boolean;
};

type FlatPoint = {
    name: string;
    value: number;
};

type PivotRow = {
    name: string;
    [series: string]: string | number;
};

const TOP_SERIES_COUNT = 5;
const TOP_BAR_COUNT = 8;

const axisLabels: Record<NoteStatsAxis, string> = {
    created_date: "Дата создания",
    updated_date: "Дата обновления",
    tag: "Тег",
    user: "Пользователь",
    note: "Заметка",
};

const seriesLabels: Record<NoteStatsSeriesAxis, string> = {
    ...axisLabels,
    none: "Без группировки",
};

const metricLabels: Record<NoteStatsMetric, string> = {
    notes_count: "Количество заметок",
    tags_count: "Количество тегов",
};

const scopeLabels: Record<NoteStatsScope, string> = {
    auto: "Автоматически",
    own: "Мои данные",
    all: "Все данные",
};

const allowedCustomStats: Record<
    NoteStatsMetric,
    Partial<Record<NoteStatsAxis, NoteStatsSeriesAxis[]>>
> = {
    notes_count: {
        created_date: ["none", "user"],
        updated_date: ["none", "user"],
        tag: ["none"],
        user: ["none"],
    },
    tags_count: {
        note: ["none"],
        user: ["none"],
        created_date: ["none"],
        updated_date: ["none"],
    },
};

const selectClassName =
    "h-10 rounded-md border border-input bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-primary";

function formatLabel(value: string | null) {
    if (!value) {
        return "Без значения";
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return date.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "short",
        });
    }

    return value;
}

function sortChartInfos(charts: NoteStatsChartInfo[]) {
    return [...charts].sort(
        (a, b) => chartOrder.indexOf(a.chart) - chartOrder.indexOf(b.chart),
    );
}

function getFlatPoints(points: NoteStatsPoint[]): FlatPoint[] {
    return points.map((point) => ({
        name: formatLabel(point.x),
        value: point.value,
    }));
}

function getPivotRows(points: NoteStatsPoint[]) {
    const seriesTotals = new Map<string, number>();

    points.forEach((point) => {
        const seriesName = point.series ?? "Всего";
        seriesTotals.set(
            seriesName,
            (seriesTotals.get(seriesName) ?? 0) + point.value,
        );
    });

    const topSeries = Array.from(seriesTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_SERIES_COUNT)
        .map(([seriesName]) => seriesName);
    const topSeriesSet = new Set(topSeries);
    const hasOtherSeries = seriesTotals.size > TOP_SERIES_COUNT;
    const rows = new Map<string, PivotRow>();

    points.forEach((point) => {
        const name = formatLabel(point.x);
        const rawSeriesName = point.series ?? "Всего";
        const seriesName = topSeriesSet.has(rawSeriesName)
            ? rawSeriesName
            : "Остальные";

        const row = rows.get(name) ?? { name };
        row[seriesName] = ((row[seriesName] as number | undefined) ?? 0) + point.value;
        rows.set(name, row);
    });

    return {
        rows: Array.from(rows.values()),
        series: hasOtherSeries ? [...topSeries, "Остальные"] : topSeries,
    };
}

function getTopFlatPoints(points: FlatPoint[]): FlatPoint[] {
    const sorted = [...points].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, TOP_BAR_COUNT);
    const rest = sorted.slice(TOP_BAR_COUNT);
    const restValue = rest.reduce((sum, point) => sum + point.value, 0);

    if (!restValue) {
        return top;
    }

    return [...top, { name: "Остальные", value: restValue }];
}

function getTotal(points: NoteStatsPoint[]) {
    return points.reduce((sum, point) => sum + point.value, 0);
}

function ChartBody({
    chart,
}: {
    chart: NoteStatsResponse & { chart?: NoteStatsChart };
}) {
    const flatPoints = useMemo(() => getFlatPoints(chart.points), [chart.points]);
    const topFlatPoints = useMemo(() => getTopFlatPoints(flatPoints), [flatPoints]);
    const pivot = useMemo(() => getPivotRows(chart.points), [chart.points]);

    if (!chart.points.length) {
        return (
            <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-black/15 bg-white text-sm text-muted-foreground">
                Нет данных для отображения
            </div>
        );
    }

    if (
        chart.chart === "notes_by_user" ||
        chart.chart === "tags_by_user" ||
        (chart.x_axis === "user" && chart.series_axis === "none")
    ) {
        return (
            <div className="space-y-3">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topFlatPoints}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            interval={0}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#2563eb" />
                    </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground">
                    Показаны топ-{TOP_BAR_COUNT} пользователей, остальные
                    объединены в один столбец.
                </p>
            </div>
        );
    }

    if (chart.series_axis !== "none") {
        return (
            <div className="space-y-3">
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={pivot.rows}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        {pivot.series.map((seriesName, index) => (
                            <Area
                                key={seriesName}
                                dataKey={seriesName}
                                fill={palette[index % palette.length]}
                                fillOpacity={0.14}
                                stroke={palette[index % palette.length]}
                                strokeWidth={2}
                                type="monotone"
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground">
                    Показаны топ-{TOP_SERIES_COUNT} пользователей, остальные
                    объединены в отдельную серию.
                </p>
            </div>
        );
    }

    if (chart.chart === "tags_popularity" || chart.x_axis === "tag") {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={flatPoints}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={64}
                        outerRadius={110}
                        paddingAngle={2}
                    >
                        {flatPoints.map((point, index) => (
                            <Cell
                                key={point.name}
                                fill={palette[index % palette.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={flatPoints}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#2563eb" />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function StatsPage() {
    const navigate = useNavigate();
    const currentUser = useAccessTokenPayload();
    const isAdmin = isAdminRole(currentUser?.role);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [charts, setCharts] = useState<ChartState[]>([]);
    const [mode, setMode] = useState<"ready" | "custom">("ready");
    const [customMetric, setCustomMetric] =
        useState<NoteStatsMetric>("notes_count");
    const [customXAxis, setCustomXAxis] =
        useState<NoteStatsAxis>("created_date");
    const [customSeriesAxis, setCustomSeriesAxis] =
        useState<NoteStatsSeriesAxis>("none");
    const [customScope, setCustomScope] = useState<NoteStatsScope>("auto");
    const [customStats, setCustomStats] = useState<NoteStatsResponse | null>(
        null,
    );
    const [customLoading, setCustomLoading] = useState(false);
    const [customError, setCustomError] = useState<string | null>(null);

    useEffect(() => {
        if (!getAccessToken() && !getRefreshToken()) {
            navigate("/auth/signin", { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        let alive = true;

        const loadStats = async () => {
            setLoading(true);
            setError(null);

            try {
                const available = await noteProxy.getAvailableStatsCharts();
                const infos = sortChartInfos(available.charts);

                if (!alive) {
                    return;
                }

                setCharts(
                    infos.map((info) => ({
                        info,
                        data: null,
                        loading: true,
                    })),
                );

                const loadedCharts = await Promise.all(
                    infos.map(async (info) => ({
                        info,
                        data: await noteProxy.getStatsChart({
                            chart: info.chart,
                            scope: isAdmin && info.admin_only ? "all" : "auto",
                            limit: info.chart === "tags_popularity" ? 12 : 100,
                        }),
                        loading: false,
                    })),
                );

                if (alive) {
                    setCharts(loadedCharts);
                }
            } catch (err) {
                if (!alive) {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : "Не удалось загрузить статистику",
                );
            } finally {
                if (alive) {
                    setLoading(false);
                }
            }
        };

        void loadStats();

        return () => {
            alive = false;
        };
    }, [isAdmin]);

    const availableCustomXAxes = useMemo(
        () =>
            Object.keys(allowedCustomStats[customMetric]) as NoteStatsAxis[],
        [customMetric],
    );

    const availableCustomSeriesAxes = useMemo(
        () =>
            (allowedCustomStats[customMetric][customXAxis] ?? [
                "none",
            ]) as NoteStatsSeriesAxis[],
        [customMetric, customXAxis],
    );

    useEffect(() => {
        const nextAxes = Object.keys(
            allowedCustomStats[customMetric],
        ) as NoteStatsAxis[];

        if (!nextAxes.includes(customXAxis)) {
            setCustomXAxis(nextAxes[0]);
            return;
        }

        const nextSeries = allowedCustomStats[customMetric][customXAxis] ?? [
            "none",
        ];

        if (!nextSeries.includes(customSeriesAxis)) {
            setCustomSeriesAxis(nextSeries[0]);
        }
    }, [customMetric, customSeriesAxis, customXAxis]);

    useEffect(() => {
        if (mode !== "custom") {
            return;
        }

        let alive = true;

        const loadCustomStats = async () => {
            setCustomLoading(true);
            setCustomError(null);

            const result = await noteProxy.getStats({
                metric: customMetric,
                x_axis: customXAxis,
                series_axis: customSeriesAxis,
                scope: isAdmin ? customScope : "auto",
                limit: 120,
            });

            if (!alive) {
                return;
            }

            setCustomStats(result);
            if (!result) {
                setCustomError("Такая комбинация параметров недоступна");
            }
            setCustomLoading(false);
        };

        void loadCustomStats();

        return () => {
            alive = false;
        };
    }, [
        customMetric,
        customScope,
        customSeriesAxis,
        customXAxis,
        isAdmin,
        mode,
    ]);

    const totals = useMemo(() => {
        const notesTotal =
            charts
                .find((chart) => chart.info.chart === "created_by_day")
                ?.data?.points.reduce((sum, point) => sum + point.value, 0) ??
            0;
        const tagsTotal =
            charts
                .find((chart) => chart.info.chart === "tags_popularity")
                ?.data?.points.reduce((sum, point) => sum + point.value, 0) ??
            0;

        return {
            notesTotal,
            tagsTotal,
            chartsTotal: charts.length,
        };
    }, [charts]);

    const logout = () => {
        clearStoredAccessToken();
        clearRefreshToken();
        setAccessToken(null);
        navigate("/auth/signin", { replace: true });
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#fafafa] text-foreground">
            <Header
                title="Статистика"
                buttons={[
                    {
                        title: "Мои заметки",
                        onClick: () => navigate("/notes/new"),
                        variant: "outline",
                    },
                    {
                        title: "Моя страница",
                        onClick: () => navigate("/logs/my"),
                        variant: "outline",
                    },
                    ...(isAdmin
                        ? [
                              {
                                  title: "Админ-панель",
                                  onClick: () => navigate("/admin/logs"),
                                  variant: "secondary" as const,
                              },
                          ]
                        : []),
                    {
                        title: "Выйти",
                        onClick: logout,
                        variant: "outline",
                        className:
                            "border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600",
                    },
                ]}
            />

            <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-5">
                    <section className="grid gap-3 sm:grid-cols-3">
                        <Card>
                            <CardHeader className="p-5 pb-2">
                                <CardDescription>Создано заметок</CardDescription>
                                <CardTitle className="text-3xl">
                                    {totals.notesTotal}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="p-5 pb-2">
                                <CardDescription>Активных тегов</CardDescription>
                                <CardTitle className="text-3xl">
                                    {totals.tagsTotal}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="p-5 pb-2">
                                <CardDescription>Доступно графиков</CardDescription>
                                <CardTitle className="text-3xl">
                                    {totals.chartsTotal}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </section>

                    {error ? (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-5 text-sm text-red-700">
                                {error}
                            </CardContent>
                        </Card>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant={mode === "ready" ? "default" : "outline"}
                            onClick={() => setMode("ready")}
                        >
                            Готовые графики
                        </Button>
                        <Button
                            variant={mode === "custom" ? "default" : "outline"}
                            onClick={() => setMode("custom")}
                        >
                            Свой график
                        </Button>
                    </div>

                    {mode === "custom" ? (
                        <Card>
                            <CardHeader className="p-5">
                                <CardTitle className="text-lg">
                                    Конструктор графика
                                </CardTitle>
                                <CardDescription>
                                    Данные берутся из универсальной ручки
                                    статистики. Выберите метрику, ось и
                                    группировку.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5 p-5 pt-0">
                                <div className="grid gap-3 md:grid-cols-4">
                                    <label className="flex flex-col gap-1 text-sm">
                                        <span className="text-muted-foreground">
                                            Метрика
                                        </span>
                                        <select
                                            className={selectClassName}
                                            value={customMetric}
                                            onChange={(event) =>
                                                setCustomMetric(
                                                    event.target
                                                        .value as NoteStatsMetric,
                                                )
                                            }
                                        >
                                            {Object.entries(metricLabels).map(
                                                ([value, label]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>

                                    <label className="flex flex-col gap-1 text-sm">
                                        <span className="text-muted-foreground">
                                            Ось X
                                        </span>
                                        <select
                                            className={selectClassName}
                                            value={customXAxis}
                                            onChange={(event) =>
                                                setCustomXAxis(
                                                    event.target
                                                        .value as NoteStatsAxis,
                                                )
                                            }
                                        >
                                            {availableCustomXAxes.map((axis) => (
                                                <option key={axis} value={axis}>
                                                    {axisLabels[axis]}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="flex flex-col gap-1 text-sm">
                                        <span className="text-muted-foreground">
                                            Данные
                                        </span>
                                        <select
                                            className={selectClassName}
                                            value={customScope}
                                            disabled={!isAdmin}
                                            onChange={(event) =>
                                                setCustomScope(
                                                    event.target
                                                        .value as NoteStatsScope,
                                                )
                                            }
                                        >
                                            {Object.entries(scopeLabels).map(
                                                ([value, label]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>
                                </div>

                                {customLoading ? (
                                    <div className="flex h-[300px] items-center justify-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Строим график...
                                    </div>
                                ) : customError ? (
                                    <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-red-200 bg-red-50 text-sm text-red-700">
                                        {customError}
                                    </div>
                                ) : customStats ? (
                                    <ChartBody chart={customStats} />
                                ) : (
                                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                        Выберите параметры графика
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : null}

                    {mode === "ready" && loading && !charts.length ? (
                        <div className="flex h-72 items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Загрузка статистики...
                        </div>
                    ) : null}

                    {mode === "ready" && !loading && !charts.length ? (
                        <Card>
                            <CardContent className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
                                <BarChart3 className="h-9 w-9" />
                                <div className="text-sm">
                                    Пока нет доступной статистики
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate("/notes/new")}
                                >
                                    Создать заметку
                                </Button>
                            </CardContent>
                        </Card>
                    ) : null}

                    {mode === "ready" ? (
                        <section className="grid gap-5 xl:grid-cols-2">
                            {charts.map(
                                ({ info, data, loading: chartLoading }) => (
                                    <Card key={info.chart}>
                                        <CardHeader className="p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <CardTitle className="text-lg leading-tight">
                                                        {data?.title ??
                                                            info.title}
                                                    </CardTitle>
                                                    <CardDescription className="mt-2">
                                                        {info.description}
                                                    </CardDescription>
                                                </div>
                                                <div className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                                    {data
                                                        ? getTotal(data.points)
                                                        : 0}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-5 pt-0">
                                            {chartLoading ? (
                                                <div className="flex h-[300px] items-center justify-center gap-2 text-sm text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Загрузка...
                                                </div>
                                            ) : data ? (
                                                <ChartBody chart={data} />
                                            ) : (
                                                <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                                                    Не удалось загрузить график
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ),
                            )}
                        </section>
                    ) : null}
                </div>
            </main>
        </div>
    );
}
