import { useCallback, useState } from "react";

import { noteProxy } from "@/entities/note/api/proxy";
import { getErrorMessage } from "@/shared/api/error";

export function useDeleteNote() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteNote = useCallback(async (noteKey: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            return await noteProxy.deleteNote(noteKey);
        } catch (err) {
            setError(getErrorMessage(err));
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return { deleteNote, loading, error };
}
