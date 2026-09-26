import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Auth.css";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await register(
                email,
                password,
                name || undefined
            );

            navigate("/");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Възникна грешка при регистрацията."
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
                        Създайте профил
                    </h1>

                    <p className="auth-subtitle">
                        Присъединете се към GaBakery и поръчвайте
                        любимите си сладки изкушения.
                    </p>
                </div>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <div className="auth-field">
                        <label htmlFor="register-name">
                            Име
                        </label>

                        <input
                            id="register-name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="Вашето име"
                            autoComplete="name"
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-email">
                            Имейл
                        </label>

                        <input
                            id="register-email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="your@email.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-password">
                            Парола
                        </label>

                        <input
                            id="register-password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Минимум 8 символа"
                            autoComplete="new-password"
                            minLength={8}
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
                        {loading
                            ? "Регистрация..."
                            : "Създай профил"}
                    </button>
                </form>

                <div className="auth-footer">
                    Вече имате профил?{" "}
                    <Link to="/login">
                        Влезте в него
                    </Link>
                </div>

            </div>
        </div>
    );
}
