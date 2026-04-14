import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/user/hooks/use-auth";

export const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, loading, error } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const response = await register({
            username,
            password,
            confirm_password: confirmPassword,
        });

        if (response) {
            navigate("/", { replace: true });
        }
    }

    return (
        <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
            <form className="w-full space-y-4 rounded-md border p-6" onSubmit={onSubmit}>
                <h1 className="text-2xl font-semibold">Регистрация</h1>
                <input className="w-full rounded-md border px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Имя пользователя" />
                <input className="w-full rounded-md border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" type="password" />
                <input className="w-full rounded-md border px-3 py-2" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Подтвердите пароль" type="password" />
                {error ? <p className="text-sm text-red-500">{error}</p> : null}
                <button className="rounded-md border px-4 py-2" type="submit" disabled={loading}>
                    {loading ? "..." : "Создать аккаунт"}
                </button>
            </form>
        </div>
    );
}
