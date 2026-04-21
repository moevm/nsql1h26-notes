import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GetUsersResponse } from "@/entities/user/types/responses";
import { formatKey } from "@/pages/logs/ui/helpers";

type UserSummary = GetUsersResponse[number];

interface LogUserPickerModalProps {
    open: boolean;
    title: string;
    users: UserSummary[];
    loading: boolean;
    error: string | null;
    selectedUserKey: string;
    onSelect: (userKey: string) => void;
    onClear: () => void;
    onClose: () => void;
}

export function LogUserPickerModal({
    open,
    title,
    users,
    loading,
    error,
    selectedUserKey,
    onSelect,
    onClear,
    onClose,
}: LogUserPickerModalProps) {
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setSearch("");

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, open]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return users;
        }

        return users.filter((user) =>
            user.username.toLowerCase().includes(query)
            || user.user_key.toLowerCase().includes(query),
        );
    }, [search, users]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onMouseDown={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="log-user-picker-title"
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
                    <div>
                        <h2 id="log-user-picker-title" className="text-lg font-semibold">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Выберите пользователя из списка.
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Закрыть выбор пользователя"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="border-b border-black/10 px-5 py-4">
                    <label className="relative block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Поиск по username или user_key"
                            className="pl-9"
                        />
                    </label>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {loading ? (
                        <div className="rounded-md border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-muted-foreground">
                            Загрузка пользователей...
                        </div>
                    ) : error ? (
                        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    ) : filteredUsers.length ? (
                        <div className="space-y-2">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.user_key}
                                    type="button"
                                    onClick={() => onSelect(user.user_key)}
                                    className={[
                                        "w-full rounded-md border px-4 py-3 text-left transition-colors",
                                        selectedUserKey === user.user_key
                                            ? "border-black bg-black text-white"
                                            : "border-black/10 bg-white hover:bg-black/[0.03]",
                                    ].join(" ")}
                                >
                                    <p className="font-medium">{user.username}</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                        <span className={selectedUserKey === user.user_key ? "text-white/80" : "text-muted-foreground"}>
                                            {formatKey(user.user_key)}
                                        </span>
                                        <span className={selectedUserKey === user.user_key ? "text-white/80" : "text-muted-foreground"}>
                                            {user.role}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-md border border-dashed border-black/15 bg-white px-4 py-8 text-center text-sm text-muted-foreground">
                            Пользователи не найдены.
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-black/10 px-5 py-4">
                    <Button type="button" variant="outline" onClick={onClear}>
                        Очистить
                    </Button>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Закрыть
                    </Button>
                </div>
            </div>
        </div>
    );
}
