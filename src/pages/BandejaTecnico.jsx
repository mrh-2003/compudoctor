import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllDiagnosticReportsByTechnician } from '../services/diagnosticService';
import { Link } from 'react-router-dom';
import { FaTasks } from 'react-icons/fa';
import toast from 'react-hot-toast';

function BandejaTecnico() {
    const { currentUser, loading } = useAuth();
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const canView = currentUser && ['SUPERADMIN', 'ADMIN', 'SUPERUSER', 'USER'].includes(currentUser.rol);

    useEffect(() => {
        if (!loading && currentUser && canView) {
            fetchReports();
        }
    }, [loading, currentUser]);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const userReports = await getAllDiagnosticReportsByTechnician(currentUser.nombre);
            console.log(userReports);
            
            const pendingReports = userReports.filter(report => report.estado === 'PENDIENTE' || report.estado === 'EN PROGRESO');
            setReports(pendingReports);
        } catch (error) {
            toast.error('Error al cargar los informes técnicos');
        }
        setIsLoading(false);
    };

    if (loading) {
        return <div className="text-center p-8">Cargando autenticación...</div>;
    }

    if (!canView) {
        return <div className="text-center p-8 text-red-500">No tienes permiso para ver este módulo.</div>;
    }

    if (isLoading) return <div className="text-center p-8">Cargando informes...</div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Bandeja de Tareas Pendientes</h1>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">N° Informe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha Ingreso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Equipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Área</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">{report.reportNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.fecha}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tipoEquipo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.area}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center space-x-4">
                                        <Link to={`/bandeja-tecnico/${report.id}`} className="text-blue-500 hover:text-blue-700" title="Ver y Atender"><FaTasks /></Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {reports.length === 0 && (
                    <div className="p-4 text-center text-gray-500">No hay tareas pendientes asignadas.</div>
                )}
            </div>
        </div>
    );
}

export default BandejaTecnico;