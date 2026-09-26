import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

import { api } from '../api';
import type { User } from '../types';

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        email: string,
        password: string,
        name?: string
    ) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // This is the step #4 code
    useEffect(() => {
        api.getMe()
            .then(({ user }) => {
                setUser(user);
            })
            .catch(() => {
                setUser(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    async function login(email: string, password: string) {
        const { user } = await api.login(email, password);
        setUser(user);
    }

    async function register(
        email: string,
        password: string,
        name?: string
    ) {
        const { user } = await api.register(email, password, name);
        setUser(user);
    }

    async function logout() {
        await api.logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return context;
}
