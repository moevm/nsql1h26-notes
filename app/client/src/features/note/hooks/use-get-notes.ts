import { useCallback, useState } from "react";

import { noteProxy } from "@/entities/note/api/proxy";
import type { GetNotesRequest } from "@/entities/note/types/requests";
import type { GetNotesResponse } from "@/entities/note/types/responses";
import { getErrorMessage } from "@/shared/api/error";

export function useGetNotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNotes = useCallback(async (payload: GetNotesRequest): Promise<GetNotesResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      return await noteProxy.getNotes(payload);
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getNotes, loading, error };
}
