import { useCallback, useState } from "react";

import { noteProxy } from "@/entities/note/api/proxy";
import type { Note } from "@/entities/note/types/dto";
import { getErrorMessage } from "@/shared/api/error";

export function useGetNoteByKey() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNoteByKey = useCallback(async (noteKey: string): Promise<Note | null> => {
    setLoading(true);
    setError(null);

    try {
      return await noteProxy.getNoteByKey(noteKey);
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getNoteByKey, loading, error };
}
