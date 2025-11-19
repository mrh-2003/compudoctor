import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllDiagnosticReports, deleteDiagnosticReport } from '../services/diagnosticService';
import { FaEdit, FaTrash, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Modal from '../components/common/Modal';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    'PENDIENTE': 'bg-gray-400',
    'ASIGNADO': 'bg-blue-400',
    'ENTREGADO': 'bg-green-500',
    'TERMINADO': 'bg-orange-500',
};

function VerEstado() {
    const { currentUser, loading } = useAuth();
    const [allReports, setAllReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [filters, setFilters] = useState({
        generalSearch: '',
        estado: '',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const canEdit = currentUser && (currentUser.rol === 'SUPERADMIN' || currentUser.rol === 'ADMIN');
    const canDelete = currentUser && currentUser.rol === 'SUPERADMIN';
    const canView = currentUser && ['SUPERADMIN', 'ADMIN', 'SUPERUSER', 'USER'].includes(currentUser.rol);

    useEffect(() => {
        if (!loading && currentUser && canView) {
            fetchReports();
        }
    }, [loading, currentUser]);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const allReports = await getAllDiagnosticReports();
            setAllReports(allReports);
        } catch (error) {
            toast.error('Error al cargar los informes técnicos');
        }
        setIsLoading(false);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const filteredReports = useMemo(() => {
        return allReports.filter(report => {
            const generalMatch = Object.values(report).some(value => 
                String(value).toLowerCase().includes(filters.generalSearch.toLowerCase())
            );
            const statusMatch = filters.estado ? report.estado?.toLowerCase() === filters.estado.toLowerCase() : true;
            return generalMatch && statusMatch;
        });
    }, [filters, allReports]);

    const totalPages = Math.ceil(filteredReports.length / pageSize);

    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredReports.slice(startIndex, startIndex + pageSize);
    }, [filteredReports, currentPage, pageSize]);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handleDeleteRequest = (report) => {
        setConfirmation({
            isOpen: true,
            title: 'Eliminar Informe',
            message: `¿Estás seguro de que quieres eliminar el informe técnico N° ${report.reportNumber}? Esta acción es irreversible.`,
            onConfirm: () => handleDeleteReport(report.id),
        });
    };

    const handleDeleteReport = async (reportId) => {
        try {
            await deleteDiagnosticReport(reportId);
            toast.success('Informe eliminado correctamente');
            fetchReports();
        } catch (error) {
            toast.error('Error al eliminar el informe.');
        }
        setConfirmation({ isOpen: false });
    };

    if (loading) {
        return <div className="text-center p-8">Cargando autenticación...</div>;
    }

    if (!canView) {
        return <div className="text-center p-8 text-red-500">No tienes permiso para ver este módulo.</div>;
    }

    if (isLoading) return <div className="text-center p-8">Cargando informes...</div>;

    return (
        <div className="p-4 sm:p-6 md:p-8">
            {notification.message && <Notification message={notification.message} type={notification.type} />}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Estado de Reparaciones</h1>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                    type="text" 
                    name="generalSearch" 
                    placeholder="Buscar en todas las columnas..." 
                    value={filters.generalSearch} 
                    onChange={handleFilterChange} 
                    className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 col-span-2" 
                />
                <select 
                    name="estado" 
                    value={filters.estado} 
                    onChange={handleFilterChange} 
                    className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="ASIGNADO">ASIGNADO</option>
                    <option value="ENTREGADO">ENTREGADO</option>
                    <option value="TERMINADO">TERMINADO</option>
                </select>
            </div>


            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <div className="p-4 flex items-center space-x-4 text-sm font-semibold">
                    <span className="flex items-center">
                        <span className="h-4 w-4 bg-yellow-100 dark:bg-yellow-800 border dark:border-yellow-600 block rounded-full mr-2"></span>
                        Servicio con Adicionales
                    </span>
                    <span className="flex items-center">
                        <span className="h-4 w-4 bg-blue-100 dark:bg-blue-800 border dark:border-blue-600 block rounded-full mr-2"></span>
                        Servicio Común
                    </span>
                </div>
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">N° Informe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha Ingreso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Celular</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Equipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Marca-Modelo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Motivo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Técnico Recep.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Técnico Test.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Técnico Resp.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Área</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Casilla</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Monto Servicio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">A Cuenta</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Saldo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha Entrega</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Observaciones</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedReports.map((report) => (
                            <tr key={report.id} className={report.hasAdditionalServices ? 'bg-yellow-100 dark:bg-yellow-800' : 'bg-blue-100 dark:bg-blue-800'}>
                                <td className="px-6 py-4 whitespace-nowrap">{report.reportNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.fecha} {report.hora}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.telefono || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tipoEquipo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.marca} - {report.modelo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.motivoIngreso}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tecnicoRecepcion}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tecnicoTesteo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tecnicoResponsable}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.area}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${STATUS_COLORS[report.estado]}`}>
                                        {report.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.ubicacionFisica}</td>
                                <td className="px-6 py-4 whitespace-nowrap">S/ {report.montoServicio ? report.montoServicio.toFixed(2) : '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">S/ {report.aCuenta ? report.aCuenta.toFixed(2) : '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">S/ {report.saldo ? report.saldo.toFixed(2) : '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.fechaEntrega} {report.horaEntrega}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.observaciones}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center space-x-4">
                                        <Link to={`/ver-estado/historial/${report.id}`} className="text-blue-500 hover:text-blue-700" title="Ver historial"><FaEye /></Link>
                                        {canEdit && <Link to={`/diagnostico/${report.id}`} className="text-yellow-500 hover:text-yellow-700" title="Editar"><FaEdit /></Link>}
                                        {canDelete && <button onClick={() => handleDeleteRequest(report)} className="text-red-500 hover:text-red-700" title="Eliminar"><FaTrash /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {paginatedReports.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                        {filteredReports.length === 0 && filters.generalSearch
                            ? 'No se encontraron informes con el término de búsqueda.'
                            : 'No hay informes para mostrar.'
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
                        <FaChevronRight />
                    </button>
                </div>
            </div>

            {confirmation.isOpen && (
                <ConfirmationModal
                    title={confirmation.title}
                    message={confirmation.message}
                    onConfirm={confirmation.onConfirm}
                    onCancel={() => setConfirmation({ isOpen: false })}
                />
            )}
        </div>
    );
}

function ConfirmationModal({ title, message, onConfirm, onCancel }) {
    return (
        <Modal onClose={onCancel}>
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <p className="mb-6">{message}</p>
                <div className="flex justify-end space-x-2">
                    <button onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Confirmar</button>
                </div>
            </div>
        </Modal>
    );
}
function Notification({ message, type }) {
    const baseStyle = "p-4 rounded-md fixed top-5 right-5 text-white z-50 shadow-lg";
    const typeStyle = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return <div className={`${baseStyle} ${typeStyle}`}>{message}</div>;
}
export default VerEstado;