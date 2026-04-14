import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateNote } from "@/features/note/hooks/use-create-note";
import { useDeleteNote } from "@/features/note/hooks/use-delete-note";
import { useGetNoteByKey } from "@/features/note/hooks/use-get-note-by-key";
import { useUpdateNote } from "@/features/note/hooks/use-update-note";
import type { Note } from "@/entities/note/types/dto";
import type { CreateNoteRequest } from "@/entities/note/types/requests";
import { cn } from "@/lib/utils";
import { useNoteLayout } from "@/pages/note/ui/note-layout-context";

type NoteEditorMode = "new" | "edit";

type NoteEditorProps = {
  mode: NoteEditorMode;
  noteKey?: string | null;
  parentKey?: string | null;
};

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function parseTagInput(value: string) {
  return normalizeTags(value.split(/[,\n]/g));
}

export function NoteEditor({ mode, noteKey, parentKey }: NoteEditorProps) {
  const navigate = useNavigate();
  const { refreshNotes } = useNoteLayout();
  const { getNoteByKey, loading: noteLoading, error: noteError } = useGetNoteByKey();
  const { createNote, loading: createLoading, error: createError } = useCreateNote();
  const { updateNote, loading: updateLoading, error: updateError } = useUpdateNote();
  const { deleteNote, loading: deleteLoading, error: deleteError } = useDeleteNote();

  const [loadedNote, setLoadedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [savingHint, setSavingHint] = useState<string | null>(null);

  const isEditing = mode === "edit";
  const busy = noteLoading || createLoading || updateLoading || deleteLoading;
  const error = noteError || createError || updateError || deleteError;

  useEffect(() => {
    if (!isEditing || !noteKey) {
      setLoadedNote(null);
      setTitle("");
      setContent("");
      setTags([]);
      setTagDraft("");
      return;
    }

    let alive = true;

    const load = async () => {
      const note = await getNoteByKey(noteKey);

      if (!alive) {
        return;
      }

      setLoadedNote(note);
      setTitle(note?.title ?? "");
      setContent(note?.content ?? "");
      setTags(note?.tags ?? []);
      setTagDraft("");
    };

    void load();

    return () => {
      alive = false;
    };
  }, [getNoteByKey, isEditing, noteKey]);

  const effectiveParentKey = useMemo(() => {
    if (isEditing) {
      return loadedNote?.parent_key ?? null;
    }

    return parentKey ?? null;
  }, [isEditing, loadedNote?.parent_key, parentKey]);

  const save = useCallback(async () => {
    const payload: CreateNoteRequest = {
      title: title.trim(),
      content,
      parent_key: effectiveParentKey,
      tags: normalizeTags(tags),
    };

    setSavingHint(null);

    if (isEditing && noteKey) {
      const updated = await updateNote(noteKey, payload);

      if (!updated) {
        return;
      }

      setLoadedNote(updated);
      setTitle(updated.title);
      setContent(updated.content);
      setTags(updated.tags);
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
  }, [content, effectiveParentKey, isEditing, navigate, noteKey, refreshNotes, tags, title, createNote, updateNote]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") {
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

  if (isEditing && noteLoading && !loadedNote) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {isEditing ? "Existing note" : "New note"}
          </p>
          <h2 className="truncate text-xl font-semibold">
            {isEditing ? loadedNote?.title || "Заметка" : "Новая заметка"}
          </h2>
          {effectiveParentKey ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Родитель: <span className="text-foreground">{effectiveParentKey}</span>
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void save()}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {savingHint ? (
            <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {savingHint}
            </div>
          ) : null}

          <section className="rounded-md border border-border bg-card/60 p-5 shadow-sm">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Название</span>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Название заметки"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Контент</span>
                <Textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Текст заметки"
                  className="min-h-[360px]"
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-medium">Теги</span>
                <div className="flex gap-2">
                  <Input
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTagsFromDraft();
                      }
                    }}
                    placeholder="tag1, tag2"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTagsFromDraft}>
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
                          "inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1 text-sm",
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
                    <span className="text-sm text-muted-foreground">Тегов пока нет</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
