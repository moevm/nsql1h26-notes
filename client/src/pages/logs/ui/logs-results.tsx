import { type KeyboardEvent, useEffect, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Log } from "@/entities/logs/types/responses";
import { LogCard } from "@/pages/logs/ui/log-card";

interface LogsResultsProps {
    logs: Log[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    pageNumbers: number[];
    hasNextPage: boolean;
    limit: number;
    offset: number;
    onGoToPage: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
}

export function LogsResults({
    logs,
    loading,
    error,
    currentPage,
    pageNumbers,
    hasNextPage,
    limit,
    offset,
    onGoToPage,
    onLimitChange,
    onPreviousPage,
    onNextPage,
}: LogsResultsProps) {
    const [limitDraft, setLimitDraft] = useState(String(limit));

    useEffect(() => {
        setLimitDraft(String(limit));
    }, [limit]);

    const commitLimit = () => {
        const nextLimit = Number.parseInt(limitDraft, 10);

        if (!Number.isFinite(nextLimit) || nextLimit < 1) {
            setLimitDraft(String(limit));
            return;
        }

        if (nextLimit !== limit) {
            onLimitChange(nextLimit);
        }
    };

    const handleLimitKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();
        commitLimit();
    };

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
                        disabled={loading || !hasNextPage}
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

            {logs.length ? (
                <div className="mt-6 border-t border-black/10 pt-6">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={loading || offset === 0}
                            onClick={onPreviousPage}
                        >
                            Назад
                        </Button>

                        {pageNumbers.map((page) => (
                            <Button
                                key={page}
                                variant={page === currentPage ? "default" : "outline"}
                                size="sm"
                                disabled={loading}
                                onClick={() => onGoToPage(page)}
                                className="min-w-10"
                            >
                                {page}
                            </Button>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={loading || !hasNextPage}
                            onClick={onNextPage}
                        >
                            Дальше
                        </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                        <span>Записей на странице</span>
                        <Input
                            type="number"
                            min={1}
                            step={1}
                            value={limitDraft}
                            onChange={(event) => setLimitDraft(event.target.value)}
                            onBlur={commitLimit}
                            onKeyDown={handleLimitKeyDown}
                            className="w-24 text-center"
                        />
                    </div>
                </div>
            ) : null}
        </section>
    );
}
