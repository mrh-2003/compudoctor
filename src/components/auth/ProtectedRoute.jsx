import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children, allowedRoles, permissionId }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div className="text-center p-8">Verificando permisos...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.rol)) {
        return <Navigate to="/permission-denied" replace />;
    }

    if (permissionId && !currentUser.permissions?.includes(permissionId)) {
        return <Navigate to="/permission-denied" replace />;
    }

    return children;
}

export default ProtectedRoute;