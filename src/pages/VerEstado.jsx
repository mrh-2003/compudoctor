import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllDiagnosticReports, deleteDiagnosticReport } from '../services/diagnosticService';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Modal from '../components/common/Modal';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    'PENDIENTE': 'bg-gray-400',
    'EN PROGRESO': 'bg-blue-400',
    'ENTREGADO': 'bg-green-500',
};

function VerEstado() {
    const { currentUser, loading } = useAuth();
    const [reports, setReports] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [filters, setFilters] = useState({
        reportNumber: '',
        clientName: '',
        tipoEquipo: '',
        tecnicoResponsable: '',
        estado: '',
    });

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
            setReports(allReports);
        } catch (error) {
            toast.error('Error al cargar los informes técnicos');
        }
        setIsLoading(false);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const filtered = allReports.filter(report => {
            const matchesReportNumber = report.reportNumber?.toString().includes(filters.reportNumber);
            const matchesClientName = report.clientName?.toLowerCase().includes(filters.clientName.toLowerCase());
            const matchesTipoEquipo = report.tipoEquipo?.toLowerCase().includes(filters.tipoEquipo.toLowerCase());
            const matchesTecnico = report.tecnicoResponsable?.toLowerCase().includes(filters.tecnicoResponsable.toLowerCase());
            const matchesEstado = report.estado?.toLowerCase().includes(filters.estado.toLowerCase());
            return matchesReportNumber && matchesClientName && matchesTipoEquipo && matchesTecnico && matchesEstado;
        });
        setReports(filtered);
    }, [filters, allReports]);

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
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            {notification.message && <Notification message={notification.message} type={notification.type} />}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Estado de Reparaciones</h1>
            </div>
            
            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <input type="text" name="reportNumber" placeholder="Filtrar por N° Informe" value={filters.reportNumber} onChange={handleFilterChange} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" name="clientName" placeholder="Filtrar por Cliente" value={filters.clientName} onChange={handleFilterChange} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" name="tipoEquipo" placeholder="Filtrar por Equipo" value={filters.tipoEquipo} onChange={handleFilterChange} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                <input type="text" name="tecnicoResponsable" placeholder="Filtrar por Técnico" value={filters.tecnicoResponsable} onChange={handleFilterChange} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                <select name="estado" value={filters.estado} onChange={handleFilterChange} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="">Todos los estados</option>
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="EN PROGRESO">EN PROGRESO</option>
                    <option value="ENTREGADO">ENTREGADO</option>
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
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Técnico Resp.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Área</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Monto Servicio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Diagnóstico</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">A Cuenta</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Saldo</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reports.map((report) => (
                            <tr key={report.id} className={report.hasAdditionalServices ? 'bg-yellow-100 dark:bg-yellow-800' : 'bg-blue-100 dark:bg-blue-800'}>
                                <td className="px-6 py-4 whitespace-nowrap">{report.reportNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.fecha}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.telefono || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tipoEquipo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.marca} - {report.modelo}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.motivoIngreso}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.tecnicoResponsable}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{report.area}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${STATUS_COLORS[report.estado]}`}>
                                        {report.estado}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">S/ {report.montoServicio ? report.montoServicio.toFixed(2) : '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">S/ {report.diagnostico ? report.diagnostico.toFixed(2) : '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">S/ {report.aCuenta ? report.aCuenta.toFixed(2) : '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">S/ {report.saldo ? report.saldo.toFixed(2) : '0.00'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center space-x-4">
                                        {canEdit && <Link to={`/diagnostico/${report.id}`} className="text-yellow-500 hover:text-yellow-700" title="Editar"><FaEdit /></Link>}
                                        {canDelete && <button onClick={() => handleDeleteRequest(report)} className="text-red-500 hover:text-red-700" title="Eliminar"><FaTrash /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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