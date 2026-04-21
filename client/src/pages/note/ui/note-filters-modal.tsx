import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronDown, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Note } from "@/entities/note/types/dto";
import { formatKey } from "@/pages/logs/ui/helpers";
import { LogNotePickerModal } from "@/pages/logs/ui/log-note-picker-modal";
import { Input } from "@/components/ui/input";
import { DEFAULT_NOTE_FILTERS, type NoteFilters } from "@/pages/note/ui/note-filters";

type TextFilterField = Exclude<keyof NoteFilters, "limit" | "offset">;

interface NoteFiltersModalProps {
    open: boolean;
    filters: NoteFilters;
    notes: Note[];
    notesLoading: boolean;
    notesError: string | null;
    onApply: (filters: NoteFilters) => void;
    onReset: () => void;
    onClose: () => void;
}

export function NoteFiltersModal({
    open,
    filters,
    notes,
    notesLoading,
    notesError,
    onApply,
    onReset,
    onClose,
}: NoteFiltersModalProps) {
    const [draft, setDraft] = useState<NoteFilters>(filters);
    const [notePickerOpen, setNotePickerOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setDraft(filters);
        }
    }, [filters, open]);

    useEffect(() => {
        if (!open) {
            setNotePickerOpen(false);
        }
    }, [open]);

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

    const noteMap = useMemo(
        () => new Map(notes.map((note) => [note.note_key, note])),
        [notes],
    );

    const selectedParent = draft.parent_key
        ? noteMap.get(draft.parent_key)
        : null;

    const parentLabel = !draft.parent_key
        ? "Не выбран"
        : selectedParent?.title || formatKey(draft.parent_key);

    if (!open) {
        return null;
    }

    const updateTextField = (field: TextFilterField, value: string) => {
        setDraft((current) => ({ ...current, [field]: value }));
    };

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onApply({
            ...draft,
            limit: Number.isFinite(draft.limit)
                ? draft.limit
                : DEFAULT_NOTE_FILTERS.limit,
            offset: Number.isFinite(draft.offset)
                ? draft.offset
                : DEFAULT_NOTE_FILTERS.offset,
        });
    };

    const resetFilters = () => {
        setDraft(DEFAULT_NOTE_FILTERS);
        onReset();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onMouseDown={onClose}
        >
            <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="note-filters-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-black/10 bg-white p-5 shadow-xl"
                onSubmit={applyFilters}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2
                            id="note-filters-title"
                            className="text-lg font-semibold"
                        >
                            Фильтры заметок
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Параметры будут добавлены к запросу списка заметок.
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Закрыть фильтры"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium">search</span>
                        <Input
                            value={draft.search}
                            onChange={(event) =>
                                updateTextField("search", event.target.value)
                            }
                            placeholder="Поиск"
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium">tag</span>
                        <Input
                            value={draft.tag}
                            onChange={(event) =>
                                updateTextField("tag", event.target.value)
                            }
                            placeholder="Тег"
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm md:col-span-2">
                        <span className="font-medium">parent_key</span>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 justify-between px-3 font-normal"
                            onClick={() => setNotePickerOpen(true)}
                        >
                            <span className={draft.parent_key ? "text-foreground" : "text-muted-foreground"}>
                                Родительская заметка: {parentLabel}
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium">created_from</span>
                        <Input
                            type="datetime-local"
                            value={draft.created_from}
                            onChange={(event) =>
                                updateTextField(
                                    "created_from",
                                    event.target.value,
                                )
                            }
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium">created_to</span>
                        <Input
                            type="datetime-local"
                            value={draft.created_to}
                            onChange={(event) =>
                                updateTextField(
                                    "created_to",
                                    event.target.value,
                                )
                            }
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium">updated_from</span>
                        <Input
                            type="datetime-local"
                            value={draft.updated_from}
                            onChange={(event) =>
                                updateTextField(
                                    "updated_from",
                                    event.target.value,
                                )
                            }
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="font-medium">updated_to</span>
                        <Input
                            type="datetime-local"
                            value={draft.updated_to}
                            onChange={(event) =>
                                updateTextField(
                                    "updated_to",
                                    event.target.value,
                                )
                            }
                        />
                    </label>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={resetFilters}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Сбросить
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button type="submit">Применить</Button>
                </div>
            </form>

            <LogNotePickerModal
                open={notePickerOpen}
                notes={notes}
                loading={notesLoading}
                error={notesError}
                selectedNoteKey={draft.parent_key}
                onSelect={(noteKey) => {
                    updateTextField("parent_key", noteKey);
                    setNotePickerOpen(false);
                }}
                onClear={() => {
                    updateTextField("parent_key", "");
                    setNotePickerOpen(false);
                }}
                onClose={() => setNotePickerOpen(false)}
            />
        </div>
    );
}
