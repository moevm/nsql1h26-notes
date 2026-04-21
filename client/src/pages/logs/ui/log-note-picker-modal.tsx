import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Note } from "@/entities/note/types/dto";
import { formatKey } from "@/pages/logs/ui/helpers";

interface LogNotePickerModalProps {
    open: boolean;
    notes: Note[];
    loading: boolean;
    error: string | null;
    selectedNoteKey: string;
    onSelect: (noteKey: string) => void;
    onClear: () => void;
    onClose: () => void;
}

export function LogNotePickerModal({
    open,
    notes,
    loading,
    error,
    selectedNoteKey,
    onSelect,
    onClear,
    onClose,
}: LogNotePickerModalProps) {
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setSearch("");

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, open]);

    const filteredNotes = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return notes;
        }

        return notes.filter((note) =>
            note.title.toLowerCase().includes(query)
            || note.note_key.toLowerCase().includes(query),
        );
    }, [notes, search]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onMouseDown={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="log-note-picker-title"
                className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
                    <div>
                        <h2 id="log-note-picker-title" className="text-lg font-semibold">
                            Выбор заметки
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Выберите заметку по названию. В фильтр будет подставлен её `note_key`.
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Закрыть выбор заметки"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="border-b border-black/10 px-5 py-4">
                    <label className="relative block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Поиск по названию или note_key"
                            className="pl-9"
                        />
                    </label>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {loading ? (
                        <div className="rounded-md border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-muted-foreground">
                            Загрузка заметок...
                        </div>
                    ) : error ? (
                        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    ) : filteredNotes.length ? (
                        <div className="space-y-2">
                            {filteredNotes.map((note) => (
                                <button
                                    key={note.note_key}
                                    type="button"
                                    onClick={() => onSelect(note.note_key)}
                                    className={[
                                        "w-full rounded-md border px-4 py-3 text-left transition-colors",
                                        selectedNoteKey === note.note_key
                                            ? "border-black bg-black text-white"
                                            : "border-black/10 bg-white hover:bg-black/[0.03]",
                                    ].join(" ")}
                                >
                                    <p className="font-medium">
                                        {note.title || "Без названия"}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                        <span className={selectedNoteKey === note.note_key ? "text-white/80" : "text-muted-foreground"}>
                                            {formatKey(note.note_key)}
                                        </span>
                                        <span className={selectedNoteKey === note.note_key ? "text-white/80" : "text-muted-foreground"}>
                                            {note.username}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border border-dashed border-black/15 bg-white px-4 py-8 text-center text-sm text-muted-foreground">
                            Заметки не найдены.
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-black/10 px-5 py-4">
                    <Button type="button" variant="outline" onClick={onClear}>
                        Очистить
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Закрыть
                    </Button>
                </div>
            </div>
        </div>
    );
}
