import { ClipboardList, KeyRound, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import type { Log, NoteLog, NoteState, PermissionLog, RegistrationLog } from "@/entities/logs/types/responses";
import { cn } from "@/lib/utils";
import { typeLabels } from "@/pages/logs/ui/constants";
import { formatDate, formatKey, getActionLabel, getLogTitle } from "@/pages/logs/ui/helpers";
import { useAccessTokenPayload } from "@/shared/hooks/use-access-token-payload";
import { isAdminRole } from "@/shared/lib/access-token-payload";
import { UserLink } from "@/shared/ui/user-link";
import { noteProxy } from "@/entities/note/api/proxy";

const typeMeta = {
    note: {
        icon: ClipboardList,
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    permission: {
        icon: KeyRound,
        className: "border-amber-200 bg-amber-50 text-amber-900",
    },
    registration: {
        icon: UserPlus,
        className: "border-sky-200 bg-sky-50 text-sky-900",
    },
};

function NoteKeyLink({
    noteKey,
    label,
}: {
    noteKey: string;
    label: string;
}) {
    const [noteExists, setNoteExists] = useState<boolean | null>(null);

    useEffect(() => {
        let alive = true;

        const checkNote = async () => {
            const note = await noteProxy.getNoteByKey(noteKey);
            if (!alive) {
                return;
            }
            setNoteExists(Boolean(note));
        };

        void checkNote();

        return () => {
            alive = false;
        };
    }, [noteKey]);

    if (noteExists === false) {
        return (
            <span className="font-medium text-muted-foreground" title={noteKey}>
                {label} (удалена)
            </span>
        );
    }

    if (noteExists === null) {
        return (
            <span className="font-medium text-muted-foreground" title={noteKey}>
                {label}
            </span>
        );
    }

    return (
        <Link
            to={`/notes/${noteKey}`}
            className="font-medium underline decoration-black/20 underline-offset-4 hover:decoration-black/60"
            title={noteKey}
        >
            {label}
        </Link>
    );
}

function Tags({ tags, interactive }: { tags: string[]; interactive: boolean }) {
    if (!tags.length) {
        return <span className="text-muted-foreground">нет тегов</span>;
    }

    const currentUser = useAccessTokenPayload();
    const isAdmin = isAdminRole(currentUser?.role);

    return (
        <span className="inline-flex flex-wrap gap-1">
            {tags.map((tag) =>
                interactive ? (
                    <Link
                        key={tag}
                        to={
                            isAdmin
                                ? `/admin/notes?tag=${encodeURIComponent(tag)}`
                                : `/notes/new?tag=${encodeURIComponent(tag)}`
                        }
                        className="rounded-sm border border-black/10 px-1.5 py-0.5 text-xs underline decoration-black/20 underline-offset-2 hover:bg-black/[0.03]"
                    >
                        {tag}
                    </Link>
                ) : (
                    <span
                        key={tag}
                        className="rounded-sm border border-black/10 px-1.5 py-0.5 text-xs"
                    >
                        {tag}
                    </span>
                ),
            )}
        </span>
    );
}

function NoteSnapshot({
    title,
    state,
    interactive,
}: {
    title: string;
    state: NoteState;
    interactive: boolean;
}) {
    return (
        <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-sm font-medium">{state.title || "Без названия"}</p>
            <p className="mt-1 max-h-24 overflow-hidden text-sm text-muted-foreground">
                {state.content || "Пустое содержимое"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
                Теги: <Tags tags={state.tags} interactive={interactive} />
            </p>
        </div>
    );
}

function KeyValue({
    label,
    value,
    title,
}: {
    label: string;
    value: string;
    title?: string;
}) {
    return (
        <div className="min-w-0 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 truncate font-mono text-sm" title={title ?? value}>
                {value}
            </p>
        </div>
    );
}

function RegistrationDetails({ log }: { log: RegistrationLog }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                    Пользователь
                </p>
                <p className="mt-1 truncate font-mono text-sm">
                    <UserLink userKey={log.user_key} username={log.username} />
                </p>
            </div>
            <KeyValue label="Действие" value={getActionLabel(log)} />
        </div>
    );
}

function PermissionDetails({
    log,
    interactive,
}: {
    log: PermissionLog;
    interactive: boolean;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {interactive ? (
                <div className="min-w-0 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                        Заметка
                    </p>
                    <p className="mt-1 truncate text-sm">
                        <NoteKeyLink
                            noteKey={log.note_key}
                            label={formatKey(log.note_key)}
                        />
                    </p>
                </div>
            ) : (
                <KeyValue
                    label="Заметка"
                    value={formatKey(log.note_key)}
                    title={log.note_key}
                />
            )}
            <div className="min-w-0 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                    Кто выдал
                </p>
                <p className="mt-1 truncate font-mono text-sm">
                    <UserLink
                        userKey={log.granted_by_key}
                        username={log.granted_by_username}
                    />
                </p>
            </div>
            <div className="min-w-0 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                    Кому выдали
                </p>
                <p className="mt-1 truncate font-mono text-sm">
                    <UserLink
                        userKey={log.granted_to_key}
                        username={log.granted_to_username}
                    />
                </p>
            </div>
            <KeyValue
                label="Права"
                value={`${log.before_permission_type || "нет"} -> ${log.after_permission_type || "нет"}`}
            />
        </div>
    );
}

function NoteDetails({
    log,
    interactive,
}: {
    log: NoteLog;
    interactive: boolean;
}) {
    return (
        <>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                        Пользователь
                    </p>
                    <p className="mt-1 truncate font-mono text-sm">
                        <UserLink
                            userKey={log.user_key}
                            username={log.username}
                        />
                    </p>
                </div>
                {interactive ? (
                    <div className="min-w-0 border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground">
                            Заметка
                        </p>
                        <p className="mt-1 truncate text-sm">
                            <NoteKeyLink
                                noteKey={log.note_key}
                                label={formatKey(log.note_key)}
                            />
                        </p>
                    </div>
                ) : (
                    <KeyValue
                        label="Заметка"
                        value={formatKey(log.note_key)}
                        title={log.note_key}
                    />
                )}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <NoteSnapshot
                    title="До изменения"
                    state={log.state_before}
                    interactive={interactive}
                />
                <NoteSnapshot
                    title="После изменения"
                    state={log.state_after}
                    interactive={interactive}
                />
            </div>

            {log.diff ? (
                <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-neutral-950 p-3 text-xs text-white">
                    {log.diff}
                </pre>
            ) : null}
        </>
    );
}

export function LogCard({
    log,
    interactive = false,
}: {
    log: Log;
    interactive?: boolean;
}) {
    const meta = typeMeta[log.type];
    const Icon = meta.icon;

    return (
        <article className="rounded-md border border-black/10 bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs", meta.className)}>
                            <Icon className="h-3.5 w-3.5" />
                            {typeLabels[log.type]}
                        </span>
                        <span className="rounded-md border border-black/10 px-2 py-1 text-xs text-muted-foreground">
                            {getActionLabel(log)}
                        </span>
                    </div>
                    <h2 className="mt-3 break-words text-lg font-semibold">{getLogTitle(log)}</h2>
                </div>
                <time className="shrink-0 text-sm text-muted-foreground">{formatDate(log.created_at)}</time>
            </div>

            <div className="mt-4">
                {log.type === "registration" ? <RegistrationDetails log={log} /> : null}
                {log.type === "permission" ? (
                    <PermissionDetails log={log} interactive={interactive} />
                ) : null}
                {log.type === "note" ? (
                    <NoteDetails log={log} interactive={interactive} />
                ) : null}
            </div>
        </article>
    );
}
