import { ShieldCheck } from "lucide-react";

import { Header } from "@/shared/layout/Header";

interface AccessDeniedProps {
    onOpenNotes: () => void;
    onOpenMyPage: () => void;
}

export function AccessDenied({ onOpenNotes, onOpenMyPage }: AccessDeniedProps) {
    return (
        <div className="flex min-h-screen flex-col bg-[#fafafa]">
            <Header
                title="Админ-панель"
                buttons={[
                    {
                        title: "Мои заметки",
                        onClick: onOpenNotes,
                        variant: "outline",
                    },
                    {
                        title: "Моя страница",
                        onClick: onOpenMyPage,
                        variant: "secondary",
                    },
                ]}
            />
            <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-6">
                <div className="rounded-md border border-black/10 bg-white p-6">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground" />
                    <h1 className="mt-4 text-xl font-semibold">Недостаточно прав</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Этот раздел доступен только пользователям с ролью Admin.
                    </p>
                </div>
            </main>
        </div>
    );
}
