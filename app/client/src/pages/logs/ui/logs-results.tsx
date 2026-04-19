import { ClipboardList, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Log } from "@/entities/logs/types/responses";
import { LogCard } from "@/pages/logs/ui/log-card";

interface LogsResultsProps {
    logs: Log[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    limit: number;
    offset: number;
    onPreviousPage: () => void;
    onNextPage: () => void;
}

export function LogsResults({
    logs,
    loading,
    error,
    currentPage,
    limit,
    offset,
    onPreviousPage,
    onNextPage,
}: LogsResultsProps) {
    return (
        <section className="mx-auto w-full max-w-7xl px-6 py-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    Страница {currentPage}, найдено в выдаче: {logs.length}
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loading || offset === 0}
                        onClick={onPreviousPage}
                    >
                        Назад
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loading || logs.length < limit}
                        onClick={onNextPage}
                    >
                        Дальше
                    </Button>
                </div>
            </div>

            {loading && !logs.length ? (
                <div className="space-y-3">
                    <div className="h-40 animate-pulse rounded-md bg-muted" />
                    <div className="h-40 animate-pulse rounded-md bg-muted/80" />
                    <div className="h-40 animate-pulse rounded-md bg-muted/70" />
                </div>
            ) : error ? (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    {error}
                </div>
            ) : logs.length ? (
                <div className="space-y-3">
                    {logs.map((log) => (
                        <LogCard key={log.log_key} log={log} />
                    ))}
                </div>
            ) : (
                <div className="rounded-md border border-dashed border-black/15 bg-white p-8 text-center">
                    <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
                    <h2 className="mt-4 text-lg font-semibold">Логи не найдены</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Измените фильтры или сбросьте поиск.
                    </p>
                </div>
            )}

            {loading && logs.length ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Обновление списка
                </div>
            ) : null}
        </section>
    );
}
