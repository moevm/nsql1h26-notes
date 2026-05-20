import { useEffect } from "react";

const DEFAULT_TITLE = "NSQL Notes";

export function usePageTitle(title: string) {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = title ? `${title} · ${DEFAULT_TITLE}` : DEFAULT_TITLE;

        return () => {
            document.title = previousTitle;
        };
    }, [title]);
}
