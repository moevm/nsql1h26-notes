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
                "flex h-14 items-center justify-between border-b border-black/5 bg-white/90 px-6 text-foreground backdrop-blur",
                className,
            )}
        >
            <h1 className="text-base font-semibold tracking-tight">{title}</h1>
            <div className="flex items-center gap-2">
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
