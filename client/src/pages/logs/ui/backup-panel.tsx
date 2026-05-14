import { useRef, useState } from "react";
import { DatabaseBackup, Download, Loader2, Upload } from "lucide-react";

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

export function BackupPanel() {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [busy, setBusy] = useState<"export" | "import" | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const downloadBackup = async () => {
        setBusy("export");
        setMessage(null);
        setError(null);

        try {
            const response = await backupProxy.exportBackup();
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement("a");

            link.href = url;
            link.download = getBackupFilename(
                response.headers["content-disposition"],
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setMessage("Backup скачан");
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

        try {
            await backupProxy.importBackup(file);
            setMessage(`Backup "${file.name}" загружен`);
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
        </section>
    );
}
