import { useRef, useState } from "react";
import {
    CheckCircle2,
    DatabaseBackup,
    Download,
    Loader2,
    Upload,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { backupProxy } from "@/entities/backup/api/proxy";
import { getErrorMessage } from "@/shared/api/error";

function getBackupFilename(contentDisposition?: string) {
    const match = contentDisposition?.match(/filename="?([^"]+)"?/i);

    if (match?.[1]) {
        return match[1];
    }

    return `backup-${new Date().toISOString().slice(0, 10)}.json`;
}

type BackupSummary = {
    action: "download" | "upload";
    filename: string;
    counts: {
        name: string;
        count: number;
    }[];
};

function getCollectionCounts(raw: unknown): BackupSummary["counts"] {
    if (!raw || typeof raw !== "object" || !("collections" in raw)) {
        return [];
    }

    const collections = (raw as { collections?: unknown }).collections;

    if (!collections || typeof collections !== "object") {
        return [];
    }

    return Object.entries(collections)
        .filter(([, value]) => Array.isArray(value))
        .map(([name, value]) => ({
            name,
            count: value.length,
        }));
}

async function readFileSummary(file: File): Promise<BackupSummary> {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;

    return {
        action: "upload",
        filename: file.name,
        counts: getCollectionCounts(parsed),
    };
}

async function readBlobSummary(
    blob: Blob,
    filename: string,
): Promise<BackupSummary> {
    const text = await blob.text();
    const parsed = JSON.parse(text) as unknown;

    return {
        action: "download",
        filename,
        counts: getCollectionCounts(parsed),
    };
}

function BackupSummaryModal({
    summary,
    onClose,
}: {
    summary: BackupSummary;
    onClose: () => void;
}) {
    const title =
        summary.action === "upload"
            ? `Backup "${summary.filename}" загружен`
            : `Backup "${summary.filename}" скачан`;
    const description =
        summary.action === "upload"
            ? "Загруженные элементы"
            : "Скачанные элементы";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="backup-summary-title"
        >
            <div className="w-full max-w-md rounded-md border border-black/10 bg-white p-5 shadow-lg">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <div className="min-w-0">
                            <h2
                                id="backup-summary-title"
                                className="break-words text-base font-semibold"
                            >
                                {title}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {summary.counts.length ? (
                    <dl className="mt-4 divide-y divide-black/10 rounded-md border border-black/10">
                        {summary.counts.map((item) => (
                            <div
                                key={item.name}
                                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                            >
                                <dt className="font-mono text-muted-foreground">
                                    {item.name}
                                </dt>
                                <dd className="font-semibold">{item.count}</dd>
                            </div>
                        ))}
                    </dl>
                ) : (
                    <p className="mt-4 rounded-md border border-black/10 bg-black/[0.03] px-3 py-2 text-sm text-muted-foreground">
                        В файле не найден блок collections.
                    </p>
                )}

                <div className="mt-5 flex justify-end">
                    <Button type="button" onClick={onClose}>
                        Ок
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function BackupPanel() {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [busy, setBusy] = useState<"export" | "import" | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<BackupSummary | null>(null);

    const downloadBackup = async () => {
        setBusy("export");
        setMessage(null);
        setError(null);
        setSummary(null);

        try {
            const response = await backupProxy.exportBackup();
            const filename = getBackupFilename(
                response.headers["content-disposition"],
            );
            const backupSummary = await readBlobSummary(response.data, filename);
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement("a");

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setMessage("Backup скачан");
            setSummary(backupSummary);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setBusy(null);
        }
    };

    const uploadBackup = async (file: File | undefined) => {
        if (!file) {
            return;
        }

        setBusy("import");
        setMessage(null);
        setError(null);
        setSummary(null);

        try {
            const backupSummary = await readFileSummary(file);
            await backupProxy.importBackup(file);
            setMessage(`Backup "${backupSummary.filename}" загружен`);
            setSummary(backupSummary);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setBusy(null);
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    return (
        <section className="border-b border-black/5 bg-[#fafafa] px-6 py-5">
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 rounded-md border border-black/10 bg-white px-5 py-4 shadow-sm">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <DatabaseBackup className="h-4 w-4" />
                        Backup базы данных
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Экспорт и импорт полного JSON backup-а доступны только
                        админу.
                    </p>
                    {message ? (
                        <p className="mt-2 text-sm text-emerald-700">
                            {message}
                        </p>
                    ) : null}
                    {error ? (
                        <p className="mt-2 text-sm text-destructive">{error}</p>
                    ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void downloadBackup()}
                        disabled={busy !== null}
                    >
                        {busy === "export" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        Скачать
                    </Button>
                    <Button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy !== null}
                    >
                        {busy === "import" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4" />
                        )}
                        Загрузить
                    </Button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={(event) =>
                            void uploadBackup(event.target.files?.[0])
                        }
                    />
                </div>
            </div>

            {summary ? (
                <BackupSummaryModal
                    summary={summary}
                    onClose={() => setSummary(null)}
                />
            ) : null}
        </section>
    );
}
