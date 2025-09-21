import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div className="text-center p-8">Verificando permisos...</div>;
    }

    if (!currentUser || !allowedRoles.includes(currentUser.rol)) {
        return <Navigate to="/permission-denied" replace />;
    }

    return children;
}

export default ProtectedRoute;