import type { MouseEvent } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteTreeBranch, type NoteTreeNode } from "@/pages/note/ui/note-tree";

interface NoteSidebarProps {
    notesCount: number;
    tree: NoteTreeNode[];
    activeNoteKey: string | null;
    search: string;
    loading: boolean;
    error: string | null;
    activeFiltersCount: number;
    onSearchChange: (value: string) => void;
    onCreateNote: () => void;
    onOpenFilters: () => void;
    onOpenNote: (noteKey: string) => void;
    onContextMenu: (
        event: MouseEvent<HTMLButtonElement>,
        node: NoteTreeNode,
    ) => void;
}

export function NoteSidebar({
    notesCount,
    tree,
    activeNoteKey,
    search,
    loading,
    error,
    activeFiltersCount,
    onSearchChange,
    onCreateNote,
    onOpenFilters,
    onOpenNote,
    onContextMenu,
}: NoteSidebarProps) {
    return (
        <aside className="flex w-[380px] shrink-0 flex-col bg-white">
            <div className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            Заметки
                        </p>
                        <h1 className="truncate text-lg font-semibold">
                            Структура
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {notesCount}{" "}
                            {notesCount === 1 ? "заметка" : "заметок"}
                        </p>
                    </div>

                    <Button size="sm" variant="outline" onClick={onCreateNote}>
                        <Plus className="h-4 w-4" />
                        Новая
                    </Button>
                </div>

                <div className="mt-4 flex gap-2">
                    <label className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                onSearchChange(event.target.value)
                            }
                            placeholder="Поиск по названию"
                            className="pl-9"
                        />
                    </label>

                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="relative"
                        onClick={onOpenFilters}
                        aria-label="Открыть фильтры заметок"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        {activeFiltersCount > 0 ? (
                            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] text-primary-foreground">
                                {activeFiltersCount}
                            </span>
                        ) : null}
                    </Button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {loading && !notesCount ? (
                    <div className="space-y-2">
                        <div className="h-9 animate-pulse rounded-md bg-muted" />
                        <div className="ml-4 h-9 animate-pulse rounded-md bg-muted/80" />
                        <div className="ml-8 h-9 animate-pulse rounded-md bg-muted/70" />
                    </div>
                ) : error ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                        {error}
                    </div>
                ) : tree.length ? (
                    <NoteTreeBranch
                        nodes={tree}
                        activeNoteKey={activeNoteKey}
                        onOpenNote={onOpenNote}
                        onContextMenu={onContextMenu}
                    />
                ) : (
                    <div className="rounded-md border border-dashed border-black/10 p-4 text-sm text-muted-foreground">
                        Ничего не найдено
                    </div>
                )}
            </div>
        </aside>
    );
}
