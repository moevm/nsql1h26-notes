import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { usersProxy } from "@/entities/user/api/users.proxy";
import type { GetUsersResponse } from "@/entities/user/types/responses";
import { getErrorMessage } from "@/shared/api/error";
import { useAccessTokenPayload } from "@/shared/hooks/use-access-token-payload";
import { Header } from "@/shared/layout/Header";
import { isAdminRole } from "@/shared/lib/access-token-payload";
import { clearRefreshToken, clearStoredAccessToken } from "@/shared/lib/token-storage";
import { UserLink } from "@/shared/ui/user-link";

export function AdminUsersPage() {
    const navigate = useNavigate();
    const currentUser = useAccessTokenPayload();
    const isAdmin = isAdminRole(currentUser?.role);
    const [users, setUsers] = useState<GetUsersResponse>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        const loadUsers = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await usersProxy.getUsers();

                if (alive) {
                    setUsers(response ?? []);
                }
            } catch (err) {
                if (alive) {
                    setError(getErrorMessage(err));
                    setUsers([]);
                }
            } finally {
                if (alive) {
                    setLoading(false);
                }
            }
        };

        void loadUsers();

        return () => {
            alive = false;
        };
    }, []);

    const logout = () => {
        clearStoredAccessToken();
        clearRefreshToken();
        navigate("/auth/signin", { replace: true });
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#fafafa] text-foreground">
            <Header
                title="Админ-панель / Пользователи"
                buttons={[
                    {
                        title: "Логи",
                        onClick: () => navigate("/admin/logs"),
                        variant: "outline",
                    },
                    {
                        title: "Заметки",
                        onClick: () => navigate("/admin/notes"),
                        variant: "outline",
                    },
                    {
                        title: "Моя страница",
                        onClick: () => navigate("/logs/my"),
                        variant: "secondary",
                    },
                    {
                        title: "Выйти",
                        onClick: logout,
                        variant: "outline",
                        className:
                            "border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600",
                    },
                ]}
            />

            <main className="mx-auto w-full max-w-7xl px-6 py-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Пользователи</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Всего в выдаче: {users.length}
                        </p>
                    </div>
                </div>

                {!isAdmin && currentUser ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                        Доступ запрещён
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-black/10 bg-white p-8 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка пользователей...
                    </div>
                ) : error ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                        {error}
                    </div>
                ) : users.length ? (
                    <div className="overflow-hidden rounded-md border border-black/10 bg-white">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0 text-sm">
                                <thead>
                                    <tr className="bg-black/[0.03] text-left">
                                        <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                            Username
                                        </th>
                                        <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                            User key
                                        </th>
                                        <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                            Роль
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr
                                            key={user.user_key}
                                            className="align-top transition-colors hover:bg-black/[0.02]"
                                        >
                                            <td className="border-b border-black/10 px-4 py-3">
                                                <UserLink
                                                    userKey={user.user_key}
                                                    username={user.username}
                                                />
                                            </td>
                                            <td className="border-b border-black/10 px-4 py-3 font-mono text-xs text-muted-foreground">
                                                {user.user_key}
                                            </td>
                                            <td className="border-b border-black/10 px-4 py-3">
                                                <span className="rounded-md border border-black/10 px-2 py-1 text-xs uppercase text-muted-foreground">
                                                    {user.role}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed border-black/15 bg-white p-8 text-center">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                        <h2 className="mt-4 text-lg font-semibold">
                            Пользователи не найдены
                        </h2>
                    </div>
                )}
            </main>
        </div>
    );
}
