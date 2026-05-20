import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { usersProxy } from "@/entities/user/api/users.proxy";
import type { GetUserResponse } from "@/entities/user/types/responses";
import { formatDate } from "@/pages/logs/ui/helpers";
import { getErrorMessage } from "@/shared/api/error";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Header } from "@/shared/layout/Header";

export function UserPage() {
    const navigate = useNavigate();
    const { userKey } = useParams();
    const [user, setUser] = useState<GetUserResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userKey) {
            setError("Некорректный пользователь");
            setLoading(false);
            return;
        }

        let alive = true;

        const loadUser = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await usersProxy.getUser(userKey);

                if (alive) {
                    setUser(response);
                }
            } catch (err) {
                if (alive) {
                    setError(getErrorMessage(err));
                    setUser(null);
                }
            } finally {
                if (alive) {
                    setLoading(false);
                }
            }
        };

        void loadUser();

        return () => {
            alive = false;
        };
    }, [userKey]);

    usePageTitle(user ? user.username : "Пользователь");

    return (
        <div className="flex min-h-screen flex-col bg-[#fafafa] text-foreground">
            <Header
                title="Пользователь"
                buttons={[
                    {
                        title: "Мои заметки",
                        onClick: () => navigate("/notes/new"),
                        variant: "outline",
                    },
                    {
                        title: "Моя страница",
                        onClick: () => navigate("/logs/my"),
                        variant: "secondary",
                    },
                ]}
            />

            <main className="mx-auto w-full max-w-3xl px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-black/10 bg-white p-8 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка пользователя...
                    </div>
                ) : error ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                        {error}
                    </div>
                ) : user ? (
                    <section className="rounded-md border border-black/10 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
                            <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                    Профиль
                                </p>
                                <h1 className="mt-1 break-words text-2xl font-semibold">
                                    {user.username}
                                </h1>
                            </div>
                            <span className="rounded-md border border-black/10 px-2 py-1 text-xs uppercase text-muted-foreground">
                                {user.role}
                            </span>
                        </div>

                        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs font-medium text-muted-foreground">
                                    User key
                                </dt>
                                <dd className="mt-1 break-all font-mono text-sm">
                                    {user.user_key}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-muted-foreground">
                                    Заметок
                                </dt>
                                <dd className="mt-1 text-sm">
                                    {user.notes_count}
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-xs font-medium text-muted-foreground">
                                    Дата регистрации
                                </dt>
                                <dd className="mt-1 text-sm text-muted-foreground">
                                    {formatDate(user.created_at)}
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    navigate(
                                        `/admin/logs?target_user_key=${encodeURIComponent(user.user_key)}`,
                                    )
                                }
                            >
                                Логи пользователя
                            </Button>
                        </div>
                    </section>
                ) : null}
            </main>
        </div>
    );
}
