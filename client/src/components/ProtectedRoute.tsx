import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type ProtectedRouteProps = {
    allowedRoles: string[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="page"><p>Зареждане...</p></div>;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
