import type { MouseEvent } from "react";
import { FileText, Folder } from "lucide-react";

import type { Note } from "@/entities/note/types/dto";
import { cn } from "@/lib/utils";

export type NoteTreeNode = Note & {
    children: NoteTreeNode[];
};

function sortNodes(nodes: NoteTreeNode[]) {
    nodes.sort((left, right) => left.title.localeCompare(right.title, "ru"));
    nodes.forEach((node) => sortNodes(node.children));
    return nodes;
}

export function buildNoteTree(notes: Note[]) {
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

export function findNoteByKey(
    nodes: NoteTreeNode[],
    noteKey: string,
): NoteTreeNode | null {
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
    onContextMenu: (
        event: MouseEvent<HTMLButtonElement>,
        node: NoteTreeNode,
    ) => void;
}

export function NoteTreeBranch({
    nodes,
    activeNoteKey,
    onOpenNote,
    onContextMenu,
}: NoteTreeProps) {
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
                            onContextMenu={(event) =>
                                onContextMenu(event, node)
                            }
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
                            <span className="min-w-0 flex-1 truncate">
                                {node.title || "Без названия"}
                            </span>
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
