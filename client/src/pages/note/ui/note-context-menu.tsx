import { Plus, Trash2 } from "lucide-react";

import type { NoteTreeNode } from "@/pages/note/ui/note-tree";

interface NoteContextMenuProps {
    menu: {
        node: NoteTreeNode;
        top: number;
        left: number;
    } | null;
    onCreateChild: () => void;
    onDelete: () => void;
}

export function NoteContextMenu({
    menu,
    onCreateChild,
    onDelete,
}: NoteContextMenuProps) {
    if (!menu) {
        return null;
    }

    return (
        <div
            className="fixed z-50 w-56 rounded-md border border-black/10 bg-white p-1 shadow-lg"
            style={{ top: menu.top, left: menu.left }}
            onClick={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                onClick={onCreateChild}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
                <Plus className="h-4 w-4" />
                Создать новую заметку
            </button>
            <button
                type="button"
                onClick={onDelete}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
                <Trash2 className="h-4 w-4" />
                Удалить
            </button>
        </div>
    );
}
