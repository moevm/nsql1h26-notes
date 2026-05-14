import { useCallback, useEffect, useState } from "react";
import { Check, Clipboard, Link2, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Note } from "@/entities/note/types/dto";
import { shareProxy } from "@/entities/share/api/proxy";
import type { ShareLink, ShareRole } from "@/entities/share/types";
import { getErrorMessage } from "@/shared/api/error";
import { useAccessTokenPayload } from "@/shared/hooks/use-access-token-payload";

type NoteShareModalProps = {
    open: boolean;
    note: Note;
    onClose: () => void;
};

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function getShareUrl(shareKey: string) {
    return `${window.location.origin}/share/${shareKey}`;
}

function getRoleLabel(role: ShareRole) {
    return role === "write" ? "Редактирование" : "Чтение";
}

export function NoteShareModal({ open, note, onClose }: NoteShareModalProps) {
    const currentUser = useAccessTokenPayload();
    const canManageShare = currentUser?.sub === note.user_ref;
    const [links, setLinks] = useState<ShareLink[]>([]);
    const [linksLoading, setLinksLoading] = useState(false);
    const [linksError, setLinksError] = useState<string | null>(null);
    const [role, setRole] = useState<ShareRole>("read");
    const [creating, setCreating] = useState(false);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const loadLinks = useCallback(async () => {
        if (!canManageShare) {
            setLinks([]);
            return;
        }

        setLinksLoading(true);
        setLinksError(null);

        try {
            const response = await shareProxy.getShareLinks(note.note_key);
            setLinks(response.links);
        } catch (err) {
            setLinks([]);
            setLinksError(getErrorMessage(err));
        } finally {
            setLinksLoading(false);
        }
    }, [canManageShare, note.note_key]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setRole("read");
        setCopiedKey(null);
        setActionError(null);
        void loadLinks();
    }, [loadLinks, open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, open]);

    if (!open) {
        return null;
    }

    const createShareLink = async () => {
        setCreating(true);
        setActionError(null);
        setCopiedKey(null);

        try {
            const link = await shareProxy.createShareLink(note.note_key, role);
            setLinks((current) => [link, ...current]);
            await navigator.clipboard.writeText(getShareUrl(link.share_key));
            setCopiedKey(link.share_key);
        } catch (err) {
            setActionError(getErrorMessage(err));
        } finally {
            setCreating(false);
        }
    };

    const copyShareLink = async (shareKey: string) => {
        setActionError(null);

        try {
            await navigator.clipboard.writeText(getShareUrl(shareKey));
            setCopiedKey(shareKey);
        } catch (err) {
            setActionError(getErrorMessage(err));
        }
    };

    const deleteShareLink = async (shareKey: string) => {
        setDeletingKey(shareKey);
        setActionError(null);

        try {
            await shareProxy.deleteShareLink(shareKey);
            setLinks((current) =>
                current.filter((link) => link.share_key !== shareKey),
            );
        } catch (err) {
            setActionError(getErrorMessage(err));
        } finally {
            setDeletingKey(null);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
                onMouseDown={onClose}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="note-share-title"
                    className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-xl"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Link2 className="h-4 w-4" />
                                Доступ к заметке
                            </div>
                            <h2
                                id="note-share-title"
                                className="mt-1 truncate text-lg font-semibold"
                            >
                                {note.title || "Без названия"}
                            </h2>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            aria-label="Закрыть доступ к заметке"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                        {!canManageShare ? (
                            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                Поделиться может только владелец заметки.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                <div className="grid gap-3 rounded-md border border-black/10 bg-black/[0.02] p-4 md:grid-cols-[180px_auto]">
                                    <select
                                        value={role}
                                        onChange={(event) =>
                                            setRole(
                                                event.target.value as ShareRole,
                                            )
                                        }
                                        className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="read">Чтение</option>
                                        <option value="write">
                                            Редактирование
                                        </option>
                                    </select>

                                    <Button
                                        type="button"
                                        onClick={() => void createShareLink()}
                                        disabled={creating}
                                    >
                                        {creating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Link2 className="h-4 w-4" />
                                        )}
                                        Создать ссылку
                                    </Button>
                                </div>

                                {actionError ? (
                                    <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                        {actionError}
                                    </div>
                                ) : null}

                                <div className="grid gap-2">
                                    <h3 className="text-sm font-medium">
                                        Активные ссылки
                                    </h3>
                                    {linksLoading ? (
                                        <div className="rounded-md border border-black/10 bg-white px-4 py-3 text-sm text-muted-foreground">
                                            Загрузка ссылок...
                                        </div>
                                    ) : linksError ? (
                                        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                            {linksError}
                                        </div>
                                    ) : links.length ? (
                                        <div className="space-y-2">
                                            {links.map((link) => (
                                                <div
                                                    key={link.share_key}
                                                    className="grid gap-3 rounded-md border border-black/10 bg-white px-4 py-3 md:grid-cols-[1fr_auto]"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-sm font-medium">
                                                                {getRoleLabel(
                                                                    link.role,
                                                                )}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDate(
                                                                    link.created_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                                                            {getShareUrl(
                                                                link.share_key,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                void copyShareLink(
                                                                    link.share_key,
                                                                )
                                                            }
                                                        >
                                                            {copiedKey ===
                                                            link.share_key ? (
                                                                <Check className="h-4 w-4" />
                                                            ) : (
                                                                <Clipboard className="h-4 w-4" />
                                                            )}
                                                            {copiedKey ===
                                                            link.share_key
                                                                ? "Скопировано"
                                                                : "Копировать"}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                void deleteShareLink(
                                                                    link.share_key,
                                                                )
                                                            }
                                                            disabled={
                                                                deletingKey ===
                                                                link.share_key
                                                            }
                                                        >
                                                            {deletingKey ===
                                                            link.share_key ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-md border border-dashed border-black/15 bg-white px-4 py-8 text-center text-sm text-muted-foreground">
                                            Ссылок пока нет.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end border-t border-black/10 px-5 py-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Закрыть
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
