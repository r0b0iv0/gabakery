import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            await login(email, password);
            navigate("/");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Невалиден имейл или парола."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-header">
                    <div className="auth-logo">GaBakery</div>

                    <div className="auth-decoration" />

                    <h1 className="auth-title">
                        Добре дошли отново!
                    </h1>

                    <p className="auth-subtitle">
                        Влезте в профила си, за да продължите.
                    </p>
                </div>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <div className="auth-field">
                        <label htmlFor="login-email">
                            Имейл
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="login-password">
                            Парола
                        </label>

                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="auth-error" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        className="auth-submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Влизане..." : "Вход"}
                    </button>
                </form>

                <div className="auth-footer">
                    Нямате профил?{" "}
                    <a href="/register">
                        Регистрирайте се
                    </a>

                    <div>
                        <Link to="/forgot-password">
                            Забравена парола?
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
