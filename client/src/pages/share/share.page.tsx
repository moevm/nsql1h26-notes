import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { shareProxy } from "@/entities/share/api/proxy";
import type { SharedNoteResponse } from "@/entities/share/types";
import { useAuth } from "@/features/user/hooks/use-auth";
import { getErrorMessage } from "@/shared/api/error";
import { useAccessTokenPayload } from "@/shared/hooks/use-access-token-payload";
import { getRefreshToken } from "@/shared/lib/token-storage";
import { UserLink } from "@/shared/ui/user-link";

export function SharePage() {
    const navigate = useNavigate();
    const { shareKey } = useParams();
    const currentUser = useAccessTokenPayload();
    const { refresh } = useAuth();
    const [note, setNote] = useState<SharedNoteResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [authChecking, setAuthChecking] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        const restoreAuth = async () => {
            if (currentUser || !getRefreshToken()) {
                setAuthChecking(false);
                return;
            }

            await refresh();

            if (alive) {
                setAuthChecking(false);
            }
        };

        void restoreAuth();

        return () => {
            alive = false;
        };
    }, [currentUser, refresh]);

    useEffect(() => {
        if (authChecking) {
            return;
        }

        if (!shareKey) {
            setError("Некорректная ссылка");
            setLoading(false);
            return;
        }

        let alive = true;

        const loadSharedNote = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await shareProxy.getSharedNote(shareKey);

                if (alive) {
                    setNote(response);
                }
            } catch (err) {
                if (alive) {
                    setError(getErrorMessage(err));
                }
            } finally {
                if (alive) {
                    setLoading(false);
                }
            }
        };

        void loadSharedNote();

        return () => {
            alive = false;
        };
    }, [authChecking, shareKey]);

    return (
        <div className="min-h-screen bg-[#fafafa] px-4 py-8 text-foreground">
            <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-md border border-black/10 bg-white p-6 shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка заметки...
                    </div>
                ) : error ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                ) : note ? (
                    <>
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-4">
                            <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                    Shared note
                                </p>
                                <h1 className="mt-1 truncate text-2xl font-semibold">
                                    {note.title || "Без названия"}
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Автор:{" "}
                                    <UserLink
                                        userKey={note.user_ref}
                                        username={note.username}
                                    />
                                </p>
                            </div>

                            <Button
                                type="button"
                                disabled={authChecking}
                                onClick={() =>
                                    currentUser
                                        ? navigate(`/notes/${note.note_key}`)
                                        : navigate("/auth/signin", {
                                              state: {
                                                  from: `/share/${shareKey}`,
                                              },
                                          })
                                }
                            >
                                {authChecking
                                    ? "Проверка входа..."
                                    : currentUser
                                      ? "Открыть в заметках"
                                      : "Войти"}
                            </Button>
                        </div>

                        <Markdown content={note.content} />
                    </>
                ) : null}
            </main>
        </div>
    );
}
