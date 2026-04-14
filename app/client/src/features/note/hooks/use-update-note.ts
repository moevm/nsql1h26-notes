import { useCallback, useState } from "react";

import { noteProxy } from "@/entities/note/api/proxy";
import type { UpdateNoteRequest } from "@/entities/note/types/requests";
import type { UpdateNoteResponse } from "@/entities/note/types/responses";
import { getErrorMessage } from "@/shared/api/error";

export function useUpdateNote() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateNote = useCallback(
        async (
            noteKey: string,
            payload: UpdateNoteRequest,
        ): Promise<UpdateNoteResponse | null> => {
            setLoading(true);
            setError(null);

            try {
                return await noteProxy.updateNote(noteKey, payload);
            } catch (err) {
                setError(getErrorMessage(err));
                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    return { updateNote, loading, error };
}
