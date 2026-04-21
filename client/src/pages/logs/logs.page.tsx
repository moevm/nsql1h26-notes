import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authProxy } from "@/entities/user/api/auth.proxy";
import type { Log } from "@/entities/logs/types/responses";
import type { LogType } from "@/entities/logs/types/base";
import { useGetLogs } from "@/features/logs/hooks/use-get-logs";
import { Header } from "@/shared/layout/Header";
import { isAdminRole } from "@/shared/lib/access-token-payload";
import { getAccessToken, setAccessToken } from "@/shared/lib/auth-state";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "@/shared/lib/token-storage";
import { useAccessTokenPayload } from "@/shared/hooks/use-access-token-payload";
import { AccessDenied } from "@/pages/logs/ui/access-denied";
import { defaultFilters, emptyLogStats } from "@/pages/logs/ui/constants";
import { buildQuery, formatKey, getActionOptions } from "@/pages/logs/ui/helpers";
import { LogsFiltersPanel } from "@/pages/logs/ui/logs-filters-panel";
import { LogsResults } from "@/pages/logs/ui/logs-results";
import type { LogFilters, LogsPageScope, TypeFilter } from "@/pages/logs/ui/types";

export function LogsPage({ scope }: { scope: LogsPageScope }) {
    const navigate = useNavigate();
    const currentUser = useAccessTokenPayload();
    const isAdmin = isAdminRole(currentUser?.role);
    const { getLogs, loading, error } = useGetLogs();
    const [authReady, setAuthReady] = useState(false);
    const [logs, setLogs] = useState<Log[]>([]);
    const [draftFilters, setDraftFilters] = useState<LogFilters>(defaultFilters);
    const [appliedFilters, setAppliedFilters] = useState<LogFilters>(defaultFilters);

    useEffect(() => {
        let alive = true;

        const refreshBeforeRead = async () => {
            const refreshToken = getRefreshToken();

            if (getAccessToken() || !refreshToken) {
                setAuthReady(true);
                return;
            }

            try {
                const response = await authProxy.refresh(refreshToken);

                if (!alive) {
                    return;
                }

                if (response) {
                    setAccessToken(response.access_token);
                    setRefreshToken(response.refresh_token);
                } else {
                    clearRefreshToken();
                    setAccessToken(null);
                }
            } catch {
                if (alive) {
                    clearRefreshToken();
                    setAccessToken(null);
                }
            } finally {
                if (alive) {
                    setAuthReady(true);
                }
            }
        };

        void refreshBeforeRead();

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (!authReady) {
            return;
        }

        if (!getAccessToken() && !getRefreshToken()) {
            navigate("/auth/signin", { replace: true });
            return;
        }

        if (scope === "admin") {
            if (!currentUser) {
                return;
            }

            if (!isAdmin) {
                setLogs([]);
                return;
            }
        }

        if (scope === "my" && isAdmin && !currentUser?.sub) {
            return;
        }

        let alive = true;

        const loadLogs = async () => {
            const result = await getLogs(buildQuery(appliedFilters, scope, currentUser));

            if (!alive || !result) {
                return;
            }

            setLogs(result);
        };

        void loadLogs();

        return () => {
            alive = false;
        };
    }, [appliedFilters, authReady, currentUser, getLogs, isAdmin, navigate, scope]);

    const stats = useMemo(() => {
        return logs.reduce(
            (acc, log) => {
                acc[log.type] += 1;
                return acc;
            },
            { ...emptyLogStats } as Record<NonNullable<LogType>, number>,
        );
    }, [logs]);

    const title = scope === "admin" ? "Админ-панель" : "Моя страница";
    const subtitle =
        scope === "admin"
            ? "Все события системы без ограничения по пользователю"
            : isAdmin && currentUser?.sub
                ? `Логи аккаунта ${formatKey(currentUser.sub)}`
                : "События, связанные с вашим аккаунтом";

    const availableActions = getActionOptions(draftFilters.type);
    const currentPage = Math.floor(appliedFilters.offset / appliedFilters.limit) + 1;
    const hasNextPage = logs.length === appliedFilters.limit;
    const pageNumbers = useMemo(() => {
        const pages = new Set<number>([1, currentPage]);

        if (currentPage > 1) {
            pages.add(currentPage - 1);
        }

        if (currentPage > 2) {
            pages.add(currentPage - 2);
        }

        if (hasNextPage) {
            pages.add(currentPage + 1);
        }

        return Array.from(pages).sort((left, right) => left - right);
    }, [currentPage, hasNextPage]);

    const updateField = (field: keyof LogFilters, value: string | number) => {
        setDraftFilters((current) => ({ ...current, [field]: value }));
    };

    const updateType = (type: TypeFilter) => {
        setDraftFilters((current) => ({
            ...current,
            type,
            action: "",
        }));
    };

    const applyFilters = () => {
        setAppliedFilters({ ...draftFilters, offset: 0 });
    };

    const resetFilters = () => {
        setDraftFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
    };

    const applyType = (type: TypeFilter) => {
        const nextFilters: LogFilters = {
            ...draftFilters,
            type,
            action: "",
            offset: 0,
        };
        setDraftFilters(nextFilters);
        setAppliedFilters(nextFilters);
    };

    const previousPage = () => {
        setAppliedFilters((current) => ({
            ...current,
            offset: Math.max(0, current.offset - current.limit),
        }));
    };

    const nextPage = () => {
        setAppliedFilters((current) => ({
            ...current,
            offset: current.offset + current.limit,
        }));
    };

    const goToPage = (page: number) => {
        setAppliedFilters((current) => ({
            ...current,
            offset: (page - 1) * current.limit,
        }));
    };

    const updateLimit = (limit: number) => {
        const nextLimit = Math.max(1, Math.floor(limit));

        setDraftFilters((current) => ({
            ...current,
            limit: nextLimit,
            offset: 0,
        }));
        setAppliedFilters((current) => ({
            ...current,
            limit: nextLimit,
            offset: 0,
        }));
    };

    if (scope === "admin" && authReady && currentUser && !isAdmin) {
        return (
            <AccessDenied
                onOpenNotes={() => navigate("/notes/new")}
                onOpenMyPage={() => navigate("/logs/my")}
            />
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#fafafa] text-foreground">
            <Header
                title={title}
                buttons={[
                    {
                        title: "Мои заметки",
                        onClick: () => navigate("/notes/new"),
                        variant: "outline",
                    },
                    ...(scope === "admin"
                        ? [
                            {
                                title: "Моя страница",
                                onClick: () => navigate("/logs/my"),
                                variant: "secondary" as const,
                            },
                        ]
                        : []),
                    ...(scope === "my" && isAdmin
                        ? [
                            {
                                title: "Админ-панель",
                                onClick: () => navigate("/admin/logs"),
                                variant: "secondary" as const,
                            },
                        ]
                        : []),
                ]}
            />

            <main className="min-h-0 flex-1 overflow-y-auto">
                <LogsFiltersPanel
                    title={title}
                    subtitle={subtitle}
                    scope={scope}
                    filters={draftFilters}
                    stats={stats}
                    loading={loading}
                    availableActions={availableActions}
                    onApply={applyFilters}
                    onReset={resetFilters}
                    onApplyType={applyType}
                    onUpdateField={updateField}
                    onUpdateType={updateType}
                />

                <LogsResults
                    logs={logs}
                    loading={loading}
                    error={error}
                    currentPage={currentPage}
                    pageNumbers={pageNumbers}
                    hasNextPage={hasNextPage}
                    limit={appliedFilters.limit}
                    offset={appliedFilters.offset}
                    onGoToPage={goToPage}
                    onLimitChange={updateLimit}
                    onPreviousPage={previousPage}
                    onNextPage={nextPage}
                />
            </main>
        </div>
    );
}
