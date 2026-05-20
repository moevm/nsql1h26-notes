import {
    type FormEvent,
    type KeyboardEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import { ChevronDown, FileText, Loader2, RotateCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { noteProxy } from "@/entities/note/api/proxy";
import type { Note } from "@/entities/note/types/dto";
import { usersProxy } from "@/entities/user/api/users.proxy";
import type { GetUsersResponse } from "@/entities/user/types/responses";
import { getErrorMessage } from "@/shared/api/error";
import { useAccessTokenPayload } from "@/shared/hooks/use-access-token-payload";
import { Header } from "@/shared/layout/Header";
import { isAdminRole } from "@/shared/lib/access-token-payload";
import {
    clearRefreshToken,
    clearStoredAccessToken,
} from "@/shared/lib/token-storage";
import { UserLink } from "@/shared/ui/user-link";
import { formatDate, formatKey } from "@/pages/logs/ui/helpers";
import { LogNotePickerModal } from "@/pages/logs/ui/log-note-picker-modal";
import { LogUserPickerModal } from "@/pages/logs/ui/log-user-picker-modal";
import {
    buildGetNotesRequest,
    countActiveNoteFilters,
    DEFAULT_NOTE_FILTERS,
    type NoteFilters,
} from "@/pages/note/ui/note-filters";

const ADMIN_NOTE_FILTERS: NoteFilters = {
    ...DEFAULT_NOTE_FILTERS,
    limit: 50,
};

type UserSummary = GetUsersResponse[number];

const normalizeFilters = (filters: NoteFilters): NoteFilters => ({
    ...filters,
    user_key: filters.user_key.trim(),
    parent_key: filters.parent_key.trim(),
    linked_note_key: filters.linked_note_key.trim(),
    tag: filters.tag.trim(),
    search: filters.search.trim(),
    created_from: filters.created_from.trim(),
    created_to: filters.created_to.trim(),
    updated_from: filters.updated_from.trim(),
    updated_to: filters.updated_to.trim(),
    limit: Math.min(256, Math.max(1, filters.limit)),
    offset: Math.max(0, filters.offset),
});

export function AdminNotesPage() {
    const navigate = useNavigate();
    const currentUser = useAccessTokenPayload();
    const isAdmin = isAdminRole(currentUser?.role);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<NoteFilters>(ADMIN_NOTE_FILTERS);
    const [filterDraft, setFilterDraft] =
        useState<NoteFilters>(ADMIN_NOTE_FILTERS);
    const [filterNotes, setFilterNotes] = useState<Note[]>([]);
    const [filterNotesLoading, setFilterNotesLoading] = useState(false);
    const [filterNotesError, setFilterNotesError] = useState<string | null>(
        null,
    );
    const [lastPageOffset, setLastPageOffset] = useState<number | null>(null);
    const [limitDraft, setLimitDraft] = useState(
        String(ADMIN_NOTE_FILTERS.limit),
    );
    const [notePickerTarget, setNotePickerTarget] = useState<
        "parent_key" | "linked_note_key" | null
    >(null);
    const [userPickerOpen, setUserPickerOpen] = useState(false);
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);

    useEffect(() => {
        setLimitDraft(String(filters.limit));
    }, [filters.limit]);

    useEffect(() => {
        let alive = true;

        const loadNotes = async () => {
            setLoading(true);
            setError(null);

            try {
                const requestedOffset = filters.offset;
                const response = await noteProxy.getNotes({
                    ...buildGetNotesRequest(filters),
                });

                if (alive) {
                    if (requestedOffset > 0 && response.length === 0) {
                        const fallbackOffset = Math.max(
                            0,
                            requestedOffset - filters.limit,
                        );

                        setLastPageOffset(fallbackOffset);
                        setFilters((current) =>
                            current.offset === requestedOffset
                                ? { ...current, offset: fallbackOffset }
                                : current,
                        );
                        return;
                    }

                    setNotes(response ?? []);
                    setLastPageOffset((current) => {
                        if (response.length < filters.limit) {
                            return requestedOffset;
                        }

                        if (current !== null && requestedOffset <= current) {
                            return current;
                        }

                        return null;
                    });
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
    }, [filters]);

    useEffect(() => {
        if (!notePickerTarget) {
            return;
        }

        let alive = true;

        const loadFilterNotes = async () => {
            setFilterNotesLoading(true);
            setFilterNotesError(null);

            try {
                const response = await noteProxy.getNotes({
                    limit: 256,
                    offset: 0,
                });

                if (alive) {
                    setFilterNotes(response ?? []);
                }
            } catch (err) {
                if (alive) {
                    setFilterNotesError(getErrorMessage(err));
                    setFilterNotes([]);
                }
            } finally {
                if (alive) {
                    setFilterNotesLoading(false);
                }
            }
        };

        void loadFilterNotes();

        return () => {
            alive = false;
        };
    }, [notePickerTarget]);

    useEffect(() => {
        if (!userPickerOpen) {
            return;
        }

        let alive = true;

        const loadUsers = async () => {
            setUsersLoading(true);
            setUsersError(null);

            try {
                const response = await usersProxy.getUsers();

                if (alive) {
                    setUsers(response ?? []);
                }
            } catch (err) {
                if (alive) {
                    setUsersError(getErrorMessage(err));
                    setUsers([]);
                }
            } finally {
                if (alive) {
                    setUsersLoading(false);
                }
            }
        };

        void loadUsers();

        return () => {
            alive = false;
        };
    }, [userPickerOpen]);

    const currentPage = useMemo(
        () => Math.floor(filters.offset / filters.limit) + 1,
        [filters.limit, filters.offset],
    );
    const hasNextPage =
        lastPageOffset !== null
            ? filters.offset < lastPageOffset
            : notes.length === filters.limit;
    const pageNumbers = useMemo(() => {
        const pages = new Set<number>([1, currentPage]);

        if (currentPage > 1) {
            pages.add(currentPage - 1);
        }

        if (currentPage > 2) {
            pages.add(currentPage - 2);
        }

        if (hasNextPage) {
            pages.add(currentPage + 1);
        }

        return Array.from(pages).sort((left, right) => left - right);
    }, [currentPage, hasNextPage]);
    const activeFiltersCount = useMemo(
        () => countActiveNoteFilters(filters),
        [filters],
    );
    const noteMap = useMemo(
        () => new Map(filterNotes.map((note) => [note.note_key, note])),
        [filterNotes],
    );
    const userMap = useMemo(
        () => new Map(users.map((user) => [user.user_key, user])),
        [users],
    );
    const selectedParent =
        filterDraft.parent_key && filterDraft.parent_key !== "root"
            ? noteMap.get(filterDraft.parent_key)
            : null;
    const selectedLinkedNote = filterDraft.linked_note_key
        ? noteMap.get(filterDraft.linked_note_key)
        : null;
    const parentLabel = !filterDraft.parent_key
        ? "Не выбран"
        : filterDraft.parent_key === "root"
          ? "Корневые заметки"
          : selectedParent?.title || formatKey(filterDraft.parent_key);
    const linkedNoteLabel = !filterDraft.linked_note_key
        ? "Не выбрана"
        : selectedLinkedNote?.title || formatKey(filterDraft.linked_note_key);
    const userLabel = !filterDraft.user_key
        ? "Все пользователи"
        : userMap.get(filterDraft.user_key)?.username ||
          formatKey(filterDraft.user_key);

    const logout = () => {
        clearStoredAccessToken();
        clearRefreshToken();
        navigate("/auth/signin", { replace: true });
    };

    const updateFilterDraft = <Key extends keyof NoteFilters>(
        field: Key,
        value: NoteFilters[Key],
    ) => {
        setFilterDraft((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const applyFilters = (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        const normalized = normalizeFilters({
            ...filterDraft,
            offset: 0,
        });
        setLastPageOffset(null);
        setFilterDraft(normalized);
        setFilters(normalized);
    };

    const resetFilters = () => {
        setLastPageOffset(null);
        setFilterDraft(ADMIN_NOTE_FILTERS);
        setFilters(ADMIN_NOTE_FILTERS);
    };

    const previousPage = () => {
        setFilters((current) => ({
            ...current,
            offset: Math.max(0, current.offset - current.limit),
        }));
    };

    const nextPage = () => {
        setFilters((current) => ({
            ...current,
            offset: current.offset + current.limit,
        }));
    };

    const goToPage = (page: number) => {
        setFilters((current) => ({
            ...current,
            offset:
                lastPageOffset !== null &&
                (page - 1) * current.limit > lastPageOffset
                    ? current.offset
                    : (page - 1) * current.limit,
        }));
    };

    const updateLimit = (limit: number) => {
        const nextLimit = Math.max(1, Math.floor(limit));

        setLastPageOffset(null);
        setFilterDraft((current) => ({
            ...current,
            limit: nextLimit,
            offset: 0,
        }));
        setFilters((current) => ({
            ...current,
            limit: nextLimit,
            offset: 0,
        }));
    };

    const commitLimit = () => {
        const nextLimit = Number.parseInt(limitDraft, 10);

        if (!Number.isFinite(nextLimit) || nextLimit < 1) {
            setLimitDraft(String(filters.limit));
            return;
        }

        if (nextLimit !== filters.limit) {
            updateLimit(nextLimit);
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
                            {notes.length}, активных фильтров:{" "}
                            {activeFiltersCount}
                        </p>
                    </div>
                </div>

                <form
                    className="mb-5 grid gap-3 rounded-md border border-black/10 bg-white p-4 md:grid-cols-4"
                    onSubmit={applyFilters}
                >
                    <label className="grid gap-1.5 text-sm">
                        <span className="text-muted-foreground">search</span>
                        <Input
                            value={filterDraft.search}
                            onChange={(event) =>
                                updateFilterDraft("search", event.target.value)
                            }
                            placeholder="Название или текст"
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="text-muted-foreground">tag</span>
                        <Input
                            value={filterDraft.tag}
                            onChange={(event) =>
                                updateFilterDraft("tag", event.target.value)
                            }
                            placeholder="Тег"
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm md:col-span-2">
                        <span className="text-muted-foreground">
                            parent_key
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="min-w-0 flex-1 justify-between px-3 font-normal"
                                onClick={() =>
                                    setNotePickerTarget("parent_key")
                                }
                            >
                                <span className="truncate">{parentLabel}</span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    filterDraft.parent_key === "root"
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() =>
                                    updateFilterDraft("parent_key", "root")
                                }
                            >
                                Корневые
                            </Button>
                        </div>
                    </label>

                    <label className="grid gap-1.5 text-sm md:col-span-2">
                        <span className="text-muted-foreground">
                            linked_note_key
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            className="justify-between px-3 font-normal"
                            onClick={() =>
                                setNotePickerTarget("linked_note_key")
                            }
                        >
                            <span className="truncate">{linkedNoteLabel}</span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </label>

                    {isAdmin ? (
                        <label className="grid gap-1.5 text-sm md:col-span-2">
                            <span className="text-muted-foreground">
                                Пользователь
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                className="justify-between px-3 font-normal"
                                onClick={() => setUserPickerOpen(true)}
                            >
                                <span className="truncate">{userLabel}</span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </label>
                    ) : null}

                    <label className="grid gap-1.5 text-sm">
                        <span className="text-muted-foreground">
                            created_from
                        </span>
                        <Input
                            type="datetime-local"
                            value={filterDraft.created_from}
                            onChange={(event) =>
                                updateFilterDraft(
                                    "created_from",
                                    event.target.value,
                                )
                            }
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="text-muted-foreground">
                            created_to
                        </span>
                        <Input
                            type="datetime-local"
                            value={filterDraft.created_to}
                            onChange={(event) =>
                                updateFilterDraft(
                                    "created_to",
                                    event.target.value,
                                )
                            }
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="text-muted-foreground">
                            updated_from
                        </span>
                        <Input
                            type="datetime-local"
                            value={filterDraft.updated_from}
                            onChange={(event) =>
                                updateFilterDraft(
                                    "updated_from",
                                    event.target.value,
                                )
                            }
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="text-muted-foreground">
                            updated_to
                        </span>
                        <Input
                            type="datetime-local"
                            value={filterDraft.updated_to}
                            onChange={(event) =>
                                updateFilterDraft(
                                    "updated_to",
                                    event.target.value,
                                )
                            }
                        />
                    </label>

                    <div className="flex flex-wrap items-end gap-2 md:col-span-4">
                        <Button type="submit">Применить фильтр</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetFilters}
                        >
                            <RotateCcw className="h-4 w-4" />
                            Сбросить
                        </Button>
                    </div>
                </form>

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
                                                        {note.tags.map(
                                                            (tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="rounded-sm border border-black/10 px-1.5 py-0.5 text-xs"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ),
                                                        )}
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

                {notes.length ? (
                    <div className="mt-6 border-t border-black/10 pt-6">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={loading || filters.offset === 0}
                                onClick={previousPage}
                            >
                                Назад
                            </Button>

                            {pageNumbers.map((page) => (
                                <Button
                                    key={page}
                                    type="button"
                                    variant={
                                        page === currentPage
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    disabled={loading}
                                    onClick={() => goToPage(page)}
                                    className="min-w-10"
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={loading || !hasNextPage}
                                onClick={nextPage}
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
                                onChange={(event) =>
                                    setLimitDraft(event.target.value)
                                }
                                onBlur={commitLimit}
                                onKeyDown={handleLimitKeyDown}
                                className="w-24 text-center"
                            />
                        </div>
                    </div>
                ) : null}
            </main>

            <LogNotePickerModal
                open={notePickerTarget !== null}
                notes={filterNotes}
                loading={filterNotesLoading}
                error={filterNotesError}
                selectedNoteKey={
                    notePickerTarget ? filterDraft[notePickerTarget] : ""
                }
                onSelect={(noteKey) => {
                    if (notePickerTarget) {
                        updateFilterDraft(notePickerTarget, noteKey);
                    }
                    setNotePickerTarget(null);
                }}
                onClear={() => {
                    if (notePickerTarget) {
                        updateFilterDraft(notePickerTarget, "");
                    }
                    setNotePickerTarget(null);
                }}
                onClose={() => setNotePickerTarget(null)}
            />

            <LogUserPickerModal
                open={userPickerOpen}
                title="Выбор пользователя"
                users={users}
                loading={usersLoading}
                error={usersError}
                selectedUserKey={filterDraft.user_key}
                onSelect={(userKey) => {
                    updateFilterDraft("user_key", userKey);
                    setUserPickerOpen(false);
                }}
                onClear={() => {
                    updateFilterDraft("user_key", "");
                    setUserPickerOpen(false);
                }}
                onClose={() => setUserPickerOpen(false)}
            />
        </div>
    );
}
