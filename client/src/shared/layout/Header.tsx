import { FC } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
    title: string;
    buttons: {
        title: string;
        onClick: () => void;
        variant?: "default" | "secondary" | "outline" | "ghost";
    }[];
    className?: string;
}

export const Header: FC<HeaderProps> = ({ title, buttons, className }) => {
    return (
        <header
            className={cn(
                "flex min-h-14 items-center justify-between gap-3 border-b border-black/5 bg-white/90 px-6 py-2 text-foreground backdrop-blur",
                className,
            )}
        >
            <h1 className="min-w-0 truncate text-base font-semibold">{title}</h1>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {buttons.map((button, idx) => (
                    <Button
                        key={`header-button-${idx}`}
                        onClick={button.onClick}
                        size="sm"
                        variant={button.variant ?? "outline"}
                    >
                        {button.title}
                    </Button>
                ))}
            </div>
        </header>
    );
};
