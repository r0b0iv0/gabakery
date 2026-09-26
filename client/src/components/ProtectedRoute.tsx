import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type ProtectedRouteProps = {
    allowedRoles: string[];
};

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user } = useAuth();

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
