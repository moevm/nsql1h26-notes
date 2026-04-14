import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FileText, Folder, Loader2, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/shared/layout/Header";
import { useGetNotes } from "@/features/note/hooks/use-get-notes";
import { noteProxy } from "@/entities/note/api/proxy";
import type { Note } from "@/entities/note/types/dto";
import { cn } from "@/lib/utils";
import { NoteLayoutProvider } from "@/pages/note/ui/note-layout-context";

type NoteTreeNode = Note & {
  children: NoteTreeNode[];
};

function sortNodes(nodes: NoteTreeNode[]) {
  nodes.sort((left, right) => left.title.localeCompare(right.title, "ru"));
  nodes.forEach((node) => sortNodes(node.children));
  return nodes;
}

function buildNoteTree(notes: Note[]) {
  const nodes = new Map<string, NoteTreeNode>();
  const roots: NoteTreeNode[] = [];

  for (const note of notes) {
    nodes.set(note.note_key, { ...note, children: [] });
  }

  for (const note of notes) {
    const current = nodes.get(note.note_key);

    if (!current) {
      continue;
    }

    const parent = note.parent_key ? nodes.get(note.parent_key) : null;

    if (parent) {
      parent.children.push(current);
    } else {
      roots.push(current);
    }
  }

  return sortNodes(roots);
}

function findNoteByKey(nodes: NoteTreeNode[], noteKey: string): NoteTreeNode | null {
  for (const node of nodes) {
    if (node.note_key === noteKey) {
      return node;
    }

    const child = findNoteByKey(node.children, noteKey);
    if (child) {
      return child;
    }
  }

  return null;
}

interface NoteTreeProps {
  nodes: NoteTreeNode[];
  activeNoteKey: string | null;
  onOpenNote: (noteKey: string) => void;
  onContextMenu: (event: MouseEvent<HTMLButtonElement>, node: NoteTreeNode) => void;
}

function NoteTreeBranch({ nodes, activeNoteKey, onOpenNote, onContextMenu }: NoteTreeProps) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const isActive = activeNoteKey === node.note_key;
        const hasChildren = node.children.length > 0;

        return (
          <div key={node.note_key} className="group">
            <button
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onOpenNote(node.note_key)}
              onContextMenu={(event) => onContextMenu(event, node)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground",
              )}
            >
              {hasChildren ? (
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{node.title || "Без названия"}</span>
              {hasChildren ? (
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {node.children.length}
                </span>
              ) : null}
            </button>

            {hasChildren ? (
              <div className="ml-4 pl-3">
                <NoteTreeBranch
                  nodes={node.children}
                  activeNoteKey={activeNoteKey}
                  onOpenNote={onOpenNote}
                  onContextMenu={onContextMenu}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export const NotePageLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getNotes, loading, error } = useGetNotes();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
      setDebouncedSearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let alive = true;

    const loadNotes = async () => {
      const result = await getNotes({
        limit: 256,
        offset: 0,
        search: debouncedSearch || null,
      });

      if (!alive || !result) {
        return;
      }

      setNotes(result);
    };

    void loadNotes();

    return () => {
      alive = false;
    };
  }, [debouncedSearch, getNotes, reloadIndex]);

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

    navigate(`/notes/new?parent_key=${encodeURIComponent(contextMenu.node.note_key)}`);
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
      navigate(target.parent_key ? `/notes/${target.parent_key}` : "/notes/new", {
        replace: true,
      });
    }
  };

  return (
    <NoteLayoutProvider value={{ refreshNotes }}>
      <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa] text-foreground">
        <Header
          title={activeNode?.title ? `Заметки / ${activeNode.title}` : "Заметки"}
          buttons={[
            {
              title: "Новая заметка",
              onClick: () => navigate("/notes/new"),
              variant: "outline",
            },
          ]}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="flex w-[380px] shrink-0 flex-col bg-white">
            <div className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Заметки
                  </p>
                  <h1 className="truncate text-lg font-semibold">Структура</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notes.length} {notes.length === 1 ? "заметка" : "заметок"}
                  </p>
                </div>

                <Button size="sm" variant="outline" onClick={() => navigate("/notes/new")}>
                  <Plus className="h-4 w-4" />
                  Новая
                </Button>
              </div>

              <label className="relative mt-4 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по названию"
                  className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {loading && !notes.length ? (
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
                  onOpenNote={openNote}
                  onContextMenu={openContextMenu}
                />
              ) : (
                <div className="rounded-md border border-dashed border-black/10 p-4 text-sm text-muted-foreground">
                  Ничего не найдено
                </div>
              )}
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>

        {contextMenu ? (
          <div
            className="fixed z-50 w-56 rounded-md border border-black/10 bg-white p-1 shadow-lg"
            style={{ top: contextMenu.top, left: contextMenu.left }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={createChild}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-4 w-4" />
              Создать новую заметку
            </button>
            <button
              type="button"
              onClick={deleteNode}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Удалить
            </button>
          </div>
        ) : null}

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
