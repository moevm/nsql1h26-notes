import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { logsProxy } from "@/entities/logs/api/proxy";
import type { Log } from "@/entities/logs/types/responses";
import { getErrorMessage } from "@/shared/api/error";
import { Header } from "@/shared/layout/Header";
import { LogCard } from "@/pages/logs/ui/log-card";

export function LogPage() {
    const navigate = useNavigate();
    const { logKey } = useParams();
    const [log, setLog] = useState<Log | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!logKey) {
            setError("Некорректный лог");
            setLoading(false);
            return;
        }

        let alive = true;

        const loadLog = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await logsProxy.getLog(logKey);

                if (alive) {
                    setLog(response);
                }
            } catch (err) {
                if (alive) {
                    setError(getErrorMessage(err));
                    setLog(null);
                }
            } finally {
                if (alive) {
                    setLoading(false);
                }
            }
        };

        void loadLog();

        return () => {
            alive = false;
        };
    }, [logKey]);

    return (
        <div className="flex min-h-screen flex-col bg-[#fafafa] text-foreground">
            <Header
                title="Лог"
                buttons={[
                    {
                        title: "Назад к логам",
                        onClick: () => navigate(-1),
                        variant: "secondary",
                    },
                    {
                        title: "Мои заметки",
                        onClick: () => navigate("/notes/new"),
                        variant: "outline",
                    },
                ]}
            />

            <main className="mx-auto w-full max-w-5xl px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-black/10 bg-white p-8 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка лога...
                    </div>
                ) : error ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                        {error}
                    </div>
                ) : log ? (
                    <LogCard log={log} />
                ) : null}
            </main>
        </div>
    );
}
