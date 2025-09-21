import React from 'react';
import { Link } from 'react-router-dom';

function PermissionDenied() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h1 className="text-4xl font-bold text-red-500 mb-4">Acceso Denegado</h1>
            <p className="text-lg mb-8">No tienes los permisos necesarios para ver esta página.</p>
            <Link to="/" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
                Volver al Inicio
            </Link>
        </div>
    );
}

export default PermissionDenied;