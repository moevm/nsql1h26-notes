import type { MouseEvent } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

type UserLinkProps = {
    userKey?: string | null;
    username?: string | null;
    className?: string;
};

function formatKey(value?: string | null) {
    if (!value) {
        return "не указано";
    }

    return value.length > 18
        ? `${value.slice(0, 10)}...${value.slice(-6)}`
        : value;
}

export function UserLink({ userKey, username, className }: UserLinkProps) {
    const label = username || formatKey(userKey);

    if (!userKey) {
        return <span className={className}>{label}</span>;
    }

    const stopRowClick = (event: MouseEvent<HTMLAnchorElement>) => {
        event.stopPropagation();
    };

    return (
        <Link
            to={`/users/${userKey}`}
            onClick={stopRowClick}
            className={cn(
                "font-medium text-foreground underline decoration-black/20 underline-offset-4 hover:decoration-black/60",
                className,
            )}
            title={userKey}
        >
            {label}
        </Link>
    );
}
