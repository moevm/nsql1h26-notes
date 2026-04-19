import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type MouseEvent,
} from "react";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { noteProxy } from "@/entities/note/api/proxy";
import type { Note } from "@/entities/note/types/dto";
import { useGetNotes } from "@/features/note/hooks/use-get-notes";
import { NoteContextMenu } from "@/pages/note/ui/note-context-menu";
import {
    buildGetNotesRequest,
    countActiveNoteFilters,
    DEFAULT_NOTE_FILTERS,
    type NoteFilters,
} from "@/pages/note/ui/note-filters";
import { NoteFiltersModal } from "@/pages/note/ui/note-filters-modal";
import { NoteLayoutProvider } from "@/pages/note/ui/note-layout-context";
import { NoteSidebar } from "@/pages/note/ui/note-sidebar";
import {
    buildNoteTree,
    findNoteByKey,
    type NoteTreeNode,
} from "@/pages/note/ui/note-tree";
import { useAccessTokenPayload } from "@/shared/hooks/use-access-token-payload";
import { isAdminRole } from "@/shared/lib/access-token-payload";
import { Header } from "@/shared/layout/Header";

const normalizeFilters = (filters: NoteFilters): NoteFilters => ({
    ...filters,
    parent_key: filters.parent_key.trim(),
    tag: filters.tag.trim(),
    search: filters.search.trim(),
    created_from: filters.created_from.trim(),
    updated_from: filters.updated_from.trim(),
    created_to: filters.created_to.trim(),
    updated_to: filters.updated_to.trim(),
    limit: Math.max(1, filters.limit),
    offset: Math.max(0, filters.offset),
});

export const NotePageLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = useAccessTokenPayload();
    const isAdmin = isAdminRole(currentUser?.role);
    const { getNotes, loading, error } = useGetNotes();
    const [notes, setNotes] = useState<Note[]>([]);
    const [filters, setFilters] = useState<NoteFilters>(DEFAULT_NOTE_FILTERS);
    const [debouncedSearch, setDebouncedSearch] = useState(
        DEFAULT_NOTE_FILTERS.search,
    );
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [reloadIndex, setReloadIndex] = useState(0);
    const [contextMenu, setContextMenu] = useState<{
        node: NoteTreeNode;
        top: number;
        left: number;
    } | null>(null);

    const refreshNotes = useCallback(() => {
        setReloadIndex((current) => current + 1);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(filters.search.trim());
        }, 250);

        return () => window.clearTimeout(timer);
    }, [filters.search]);

    const noteRequest = useMemo(
        () =>
            buildGetNotesRequest({
                parent_key: filters.parent_key,
                tag: filters.tag,
                search: debouncedSearch,
                created_from: filters.created_from,
                updated_from: filters.updated_from,
                created_to: filters.created_to,
                updated_to: filters.updated_to,
                limit: filters.limit,
                offset: filters.offset,
            }),
        [
            debouncedSearch,
            filters.created_from,
            filters.created_to,
            filters.limit,
            filters.offset,
            filters.parent_key,
            filters.tag,
            filters.updated_from,
            filters.updated_to,
        ],
    );

    useEffect(() => {
        let alive = true;

        const loadNotes = async () => {
            const result = await getNotes(noteRequest);

            if (!alive || !result) {
                return;
            }

            setNotes(result);
        };

        void loadNotes();

        return () => {
            alive = false;
        };
    }, [getNotes, noteRequest, reloadIndex]);

    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        };

        window.addEventListener("click", closeMenu);
        window.addEventListener("scroll", closeMenu, true);
        window.addEventListener("resize", closeMenu);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("click", closeMenu);
            window.removeEventListener("scroll", closeMenu, true);
            window.removeEventListener("resize", closeMenu);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const tree = useMemo(() => buildNoteTree(notes), [notes]);
    const activeFiltersCount = useMemo(
        () => countActiveNoteFilters(filters),
        [filters],
    );

    const activeNoteKey = useMemo(() => {
        const match = matchPath("/notes/:noteKey", location.pathname);
        return match?.params.noteKey ?? null;
    }, [location.pathname]);

    const activeNode = useMemo(() => {
        if (!activeNoteKey) {
            return null;
        }

        return findNoteByKey(tree, activeNoteKey);
    }, [activeNoteKey, tree]);

    const openNote = (noteKey: string) => {
        navigate(`/notes/${noteKey}`);
    };

    const updateSearch = (search: string) => {
        setFilters((current) => ({ ...current, search, offset: 0 }));
    };

    const applyFilters = (nextFilters: NoteFilters) => {
        setFilters(normalizeFilters(nextFilters));
        setFiltersOpen(false);
    };

    const resetFilters = () => {
        setFilters(DEFAULT_NOTE_FILTERS);
    };

    const openContextMenu = (
        event: MouseEvent<HTMLButtonElement>,
        node: NoteTreeNode,
    ) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        setContextMenu({
            node,
            top: rect.bottom + 6,
            left: rect.left,
        });
    };

    const createChild = () => {
        if (!contextMenu) {
            return;
        }

        navigate(
            `/notes/new?parent_key=${encodeURIComponent(contextMenu.node.note_key)}`,
        );
        setContextMenu(null);
    };

    const deleteNode = async () => {
        if (!contextMenu) {
            return;
        }

        const target = contextMenu.node;
        const ok = await noteProxy.deleteNote(target.note_key);

        if (!ok) {
            return;
        }

        refreshNotes();
        setContextMenu(null);

        if (activeNoteKey === target.note_key) {
            navigate(
                target.parent_key
                    ? `/notes/${target.parent_key}`
                    : "/notes/new",
                {
                    replace: true,
                },
            );
        }
    };

    return (
        <NoteLayoutProvider value={{ refreshNotes }}>
            <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa] text-foreground">
                <Header
                    title={
                        activeNode?.title
                            ? `Заметки / ${activeNode.title}`
                            : "Заметки"
                    }
                    buttons={[
                        {
                            title: "Моя страница",
                            onClick: () => navigate("/logs/my"),
                            variant: "secondary",
                        },
                        ...(isAdmin
                            ? [
                                  {
                                      title: "Админ-панель",
                                      onClick: () => navigate("/admin/logs"),
                                      variant: "outline" as const,
                                  },
                              ]
                            : []),
                        {
                            title: "Новая заметка",
                            onClick: () => navigate("/notes/new"),
                            variant: "outline",
                        },
                    ]}
                />

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <NoteSidebar
                        notesCount={notes.length}
                        tree={tree}
                        activeNoteKey={activeNoteKey}
                        search={filters.search}
                        loading={loading}
                        error={error}
                        activeFiltersCount={activeFiltersCount}
                        onSearchChange={updateSearch}
                        onCreateNote={() => navigate("/notes/new")}
                        onOpenFilters={() => setFiltersOpen(true)}
                        onOpenNote={openNote}
                        onContextMenu={openContextMenu}
                    />

                    <main className="min-w-0 flex-1 overflow-hidden">
                        <Outlet />
                    </main>
                </div>

                <NoteContextMenu
                    menu={contextMenu}
                    onCreateChild={createChild}
                    onDelete={deleteNode}
                />

                <NoteFiltersModal
                    open={filtersOpen}
                    filters={filters}
                    onApply={applyFilters}
                    onReset={resetFilters}
                    onClose={() => setFiltersOpen(false)}
                />

                {loading && notes.length ? (
                    <div className="pointer-events-none fixed bottom-4 left-[400px] flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-xs text-muted-foreground shadow-sm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Обновление...
                    </div>
                ) : null}
            </div>
        </NoteLayoutProvider>
    );
};
