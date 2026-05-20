import { usePageTitle } from "@/shared/hooks/use-page-title";

export const NotFoundPage = () => {
    usePageTitle("Страница не найдена");
    return <div className="flex min-h-screen items-center justify-center">Page not found</div>;
}