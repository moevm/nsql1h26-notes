import { Activity, Loader2, RotateCcw, Search } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LogType } from "@/entities/logs/types/base";
import { cn } from "@/lib/utils";
import { actionLabels, typeLabels } from "@/pages/logs/ui/constants";
import type { ActionFilter, LogFilters, LogsPageScope, LogStats, TypeFilter } from "@/pages/logs/ui/types";

interface LogsFiltersPanelProps {
    title: string;
    subtitle: string;
    scope: LogsPageScope;
    filters: LogFilters;
    stats: LogStats;
    loading: boolean;
    availableActions: { value: ActionFilter; label: string }[];
    onApply: () => void;
    onReset: () => void;
    onApplyType: (type: TypeFilter) => void;
    onUpdateField: (field: keyof LogFilters, value: string | number) => void;
    onUpdateType: (type: TypeFilter) => void;
}

export function LogsFiltersPanel({
    title,
    subtitle,
    scope,
    filters,
    stats,
    loading,
    availableActions,
    onApply,
    onReset,
    onApplyType,
    onUpdateField,
    onUpdateType,
}: LogsFiltersPanelProps) {
    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onApply();
    };

    return (
        <section className="border-b border-black/5 bg-white px-6 py-6">
            <div className="mx-auto w-full max-w-7xl">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Activity className="h-4 w-4" />
                            Журнал событий
                        </div>
                        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {(["note", "permission", "registration"] as NonNullable<LogType>[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => onApplyType(type)}
                                className={cn(
                                    "min-w-24 rounded-md border px-3 py-2 text-left transition-colors",
                                    filters.type === type
                                        ? "border-black bg-black text-white"
                                        : "border-black/10 bg-white hover:bg-accent",
                                )}
                            >
                                <span className="block text-xs">{typeLabels[type]}</span>
                                <span className="mt-1 block text-lg font-semibold">{stats[type]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <form className="mt-6 grid gap-3" onSubmit={applyFilters}>
                    <div className="grid gap-3 lg:grid-cols-4">
                        <label className="relative lg:col-span-2">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={filters.search}
                                onChange={(event) => onUpdateField("search", event.target.value)}
                                placeholder="Поиск по типу, заголовку или содержимому"
                                className="pl-9"
                            />
                        </label>

                        <select
                            value={filters.type}
                            onChange={(event) => onUpdateType(event.target.value as TypeFilter)}
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Любой тип</option>
                            <option value="note">{typeLabels.note}</option>
                            <option value="permission">{typeLabels.permission}</option>
                            <option value="registration">{typeLabels.registration}</option>
                        </select>

                        <select
                            value={filters.action}
                            onChange={(event) => onUpdateField("action", event.target.value as ActionFilter)}
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">{actionLabels[""]}</option>
                            {availableActions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Input
                            value={filters.note_key}
                            onChange={(event) => onUpdateField("note_key", event.target.value)}
                            placeholder="note_key"
                        />
                        {scope === "admin" ? (
                            <Input
                                value={filters.target_user_key}
                                onChange={(event) => onUpdateField("target_user_key", event.target.value)}
                                placeholder="user_key"
                            />
                        ) : null}
                        <Input
                            value={filters.granted_by_key}
                            onChange={(event) => onUpdateField("granted_by_key", event.target.value)}
                            placeholder="granted_by_key"
                        />
                        <Input
                            value={filters.granted_to_key}
                            onChange={(event) => onUpdateField("granted_to_key", event.target.value)}
                            placeholder="granted_to_key"
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Input
                            type="datetime-local"
                            value={filters.from_date}
                            onChange={(event) => onUpdateField("from_date", event.target.value)}
                        />
                        <Input
                            type="datetime-local"
                            value={filters.to_date}
                            onChange={(event) => onUpdateField("to_date", event.target.value)}
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Применить
                        </Button>
                        <Button type="button" variant="outline" onClick={onReset}>
                            <RotateCcw className="h-4 w-4" />
                            Сбросить
                        </Button>
                    </div>
                </form>
            </div>
        </section>
    );
}
