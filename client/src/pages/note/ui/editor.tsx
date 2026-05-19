import {
    type KeyboardEvent as ReactKeyboardEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Loader2,
    Plus,
    Save,
    Share2,
    Trash2,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { Textarea } from "@/components/ui/textarea";
import { useCreateNote } from "@/features/note/hooks/use-create-note";
import { useDeleteNote } from "@/features/note/hooks/use-delete-note";
import { useGetNoteByKey } from "@/features/note/hooks/use-get-note-by-key";
import { useUpdateNote } from "@/features/note/hooks/use-update-note";
import { noteProxy } from "@/entities/note/api/proxy";
import type { Note } from "@/entities/note/types/dto";
import type { CreateNoteRequest } from "@/entities/note/types/requests";
import { cn } from "@/lib/utils";
import { useNoteLayout } from "@/pages/note/ui/note-layout-context";
import { NoteShareModal } from "@/pages/note/ui/note-share-modal";
import { useAccessTokenPayload } from "@/shared/hooks/use-access-token-payload";
import { UserLink } from "@/shared/ui/user-link";

type NoteEditorMode = "new" | "edit";

type NoteEditorProps = {
    mode: NoteEditorMode;
    noteKey?: string | null;
    parentKey?: string | null;
};

function normalizeTags(tags: string[]) {
    return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function parseTagInput(value: string) {
    return normalizeTags(value.split(/[\n,]/g));
}

function normalizeLinkedNoteKeys(keys: string[]) {
    return Array.from(new Set(keys.map((key) => key.trim()).filter(Boolean)));
}

function normalizeWikiTitle(value: string) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function extractWikiLinkTitles(content: string) {
    return Array.from(content.matchAll(/\[\[([^\]]+)]]/g))
        .map((match) => match[1]?.trim() ?? "")
        .filter(Boolean);
}

function splitContent(content: string) {
    const lines = content.split(/\r?\n/);
    return lines.length ? lines : [""];
}

function formatNoteTimestamp(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export function NoteEditor({ mode, noteKey, parentKey }: NoteEditorProps) {
    const navigate = useNavigate();
    const currentUser = useAccessTokenPayload();
    const { refreshNotes } = useNoteLayout();
    const {
        getNoteByKey,
        loading: noteLoading,
        error: noteError,
    } = useGetNoteByKey();
    const {
        createNote,
        loading: createLoading,
        error: createError,
    } = useCreateNote();
    const {
        updateNote,
        patchNote,
        loading: updateLoading,
        error: updateError,
    } = useUpdateNote();
    const {
        deleteNote,
        loading: deleteLoading,
        error: deleteError,
    } = useDeleteNote();

    const [loadedNote, setLoadedNote] = useState<Note | null>(null);
    const [title, setTitle] = useState("");
    const [lines, setLines] = useState<string[]>([""]);
    const [activeLineIndex, setActiveLineIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [tags, setTags] = useState<string[]>([]);
    const [tagDraft, setTagDraft] = useState("");
    const [linkedNoteKeys, setLinkedNoteKeys] = useState<string[]>([]);
    const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
    const [availableNotesLoading, setAvailableNotesLoading] = useState(false);
    const [savingHint, setSavingHint] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const lineRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});

    const isEditing = mode === "edit";
    const busy = noteLoading || createLoading || updateLoading || deleteLoading;
    const error = noteError || createError || updateError || deleteError;

    useEffect(() => {
        if (!isEditing || !noteKey) {
            setLoadedNote(null);
            setTitle("");
            setLines([""]);
            setActiveLineIndex(0);
            setTags([]);
            setTagDraft("");
            setLinkedNoteKeys([]);
            return;
        }

        let alive = true;

        const load = async () => {
            const note = await getNoteByKey(noteKey);

            if (!alive) {
                return;
            }

            const nextLines = splitContent(note?.content ?? "");
            setLoadedNote(note);
            setTitle(note?.title ?? "");
            setLines(nextLines);
            setActiveLineIndex(Math.max(nextLines.length - 1, 0));
            setTags(note?.tags ?? []);
            setLinkedNoteKeys(note?.linked_note_keys ?? []);
            setTagDraft("");
        };

        void load();

        return () => {
            alive = false;
        };
    }, [getNoteByKey, isEditing, noteKey]);

    useEffect(() => {
        let alive = true;

        const loadAvailableNotes = async () => {
            setAvailableNotesLoading(true);
            const notes = await noteProxy.getNotes({
                limit: 256,
                offset: 0,
            });

            if (!alive) {
                return;
            }

            setAvailableNotes(notes);
            setAvailableNotesLoading(false);
        };

        void loadAvailableNotes();

        return () => {
            alive = false;
        };
    }, []);

    const effectiveParentKey = useMemo(() => {
        if (isEditing) {
            return loadedNote?.parent_key ?? null;
        }

        return parentKey ?? null;
    }, [isEditing, loadedNote?.parent_key, parentKey]);

    const notesByKey = useMemo(() => {
        return new Map(availableNotes.map((note) => [note.note_key, note]));
    }, [availableNotes]);

    const notesByTitle = useMemo(() => {
        const map = new Map<string, Note>();

        availableNotes.forEach((note) => {
            const key = normalizeWikiTitle(note.title);

            if (key && !map.has(key)) {
                map.set(key, note);
            }
        });

        return map;
    }, [availableNotes]);

    const content = useMemo(() => lines.join("\n"), [lines]);

    const contentLinkedNoteKeys = useMemo(() => {
        return normalizeLinkedNoteKeys(
            extractWikiLinkTitles(content)
                .map((title) => notesByTitle.get(normalizeWikiTitle(title)))
                .filter((note): note is Note => Boolean(note))
                .map((note) => note.note_key)
                .filter((key) => key !== noteKey),
        );
    }, [content, noteKey, notesByTitle]);

    const outgoingLinkedNotes = useMemo(() => {
        const keys = contentLinkedNoteKeys.length
            ? contentLinkedNoteKeys
            : linkedNoteKeys;

        return keys
            .map((key) => notesByKey.get(key))
            .filter((note): note is Note => Boolean(note));
    }, [contentLinkedNoteKeys, linkedNoteKeys, notesByKey]);

    const incomingLinkedNotes = useMemo(() => {
        if (!noteKey) {
            return [];
        }

        return availableNotes.filter(
            (note) =>
                note.note_key !== noteKey &&
                (note.linked_note_keys ?? []).includes(noteKey),
        );
    }, [availableNotes, noteKey]);

    const renderWikiLinks = useCallback(
        (value: string) =>
            value.replace(/\[\[([^\]]+)]]/g, (match, rawTitle: string) => {
                const title = rawTitle.trim();
                const note = notesByTitle.get(normalizeWikiTitle(title));

                if (!note) {
                    return match;
                }

                return `[${title}](/notes/${note.note_key})`;
            }),
        [notesByTitle],
    );

    const activeWikiQuery = useMemo(() => {
        const line = lines[activeLineIndex] ?? "";
        const beforeCursor = line.slice(0, cursorPosition);
        const afterCursor = line.slice(cursorPosition);
        const match = beforeCursor.match(/\[\[([^\]]*)$/);

        if (!match || !afterCursor.startsWith("]]")) {
            return null;
        }

        return match[1] ?? "";
    }, [activeLineIndex, cursorPosition, lines]);

    const wikiNoteOptions = useMemo(() => {
        if (activeWikiQuery === null) {
            return [];
        }

        const query = normalizeWikiTitle(activeWikiQuery);

        return availableNotes
            .filter((note) => note.note_key !== noteKey)
            .filter((note) => normalizeWikiTitle(note.title).includes(query))
            .slice(0, 8);
    }, [activeWikiQuery, availableNotes, noteKey]);

    const insertWikiNote = (note: Note) => {
        const line = lines[activeLineIndex] ?? "";
        const beforeCursor = line.slice(0, cursorPosition);
        const afterCursor = line.slice(cursorPosition);
        const match = beforeCursor.match(/\[\[([^\]]*)$/);

        if (!match || !afterCursor.startsWith("]]")) {
            return;
        }

        const start = beforeCursor.length - match[0].length;
        const nextLine = `${line.slice(0, start)}[[${note.title}]]${afterCursor.slice(2)}`;

        updateLine(activeLineIndex, nextLine);
        setActiveLineIndex(-1);
        setCursorPosition(0);
    };

    const updateLine = useCallback((index: number, value: string) => {
        setLines((current) =>
            current.map((line, lineIndex) =>
                lineIndex === index ? value : line,
            ),
        );
    }, []);

    const setLineSelection = useCallback((index: number, position: number) => {
        window.requestAnimationFrame(() => {
            const textarea = lineRefs.current[index];

            if (!textarea) {
                return;
            }

            textarea.focus();
            textarea.setSelectionRange(position, position);
            setCursorPosition(position);
        });
    }, []);

    const updateCursorPosition = (element: HTMLTextAreaElement) => {
        setCursorPosition(element.selectionStart);
    };

    const insertLineAfter = useCallback((index: number, value: string) => {
        setLines((current) => {
            const next = [...current];
            next[index] = value;
            next.splice(index + 1, 0, "");
            return next;
        });
        setActiveLineIndex(index + 1);
    }, []);

    const removeLine = useCallback((index: number) => {
        setLines((current) => {
            if (current.length <= 1) {
                return [""];
            }

            const next = current.filter((_, lineIndex) => lineIndex !== index);
            return next.length ? next : [""];
        });
        setActiveLineIndex((current) => Math.max(0, current - 1));
    }, []);

    const save = useCallback(async () => {
        const payload: CreateNoteRequest = {
            title: title.trim(),
            content,
            parent_key: effectiveParentKey,
            tags: normalizeTags(tags),
            linked_note_keys: contentLinkedNoteKeys,
        };

        setSavingHint(null);

        if (isEditing && noteKey) {
            const isOwnNote = loadedNote?.user_ref === currentUser?.sub;
            const updated = isOwnNote
                ? await updateNote(noteKey, payload)
                : await patchNote(noteKey, {
                      title: payload.title,
                      content: payload.content,
                      tags: payload.tags,
                      linked_note_keys: payload.linked_note_keys,
                  });

            if (!updated) {
                return;
            }

            const nextLines = splitContent(updated.content ?? "");
            setLoadedNote(updated);
            setTitle(updated.title);
            setLines(nextLines);
            setActiveLineIndex(Math.max(nextLines.length - 1, 0));
            setTags(updated.tags);
            setLinkedNoteKeys(updated.linked_note_keys ?? []);
            setSavingHint("Сохранено");
            refreshNotes();
            return;
        }

        const created = await createNote(payload);
        if (!created) {
            return;
        }

        refreshNotes();
        setSavingHint("Создано");
        navigate(`/notes/${created.note_key}`, { replace: true });
    }, [
        content,
        contentLinkedNoteKeys,
        createNote,
        currentUser?.sub,
        effectiveParentKey,
        isEditing,
        loadedNote?.user_ref,
        navigate,
        noteKey,
        patchNote,
        refreshNotes,
        tags,
        title,
        updateNote,
    ]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                !(event.ctrlKey || event.metaKey) ||
                event.key.toLowerCase() !== "s"
            ) {
                return;
            }

            event.preventDefault();
            void save();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [save]);

    const addTagsFromDraft = () => {
        const parsed = parseTagInput(tagDraft);
        if (!parsed.length) {
            return;
        }

        setTags((current) => normalizeTags([...current, ...parsed]));
        setTagDraft("");
    };

    const removeTag = (tag: string) => {
        setTags((current) => current.filter((item) => item !== tag));
    };

    const handleDelete = async () => {
        if (!noteKey) {
            return;
        }

        const parent = loadedNote?.parent_key ?? null;
        const ok = await deleteNote(noteKey);

        if (!ok) {
            return;
        }

        refreshNotes();
        navigate(parent ? `/notes/${parent}` : "/notes/new", { replace: true });
    };

    const handleLineKeyDown = (
        event: ReactKeyboardEvent<HTMLTextAreaElement>,
        index: number,
    ) => {
        if (event.key === "[") {
            const textarea = event.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const line = lines[index] ?? "";

            if (start > 0 && start === end && line[start - 1] === "[") {
                event.preventDefault();

                const nextLine = `${line.slice(0, start)}[]]${line.slice(end)}`;
                updateLine(index, nextLine);
                setLineSelection(index, start + 1);
                return;
            }
        }

        if (event.key === "Enter" && !event.shiftKey) {
            if (wikiNoteOptions.length && activeWikiQuery !== null) {
                event.preventDefault();
                insertWikiNote(wikiNoteOptions[0]);
                return;
            }

            event.preventDefault();
            insertLineAfter(index, lines[index] ?? "");
            return;
        }

        if (
            event.key === "Backspace" &&
            (lines[index] ?? "") === "" &&
            index > 0
        ) {
            event.preventDefault();
            removeLine(index);
        }
    };

    if (isEditing && noteLoading && !loadedNote) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fafafa] text-foreground">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-white px-6 py-4">
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {isEditing ? "Существующая заметка" : "Новая заметка"}
                    </p>
                    <h2 className="truncate text-xl font-semibold">
                        {isEditing
                            ? loadedNote?.title || "Заметка"
                            : "Новая заметка"}
                    </h2>
                    {effectiveParentKey ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Родитель:{" "}
                            <span className="text-foreground">
                                {effectiveParentKey}
                            </span>
                        </p>
                    ) : null}
                    {isEditing && loadedNote ? (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <p>
                                Создатель:{" "}
                                <UserLink
                                    userKey={loadedNote.user_ref}
                                    username={loadedNote.username}
                                />
                            </p>
                            <p>
                                Создана:{" "}
                                <time dateTime={loadedNote.created_at}>
                                    {formatNoteTimestamp(loadedNote.created_at)}
                                </time>
                            </p>
                            <p>
                                Последнее изменение:{" "}
                                <time dateTime={loadedNote.updated_at}>
                                    {formatNoteTimestamp(loadedNote.updated_at)}
                                </time>
                            </p>
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShareOpen(true)}
                        disabled={!isEditing || !loadedNote || busy}
                    >
                        <Share2 className="h-4 w-4" />
                        Поделиться
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void save()}
                        disabled={busy}
                    >
                        {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Сохранить
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={!isEditing || busy}
                    >
                        <Trash2 className="h-4 w-4" />
                        Удалить
                    </Button>
                </div>
            </div>

            {isEditing && loadedNote ? (
                <NoteShareModal
                    open={shareOpen}
                    note={loadedNote}
                    onClose={() => setShareOpen(false)}
                />
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-[900px] flex-col gap-3 px-0 py-0">
                    {error ? (
                        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    ) : null}

                    {savingHint ? (
                        <div className="rounded-md border border-black/5 bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">
                            {savingHint}
                        </div>
                    ) : null}

                    <div className="grid gap-3">
                        <label className="grid gap-2">
                            <Input
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="Название заметки"
                                className="h-11 outline-none border-none text-[24px] ml-0 pl-0 mt-2"
                            />
                        </label>

                        <div className="grid gap-2">
                            <span className="text-sm font-medium">Теги</span>
                            <div className="flex gap-2">
                                <Input
                                    value={tagDraft}
                                    onChange={(event) =>
                                        setTagDraft(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            addTagsFromDraft();
                                        }
                                    }}
                                    placeholder="тег1, тег2"
                                    className={"border-none outline-none"}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addTagsFromDraft}
                                >
                                    <Plus className="h-4 w-4" />
                                    Добавить
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {tags.length ? (
                                    tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className={cn(
                                                "inline-flex items-center gap-2 rounded-md bg-black/5 px-2.5 py-1 text-sm",
                                            )}
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        Тегов пока нет
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <span className="text-sm font-medium">
                                Связанные заметки
                            </span>
                            {availableNotesLoading ? (
                                <span className="text-sm text-muted-foreground">
                                    Загрузка связей...
                                </span>
                            ) : null}

                            <div className="grid gap-2 rounded-md border border-black/5 bg-white px-3 py-2">
                                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                    Из этой заметки
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {outgoingLinkedNotes.length ? (
                                        outgoingLinkedNotes.map((note) => (
                                            <button
                                                key={note.note_key}
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/notes/${note.note_key}`,
                                                    )
                                                }
                                                className="inline-flex max-w-full items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 text-sm text-blue-900 hover:bg-blue-100"
                                                title={note.title}
                                            >
                                                <span className="truncate">
                                                    {note.title ||
                                                        note.note_key}
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            Напишите [[название заметки]] в
                                            тексте
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2 rounded-md border border-black/5 bg-white px-3 py-2">
                                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                    Ссылаются сюда
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {incomingLinkedNotes.length ? (
                                        incomingLinkedNotes.map((note) => (
                                            <button
                                                key={note.note_key}
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/notes/${note.note_key}`,
                                                    )
                                                }
                                                className="inline-flex max-w-full items-center gap-2 rounded-md bg-black/5 px-2.5 py-1 text-sm hover:bg-black/10"
                                                title={note.title}
                                            >
                                                <span className="truncate">
                                                    {note.title ||
                                                        note.note_key}
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            Обратных ссылок пока нет
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <label className="grid gap-2">
                            <div className="w-full">
                                <div className="space-y-0">
                                    {lines.map((line, index) => {
                                        const isActive =
                                            index === activeLineIndex;

                                        if (isActive) {
                                            return (
                                                <div key={`line-${index}`}>
                                                    <Textarea
                                                        ref={(element) => {
                                                            lineRefs.current[
                                                                index
                                                            ] = element;
                                                        }}
                                                        autoFocus
                                                        value={line}
                                                        onChange={(event) =>
                                                            updateLine(
                                                                index,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        onFocus={() =>
                                                            setActiveLineIndex(
                                                                index,
                                                            )
                                                        }
                                                        onClick={(event) =>
                                                            updateCursorPosition(
                                                                event.currentTarget,
                                                            )
                                                        }
                                                        onKeyUp={(event) =>
                                                            updateCursorPosition(
                                                                event.currentTarget,
                                                            )
                                                        }
                                                        onSelect={(event) =>
                                                            updateCursorPosition(
                                                                event.currentTarget,
                                                            )
                                                        }
                                                        onKeyDown={(event) =>
                                                            handleLineKeyDown(
                                                                event,
                                                                index,
                                                            )
                                                        }
                                                        placeholder="Печатай текст здесь"
                                                        className="min-h-[44px] outline-0 resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-7 shadow-none focus-visible:ring-0"
                                                    />
                                                    {activeWikiQuery !== null ? (
                                                        <div className="mb-2 max-h-56 overflow-y-auto rounded-md border border-black/10 bg-white py-1 shadow-sm">
                                                            {wikiNoteOptions.length ? (
                                                                wikiNoteOptions.map(
                                                                    (note) => (
                                                                        <button
                                                                            key={
                                                                                note.note_key
                                                                            }
                                                                            type="button"
                                                                            onMouseDown={(
                                                                                event,
                                                                            ) => {
                                                                                event.preventDefault();
                                                                                insertWikiNote(
                                                                                    note,
                                                                                );
                                                                            }}
                                                                            className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-black/5"
                                                                        >
                                                                            <span className="font-medium">
                                                                                {note.title ||
                                                                                    note.note_key}
                                                                            </span>
                                                                            <span className="truncate text-xs text-muted-foreground">
                                                                                {
                                                                                    note.username
                                                                                }
                                                                            </span>
                                                                        </button>
                                                                    ),
                                                                )
                                                            ) : (
                                                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                                                    Заметка не
                                                                    найдена
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        }

                                        return (
                                            <button
                                                type="button"
                                                key={`line-${index}`}
                                                onClick={() =>
                                                    setActiveLineIndex(index)
                                                }
                                                className="block w-full py-0.5 text-left transition-colors hover:bg-black/5"
                                            >
                                                {line.trim() ? (
                                                    <Markdown
                                                        content={renderWikiLinks(
                                                            line,
                                                        )}
                                                        className="max-w-none space-y-0"
                                                    />
                                                ) : (
                                                    <div className="h-6" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
