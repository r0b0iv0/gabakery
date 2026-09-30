import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import './ForgotPasswordPage.css';

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();

    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!token) {
            setError('Невалиден линк за възстановяване.');
            return;
        }

        if (!password || !confirmPassword) {
            setError('Попълнете всички полета.');
            return;
        }

        if (password.length < 6) {
            setError('Паролата трябва да бъде поне 6 символа.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Паролите не съвпадат.');
            return;
        }

        try {
            setError('');
            setMessage('');
            setLoading(true);

            const result = await api.resetPassword(
                token,
                password
            );

            setMessage(result.message);

            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Възникна грешка.'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="page reset-password-page">
            <div className="auth-card">
                <h1>Нова парола</h1>

                <p className="subtitle">
                    Въведете новата си парола.
                </p>

                {error && (
                    <div className="error-banner">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="success-banner">
                        {message}
                    </div>
                )}

                {!message && (
                    <form onSubmit={handleSubmit}>
                        <label className="field-label">
                            Нова парола
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />

                        <label className="field-label">
                            Повторете паролата
                        </label>

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e =>
                                setConfirmPassword(e.target.value)
                            }
                        />

                        <div className="actions">
                            <button
                                type="submit"
                                className="primary"
                                disabled={loading}
                            >
                                {loading
                                    ? 'Променяне...'
                                    : 'Промени паролата'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="auth-footer">
                    <Link to="/login">
                        ← Към вход
                    </Link>
                </div>
            </div>
        </div>
    );

}

