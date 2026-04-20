import { useCallback, useState } from "react";

import { noteProxy } from "@/entities/note/api/proxy";
import type { CreateNoteRequest } from "@/entities/note/types/requests";
import type { CreateNoteResponse } from "@/entities/note/types/responses";
import { getErrorMessage } from "@/shared/api/error";

export function useCreateNote() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createNote = useCallback(async (
        payload: CreateNoteRequest,
    ): Promise<CreateNoteResponse | null> => {
        setLoading(true);
        setError(null);

        try {
            return await noteProxy.createNote(payload);
        } catch (err) {
            setError(getErrorMessage(err));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { createNote, loading, error };
}
