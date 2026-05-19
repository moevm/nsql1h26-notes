import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { noteProxy } from "@/entities/note/api/proxy";
import type { Note } from "@/entities/note/types/dto";
import { getErrorMessage } from "@/shared/api/error";
import { useAccessTokenPayload } from "@/shared/hooks/use-access-token-payload";
import { Header } from "@/shared/layout/Header";
import { isAdminRole } from "@/shared/lib/access-token-payload";
import { clearRefreshToken, clearStoredAccessToken } from "@/shared/lib/token-storage";
import { UserLink } from "@/shared/ui/user-link";
import { formatDate, formatKey } from "@/pages/logs/ui/helpers";

export function AdminNotesPage() {
    const navigate = useNavigate();
    const currentUser = useAccessTokenPayload();
    const isAdmin = isAdminRole(currentUser?.role);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [limit, setLimit] = useState(50);
    const [offset, setOffset] = useState(0);
    const [limitDraft, setLimitDraft] = useState("50");

    useEffect(() => {
        setLimitDraft(String(limit));
    }, [limit]);

    useEffect(() => {
        let alive = true;

        const loadNotes = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await noteProxy.getNotes({
                    limit,
                    offset,
                    search: appliedSearch.trim() || undefined,
                });

                if (alive) {
                    setNotes(response ?? []);
                }
            } catch (err) {
                if (alive) {
                    setError(getErrorMessage(err));
                    setNotes([]);
                }
            } finally {
                if (alive) {
                    setLoading(false);
                }
            }
        };

        void loadNotes();

        return () => {
            alive = false;
        };
    }, [appliedSearch, limit, offset]);

    const currentPage = useMemo(
        () => Math.floor(offset / limit) + 1,
        [limit, offset],
    );
    const hasNextPage = notes.length === limit;

    const logout = () => {
        clearStoredAccessToken();
        clearRefreshToken();
        navigate("/auth/signin", { replace: true });
    };

    const applySearch = () => {
        setAppliedSearch(search);
        setOffset(0);
    };

    const commitLimit = () => {
        const nextLimit = Number.parseInt(limitDraft, 10);

        if (!Number.isFinite(nextLimit) || nextLimit < 1) {
            setLimitDraft(String(limit));
            return;
        }

        setLimit(nextLimit);
        setOffset(0);
    };

    const handleLimitKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            commitLimit();
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#fafafa] text-foreground">
            <Header
                title="Админ-панель / Заметки"
                buttons={[
                    {
                        title: "Логи",
                        onClick: () => navigate("/admin/logs"),
                        variant: "outline",
                    },
                    {
                        title: "Пользователи",
                        onClick: () => navigate("/admin/users"),
                        variant: "outline",
                    },
                    {
                        title: "Моя страница",
                        onClick: () => navigate("/logs/my"),
                        variant: "secondary",
                    },
                    {
                        title: "Выйти",
                        onClick: logout,
                        variant: "outline",
                        className:
                            "border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600",
                    },
                ]}
            />

            <main className="mx-auto w-full max-w-7xl px-6 py-6">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Заметки</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Страница {currentPage}, найдено в выдаче:{" "}
                            {notes.length}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    applySearch();
                                }
                            }}
                            placeholder="Поиск по заметкам"
                            className="w-64"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={applySearch}
                        >
                            Найти
                        </Button>
                    </div>
                </div>

                {!isAdmin && currentUser ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                        Доступ запрещён
                    </div>
                ) : loading && !notes.length ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-black/10 bg-white p-8 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка заметок...
                    </div>
                ) : error ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                        {error}
                    </div>
                ) : notes.length ? (
                    <div className="overflow-hidden rounded-md border border-black/10 bg-white">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0 text-sm">
                                <thead>
                                    <tr className="bg-black/[0.03] text-left">
                                        <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                            Заметка
                                        </th>
                                        <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                            Автор
                                        </th>
                                        <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                            Теги
                                        </th>
                                        <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                            Создана
                                        </th>
                                        <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                            Изменена
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notes.map((note) => (
                                        <tr
                                            key={note.note_key}
                                            className="align-top transition-colors hover:bg-black/[0.02]"
                                        >
                                            <td className="border-b border-black/10 px-4 py-3">
                                                <Link
                                                    to={`/notes/${note.note_key}`}
                                                    className="font-medium underline decoration-black/20 underline-offset-4 hover:decoration-black/60"
                                                >
                                                    {note.title ||
                                                        "Без названия"}
                                                </Link>
                                                <p
                                                    className="mt-1 font-mono text-xs text-muted-foreground"
                                                    title={note.note_key}
                                                >
                                                    note:{" "}
                                                    {formatKey(note.note_key)}
                                                </p>
                                            </td>
                                            <td className="border-b border-black/10 px-4 py-3">
                                                <UserLink
                                                    userKey={note.user_ref}
                                                    username={note.username}
                                                />
                                            </td>
                                            <td className="border-b border-black/10 px-4 py-3">
                                                {note.tags.length ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {note.tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="rounded-sm border border-black/10 px-1.5 py-0.5 text-xs"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        нет тегов
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border-b border-black/10 px-4 py-3 text-muted-foreground">
                                                {formatDate(note.created_at)}
                                            </td>
                                            <td className="border-b border-black/10 px-4 py-3 text-muted-foreground">
                                                {formatDate(note.updated_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed border-black/15 bg-white p-8 text-center">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                        <h2 className="mt-4 text-lg font-semibold">
                            Заметки не найдены
                        </h2>
                    </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-black/10 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading || offset === 0}
                        onClick={() => setOffset((current) => Math.max(0, current - limit))}
                    >
                        Назад
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading || !hasNextPage}
                        onClick={() => setOffset((current) => current + limit)}
                    >
                        Дальше
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Записей
                    </span>
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
            </main>
        </div>
    );
}
