import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllDiagnosticReportsByTechnician, startDiagnosticReport } from '../services/diagnosticService';
import { Link, useNavigate } from 'react-router-dom';
import { FaTasks, FaChevronLeft, FaChevronRight, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    'ASIGNADO': 'bg-gray-500',
    'PENDIENTE': 'bg-orange-500',
    'TERMINADO': 'bg-green-500',
};

function BandejaTecnico() {
    const { currentUser, loading } = useAuth();
    const [allTechReports, setAllTechReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const navigate = useNavigate();

    const canView = currentUser && ['SUPERADMIN', 'ADMIN', 'SUPERUSER', 'USER'].includes(currentUser.rol);

    useEffect(() => {
        if (!loading && currentUser && canView) {
            fetchReports();
        }
    }, [loading, currentUser]);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const userReports = await getAllDiagnosticReportsByTechnician(currentUser.uid);
            setAllTechReports(userReports);
        } catch (error) {
            toast.error('Error al cargar los informes técnicos');
        }
        setIsLoading(false);
    };

    const handleStartTask = async (e, reportId, currentStatus, isActualTech) => {
        e.preventDefault(); // Prevent default Link behavior

        if (currentStatus === 'ASIGNADO' && isActualTech) {
            const started = await startDiagnosticReport(reportId);
            if (started) {
                toast.success('Tarea iniciada. Estado actualizado a PENDIENTE.');
                // No need to fetchReports here as we are navigating away
            } else {
                // If it failed or was already updated, just notify, but we still navigate
                // toast('El estado ya fue actualizado o no pudo ser cambiado.', { icon: 'ℹ️' });
            }
        }

        navigate(`/bandeja-tecnico/${reportId}`);
    };

    const filteredReports = useMemo(() => {
        const reportsFilteredByTaskLogic = allTechReports
            .map(report => {
                const isActualTech = report.tecnicoActualId === currentUser.uid;
                const isResponsibleTech = report.tecnicoResponsableId === currentUser.uid;

                // Solo mostrar si el estado no es TERMINADO o ENTREGADO
                if (report.estado === 'TERMINADO' || report.estado === 'ENTREGADO') {
                    return null;
                }

                // Si el usuario es el Tecnico Actual o Responsable, incluimos el reporte.
                if (isActualTech || isResponsibleTech) {
                    const taskState = report.estado;
                    return { ...report, isActualTech, isResponsibleTech, taskState };
                }

                return null;
            })
            .filter(report => report !== null);

        if (!searchTerm) {
            return reportsFilteredByTaskLogic;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        return reportsFilteredByTaskLogic.filter(report =>
            String(report.reportNumber).toLowerCase().includes(lowerCaseSearch) ||
            report.clientName.toLowerCase().includes(lowerCaseSearch) ||
            report.tipoEquipo.toLowerCase().includes(lowerCaseSearch) ||
            report.area.toLowerCase().includes(lowerCaseSearch) ||
            String(report.taskState || report.estado).toLowerCase().includes(lowerCaseSearch)
        );
    }, [allTechReports, searchTerm, currentUser]);

    const totalPages = Math.ceil(filteredReports.length / pageSize);

    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredReports.slice(startIndex, startIndex + pageSize);
    }, [filteredReports, currentPage, pageSize]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleViewReport = (report) => {
        navigate(`/bandeja-tecnico/historial/${report.id}`);
    };

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
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

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por N° Informe, Cliente, Equipo o Área..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">N° Informe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha Ingreso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Equipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Marca / Modelo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tecnico Asignado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Área</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Estado Tarea</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedReports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">{report.reportNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.fecha} {report.hora}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tipoEquipo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.marca} / {report.modelo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tecnicoActual}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.area}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${STATUS_COLORS[report.taskState || report.estado]}`}>
                                        {report.taskState || report.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center space-x-4">
                                        <a href={`/bandeja-tecnico/${report.id}`}
                                            onClick={(e) => handleStartTask(e, report.id, report.estado, report.tecnicoActualId === currentUser.uid)}
                                            className="text-blue-500 hover:text-blue-700"
                                            title="Ver y Atender"
                                        >
                                            <FaTasks />
                                        </a>
                                        <button onClick={() => handleViewReport(report)} className="text-blue-500 hover:text-blue-700" title="Ver informe"><FaEye /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {paginatedReports.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                        {filteredReports.length === 0 && searchTerm
                            ? 'No se encontraron tareas pendientes con el término de búsqueda.'
                            : 'No hay tareas pendientes asignadas.'
                        }
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    Página {currentPage} de {totalPages} ({filteredReports.length} resultados)
                </span>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        <FaChevronLeft />
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        < FaChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BandejaTecnico;