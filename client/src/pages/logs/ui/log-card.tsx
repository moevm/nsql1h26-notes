import { ClipboardList, KeyRound, UserPlus } from "lucide-react";

import type { Log, NoteLog, NoteState, PermissionLog, RegistrationLog } from "@/entities/logs/types/responses";
import { cn } from "@/lib/utils";
import { typeLabels } from "@/pages/logs/ui/constants";
import { formatDate, formatKey, getActionLabel, getLogTitle } from "@/pages/logs/ui/helpers";

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

function Tags({ tags }: { tags: string[] }) {
    if (!tags.length) {
        return <span className="text-muted-foreground">нет тегов</span>;
    }

    return (
        <span className="inline-flex flex-wrap gap-1">
            {tags.map((tag) => (
                <span key={tag} className="rounded-sm border border-black/10 px-1.5 py-0.5 text-xs">
                    {tag}
                </span>
            ))}
        </span>
    );
}

function NoteSnapshot({ title, state }: { title: string; state: NoteState }) {
    return (
        <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-sm font-medium">{state.title || "Без названия"}</p>
            <p className="mt-1 max-h-24 overflow-hidden text-sm text-muted-foreground">
                {state.content || "Пустое содержимое"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
                Теги: <Tags tags={state.tags} />
            </p>
        </div>
    );
}

function KeyValue({ label, value, title }: { label: string; value: string; title?: string }) {
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
            <KeyValue label="Пользователь" value={formatKey(log.user_key)} title={log.user_key} />
            <KeyValue label="Действие" value={getActionLabel(log)} />
        </div>
    );
}

function PermissionDetails({ log }: { log: PermissionLog }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KeyValue label="Заметка" value={formatKey(log.note_key)} title={log.note_key} />
            <KeyValue label="Кто выдал" value={formatKey(log.granted_by_key)} title={log.granted_by_key} />
            <KeyValue label="Кому выдали" value={formatKey(log.granted_to_key)} title={log.granted_to_key} />
            <KeyValue
                label="Права"
                value={`${log.before_permission_type || "нет"} -> ${log.after_permission_type || "нет"}`}
            />
        </div>
    );
}

function NoteDetails({ log }: { log: NoteLog }) {
    return (
        <>
            <div className="grid gap-3 sm:grid-cols-2">
                <KeyValue label="Пользователь" value={formatKey(log.user_key)} title={log.user_key} />
                <KeyValue label="Заметка" value={formatKey(log.note_key)} title={log.note_key} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <NoteSnapshot title="До изменения" state={log.state_before} />
                <NoteSnapshot title="После изменения" state={log.state_after} />
            </div>

            {log.diff ? (
                <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-neutral-950 p-3 text-xs text-white">
                    {log.diff}
                </pre>
            ) : null}
        </>
    );
}

export function LogCard({ log }: { log: Log }) {
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
                {log.type === "permission" ? <PermissionDetails log={log} /> : null}
                {log.type === "note" ? <NoteDetails log={log} /> : null}
            </div>
        </article>
    );
}
