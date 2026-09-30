import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './ForgotPasswordPage.css';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!email) {
            setError('Въведете имейл.');
            return;
        }

        try {
            setError('');
            setMessage('');
            setLoading(true);

            const result = await api.forgotPassword(email);

            setMessage(result.message);
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
        <div className="page forgot-password-page">
            <div className="auth-card">
                <h1>Забравена парола</h1>

                <p className="subtitle">
                    Въведете имейла, с който сте регистрирани.
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

                <form onSubmit={handleSubmit}>
                    <label className="field-label">
                        Имейл
                    </label>

                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="email@example.com"
                    />

                    <div className="actions">
                        <button
                            type="submit"
                            className="primary"
                            disabled={loading}
                        >
                            {loading
                                ? 'Изпращане...'
                                : 'Изпрати линк'}
                        </button>
                    </div>
                </form>

                <div className="auth-footer">
                    <Link to="/login">
                        ← Обратно към вход
                    </Link>
                </div>
            </div>
        </div>
    );
}