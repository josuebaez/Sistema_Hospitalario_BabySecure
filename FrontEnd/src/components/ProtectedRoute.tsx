// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Array<'admin' | 'medico' | 'enfermero' | 'seguridad'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Cargando...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.rol)) {
        if (user.rol === 'admin') {
            return <Navigate to="/admin" />;
        } else if (user.rol === 'medico' || user.rol === 'enfermero') {
            return <Navigate to="/medical" />;
        }
        return <Navigate to="/" />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;