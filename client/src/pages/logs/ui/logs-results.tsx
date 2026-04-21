import {type KeyboardEvent, type ReactNode, useEffect, useState} from "react";
import {ClipboardList, Loader2} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import type {Log} from "@/entities/logs/types/responses";
import {typeLabels} from "@/pages/logs/ui/constants";
import {formatDate, formatKey, getActionLabel, getLogTitle} from "@/pages/logs/ui/helpers";

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

function EmptyCell() {
    return <span className="text-xs text-muted-foreground">-</span>;
}

function ValueLabel({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex rounded-sm bg-black/[0.05] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {children}
        </span>
    );
}

function NoteValueBlock({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1 rounded-md bg-black/[0.03] p-2">
            <ValueLabel>{label}</ValueLabel>
            <div className="text-sm break-words">{children}</div>
        </div>
    );
}

function TagsList({ tags }: { tags?: string[] }) {
    if (!tags?.length) {
        return <span className="text-xs text-muted-foreground">нет тегов</span>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
                <span key={tag} className="rounded-sm border border-black/10 px-1.5 py-0.5 text-xs">
                    {tag}
                </span>
            ))}
        </div>
    );
}

function NoteComparisonCell({
    before,
    after,
}: {
    before: ReactNode;
    after: ReactNode;
}) {
    return (
        <div className="min-w-[240px] space-y-2">
            <NoteValueBlock label="До">{before}</NoteValueBlock>
            <NoteValueBlock label="После">{after}</NoteValueBlock>
        </div>
    );
}

function getStateText(value?: string | null, emptyLabel = "Пусто") {
    const normalized = value?.trim();
    return normalized || <span className="text-xs text-muted-foreground">{emptyLabel}</span>;
}

function LogEntityCell({ log }: { log: Log }) {
    if (log.type === "registration") {
        return (
            <div className="min-w-0">
                <p className="font-medium">Новый пользователь</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground" title={log.user_key}>
                    {formatKey(log.user_key)}
                </p>
            </div>
        );
    }

    if (log.type === "permission") {
        return (
            <div className="min-w-0">
                <p className="font-medium">Изменение доступа</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground" title={log.note_key}>
                    note: {formatKey(log.note_key)}
                </p>
            </div>
        );
    }

    return (
        <div className="min-w-0">
            <p className="truncate font-medium">{getLogTitle(log)}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground" title={log.note_key}>
                note: {formatKey(log.note_key)}
            </p>
        </div>
    );
}

function LogActorsCell({ log }: { log: Log }) {
    if (log.type === "registration") {
        return (
            <p className="font-mono text-xs text-muted-foreground" title={log.user_key}>
                {formatKey(log.user_key)}
            </p>
        );
    }

    if (log.type === "permission") {
        return (
            <div className="space-y-1 text-xs text-muted-foreground">
                <p title={log.granted_by_key}>
                    От: <span className="font-mono">{formatKey(log.granted_by_key)}</span>
                </p>
                <p title={log.granted_to_key}>
                    Кому: <span className="font-mono">{formatKey(log.granted_to_key)}</span>
                </p>
            </div>
        );
    }

    return (
        <p className="font-mono text-xs text-muted-foreground" title={log.user_key}>
            {formatKey(log.user_key)}
        </p>
    );
}

function LogContentCell({ log }: { log: Log }) {
    if (log.type !== "note") {
        return <LogEntityCell log={log} />;
    }

    return (
        <NoteComparisonCell
            before={getStateText(log.state_before?.content, "Пустое описание")}
            after={getStateText(log.state_after?.content, "Пустое описание")}
        />
    );
}

function LogTitleCell({ log }: { log: Log }) {
    if (log.type !== "note") {
        return <EmptyCell />;
    }

    return (
        <NoteComparisonCell
            before={getStateText(log.state_before?.title, "Без названия")}
            after={getStateText(log.state_after?.title, "Без названия")}
        />
    );
}

function LogTagsCell({ log }: { log: Log }) {
    if (log.type !== "note") {
        return <EmptyCell />;
    }

    return (
        <NoteComparisonCell
            before={<TagsList tags={log.state_before?.tags} />}
            after={<TagsList tags={log.state_after?.tags} />}
        />
    );
}

function LogDetailsCell({ log }: { log: Log }) {
    if (log.type === "registration") {
        return <span className="text-sm text-muted-foreground">Создание аккаунта</span>;
    }

    if (log.type === "permission") {
        return (
            <span className="text-sm text-muted-foreground">
                {log.before_permission_type || "нет"} -&gt; {log.after_permission_type || "нет"}
            </span>
        );
    }

    const diff = log.diff?.trim();

    return (
        <div className="max-w-[380px] space-y-1">
            <p className="font-mono text-xs text-muted-foreground" title={log.note_key}>
                note: {formatKey(log.note_key)}
            </p>
            {diff ? (
                <pre className="overflow-hidden text-ellipsis whitespace-pre-wrap break-words rounded-md bg-black/5 p-2 font-mono text-xs text-muted-foreground">
                    {diff}
                </pre>
            ) : (
                <p className="text-xs text-muted-foreground">Без diff</p>
            )}
        </div>
    );
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
                <div className="overflow-hidden rounded-md border border-black/10 bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-0 text-sm">
                            <thead>
                                <tr className="bg-black/[0.03] text-left">
                                    <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                        Время
                                    </th>
                                    <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                        Тип
                                    </th>
                                    <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                        Действие
                                    </th>
                                    <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                        ID-участников
                                    </th>
                                    <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                        Описание
                                    </th>
                                    <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                        Название
                                    </th>
                                    <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                        Теги
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.log_key} className="align-top transition-colors hover:bg-black/[0.02]">
                                        <td className="border-b border-black/10 px-4 py-3 text-muted-foreground">
                                            <time dateTime={log.created_at}>{formatDate(log.created_at)}</time>
                                        </td>
                                        <td className="border-b border-black/10 px-4 py-3">
                                            <span className="inline-flex rounded-md border border-black/10 px-2 py-1 text-xs">
                                                {typeLabels[log.type]}
                                            </span>
                                        </td>
                                        <td className="border-b border-black/10 px-4 py-3">
                                            {getActionLabel(log)}
                                        </td>

                                        <td className="border-b border-black/10 px-4 py-3">
                                            <LogActorsCell log={log} />
                                        </td>
                                        <td className="border-b border-black/10 px-4 py-3">
                                            <LogContentCell log={log} />
                                        </td>
                                        <td className="border-b border-black/10 px-4 py-3">
                                            <LogTitleCell log={log} />
                                        </td>
                                        <td className="border-b border-black/10 px-4 py-3">
                                            <LogTagsCell log={log} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
