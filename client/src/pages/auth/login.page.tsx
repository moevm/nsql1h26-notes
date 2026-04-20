import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/user/hooks/use-auth";
import { getRefreshToken } from "@/shared/lib/token-storage";

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, refresh, loading, error } = useAuth();
        const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (!getRefreshToken()) return;

        void refresh().then((response) => {
            if (response) {
                navigate("/notes/new", { replace: true });
            }
        });
    }, [navigate, refresh]);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const response = await login({ username, password });
        if (response) {
            navigate("/notes/new", { replace: true });
        }
    }

    return (
        <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
            <form className="w-full space-y-4 rounded-md border p-6" onSubmit={onSubmit}>
                <h1 className="text-2xl font-semibold">Вход</h1>
                <input className="w-full rounded-md border px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Имя пользователя" />
                <input className="w-full rounded-md border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" type="password" />
                {error ? <p className="text-sm text-red-500">{error}</p> : null}
                <div className="flex gap-3">
                    <button className="rounded-md border px-4 py-2" type="submit" disabled={loading}>
                        {loading ? "..." : "Войти"}
                    </button>
                    <button className="rounded-md border px-4 py-2" type="button" onClick={() => navigate("/auth/signup")}>
                        Регистрация
                    </button>
                </div>
            </form>
        </div>
    );
}
