import {
    type FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Loader2, RotateCcw, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usersProxy } from "@/entities/user/api/users.proxy";
import type { GetUsersResponse } from "@/entities/user/types/responses";
import { getErrorMessage } from "@/shared/api/error";
import { useAccessTokenPayload } from "@/shared/hooks/use-access-token-payload";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { Header } from "@/shared/layout/Header";
import { isAdminRole } from "@/shared/lib/access-token-payload";
import {
    clearRefreshToken,
    clearStoredAccessToken,
} from "@/shared/lib/token-storage";
import { UserLink } from "@/shared/ui/user-link";
import { formatDate } from "@/pages/logs/ui/helpers";

type UserFilters = {
    search: string;
    role: string;
    created_from?: string;
    created_to?: string;
};

const DEFAULT_USER_FILTERS: UserFilters = {
    search: "",
    role: "",
};

const roleOptions = [
    { value: "", label: "Все роли" },
    { value: "user", label: "USER" },
    { value: "admin", label: "ADMIN" },
];

export function AdminUsersPage() {
    usePageTitle("Пользователи");
    const navigate = useNavigate();
    const currentUser = useAccessTokenPayload();
    const isAdmin = isAdminRole(currentUser?.role);
    const [users, setUsers] = useState<GetUsersResponse>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<UserFilters>(DEFAULT_USER_FILTERS);
    const [filterDraft, setFilterDraft] =
        useState<UserFilters>(DEFAULT_USER_FILTERS);

    useEffect(() => {
        let alive = true;

        const loadUsers = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await usersProxy.getUsers({
                    search: filters.search.trim() || undefined,
                    role: filters.role || undefined,
                    created_from: filters.created_from || undefined,
                    created_to: filters.created_to || undefined,
                });

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
    }, [filters]);

    const activeFiltersCount = useMemo(() => {
        return [
            filters.search,
            filters.role,
            filters.created_from ?? "",
            filters.created_to ?? "",
        ].filter((value) => value && value.toString().trim()).length;
    }, [filters.role, filters.search, filters.created_from, filters.created_to]);

    const logout = () => {
        clearStoredAccessToken();
        clearRefreshToken();
        navigate("/auth/signin", { replace: true });
    };

    const applyFilters = (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        const rawDraft = {
            search: filterDraft.search.trim(),
            role: filterDraft.role.trim(),
            created_from: filterDraft.created_from,
            created_to: filterDraft.created_to,
        } as UserFilters;

        const queryFilters = {
            ...rawDraft,
            created_from: rawDraft.created_from
                ? new Date(rawDraft.created_from).toISOString()
                : undefined,
            created_to: rawDraft.created_to
                ? new Date(rawDraft.created_to).toISOString()
                : undefined,
        } as UserFilters;

        setFilterDraft(rawDraft);
        setFilters(queryFilters);
    };

    const resetFilters = () => {
        setFilterDraft(DEFAULT_USER_FILTERS);
        setFilters(DEFAULT_USER_FILTERS);
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
                            Найдено: {users.length}, активных фильтров:{" "}
                            {activeFiltersCount}
                        </p>
                    </div>
                </div>

                <form
                    className="mb-5 grid gap-3 rounded-md border border-black/10 bg-white p-4 md:grid-cols-4"
                    onSubmit={applyFilters}
                >
                    <label className="grid gap-1.5 text-sm md:col-span-2">
                        <span className="text-muted-foreground">Поиск</span>
                        <Input
                            value={filterDraft.search}
                            onChange={(event) =>
                                setFilterDraft((current) => ({
                                    ...current,
                                    search: event.target.value,
                                }))
                            }
                            placeholder="Username или user key"
                        />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="text-muted-foreground">Роль</span>
                        <select
                            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                            value={filterDraft.role}
                            onChange={(event) =>
                                setFilterDraft((current) => ({
                                    ...current,
                                    role: event.target.value,
                                }))
                            }
                        >
                            {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="text-muted-foreground">Зарегистирован с</span>
                            <Input
                                type="datetime-local"
                                value={filterDraft.created_from ?? ""}
                                onChange={(e) =>
                                    setFilterDraft((current) => ({
                                        ...current,
                                        created_from: e.target.value,
                                    }))
                                }
                            />
                    </label>

                    <label className="grid gap-1.5 text-sm">
                        <span className="text-muted-foreground">Зарегистрирован по</span>
                            <Input
                                type="datetime-local"
                                value={filterDraft.created_to ?? ""}
                                onChange={(e) =>
                                    setFilterDraft((current) => ({
                                        ...current,
                                        created_to: e.target.value,
                                    }))
                                }
                            />
                    </label>

                    <div className="flex flex-wrap items-end gap-2">
                        <Button type="submit">Применить</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetFilters}
                        >
                            <RotateCcw className="h-4 w-4" />
                            Сбросить
                        </Button>
                    </div>
                </form>

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
                                        <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                            Заметок
                                        </th>
                                        <th className="border-b border-black/10 px-4 py-3 font-medium text-muted-foreground">
                                            Создан
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
                                            <td className="border-b border-black/10 px-4 py-3">
                                                <Link
                                                    to={`/admin/notes?user_key=${encodeURIComponent(user.user_key)}`}
                                                    className="font-medium underline decoration-black/20 underline-offset-4 hover:decoration-black/60"
                                                >
                                                    {user.notes_count}
                                                </Link>
                                            </td>
                                            <td className="border-b border-black/10 px-4 py-3 text-muted-foreground">
                                                {formatDate(user.created_at)}
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
