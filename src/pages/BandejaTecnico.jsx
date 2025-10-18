import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllDiagnosticReportsByTechnician } from '../services/diagnosticService';
import { Link } from 'react-router-dom';
import { FaTasks } from 'react-icons/fa';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    'ASIGNADO': 'bg-gray-500',
    'PENDIENTE': 'bg-orange-500',
    'FINALIZADO': 'bg-green-500',
};

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
            // Filtramos por tecnicoActualId para obtener las tareas asignadas para MODIFICAR
            const userReports = await getAllDiagnosticReportsByTechnician(currentUser.uid);
            
            const reportsWithCurrentTaskState = userReports
                .map(report => {
                    const areaHistory = report.diagnosticoPorArea?.[report.area] || [];
                    
                    // Buscamos la última entrada en el área actual asignada a este técnico
                    const currentTask = areaHistory.findLast(
                        (entry) => entry.tecnicoId === currentUser.uid && entry.estado !== 'FINALIZADO' && entry.estado !== 'TERMINADO'
                    );

                    let taskState = report.estado;

                    if (currentTask) {
                        taskState = currentTask.estado;
                    } else if (report.tecnicoActualId === currentUser.uid && report.estado !== 'ENTREGADO') {
                        // Caso inicial o si se pierde el hilo, pero el reporte está actualmente asignado a él
                        taskState = report.diagnosticoPorArea[report.area]?.findLast(e => e.tecnicoId === currentUser.uid)?.estado || 'ASIGNADO';
                    } else {
                        // Si no es el tecnicoActual, no debe aparecer aquí.
                        return null;
                    }

                    // Solo mostramos reportes que están asignados para el técnico actual
                    if (taskState === 'PENDIENTE' || taskState === 'ASIGNADO') {
                        return { ...report, taskState };
                    }
                    return null;
                })
                .filter(report => report !== null);
                
            setReports(reportsWithCurrentTaskState);

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
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Técnico Actual</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Estado Tarea</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">{report.reportNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.fecha} {report.hora}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tipoEquipo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.area}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tecnicoActual}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${STATUS_COLORS[report.taskState || report.estado]}`}>
                                        {report.taskState || report.estado}
                                    </span>
                                </td>
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