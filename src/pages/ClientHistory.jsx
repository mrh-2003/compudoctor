import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaFileAlt, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Asumiendo la existencia y la ubicación de estas funciones de servicio
import { getClientById } from '../services/clientService'; 
import { getAllDiagnosticReportsByClientId } from '../services/diagnosticService';

const STATUS_COLORS = {
    'PENDIENTE': 'bg-gray-400',
    'ASIGNADO': 'bg-blue-400',
    'TERMINADO': 'bg-orange-500',
    'ENTREGADO': 'bg-green-500',
};

function ClientHistory() {
    const { clientId } = useParams();
    const [client, setClient] = useState(null);
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        if (clientId) {
            fetchClientData();
        }
    }, [clientId]);

    const fetchClientData = async () => {
        setIsLoading(true);
        try { 
            const clientData = await getClientById(clientId);
            
            setClient(clientData); 
            const reportsData = await getAllDiagnosticReportsByClientId(clientId); 
            setReports(reportsData);

        } catch (error) {
            toast.error('Error al cargar el historial del cliente.');
            setClient(null);
            setReports([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredReports = useMemo(() => {
        if (!searchTerm) {
            return reports;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        return reports.filter(report =>
            String(report.reportNumber).toLowerCase().includes(lowerCaseSearch) ||
            report.tipoEquipo.toLowerCase().includes(lowerCaseSearch) ||
            report.marca.toLowerCase().includes(lowerCaseSearch) ||
            report.modelo.toLowerCase().includes(lowerCaseSearch) ||
            report.area.toLowerCase().includes(lowerCaseSearch) ||
            report.estado.toLowerCase().includes(lowerCaseSearch)
        );
    }, [reports, searchTerm]);

    const totalPages = Math.ceil(filteredReports.length / pageSize);

    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredReports.slice(startIndex, startIndex + pageSize);
    }, [filteredReports, currentPage, pageSize]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    if (isLoading) {
        return <div className="text-center p-8">Cargando historial del cliente...</div>;
    }

    if (!client) {
        return <div className="text-center p-8 text-red-500">Cliente no encontrado.</div>;
    }
    
    const isJuridica = client.tipoPersona === 'JURIDICA';
    const contactName = `${client.nombre || ''} ${client.apellido || ''}`.trim();

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <div className="flex items-center mb-6">
                <Link to="/clientes" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mr-4" title="Volver a Clientes">
                    <FaArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold">Historial de Atenciones</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 mb-6">
                <h2 className="text-xl font-semibold text-blue-500 mb-4">Datos del Cliente</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <p><strong>Tipo de Persona:</strong> {isJuridica ? 'Jurídica (Empresa)' : 'Natural'}</p>
                    
                    {isJuridica ? (
                        <>
                            <p className='col-span-full'><strong>RUC / Razón Social:</strong> {client.ruc || 'N/A'} / {client.razonSocial || 'N/A'}</p>
                            <p><strong>Nombre de Contacto:</strong> {contactName || 'N/A'}</p>
                            <p><strong>Teléfono de Contacto:</strong> {client.telefono || 'N/A'}</p>
                        </>
                    ) : (
                        <>
                            <p><strong>Nombre Completo:</strong> {contactName || 'N/A'}</p> 
                            <p><strong>Teléfono:</strong> {client.telefono || 'N/A'}</p>
                        </>
                    )}
                    <p><strong>Email:</strong> {client.correo || 'N/A'}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
                <h2 className="text-xl font-semibold text-purple-500 mb-4">Informes Técnicos ({reports.length})</h2>
                
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por N° Informe, Equipo, Marca, Modelo o Estado..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>

                <div className="overflow-x-auto shadow-sm rounded-lg">
                    <table className="min-w-full table-auto">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">N° Informe</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha Ingreso</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Equipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Marca/Modelo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Motivo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedReports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">{report.reportNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{report.fecha} {report.hora}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{report.tipoEquipo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{report.marca} / {report.modelo}</td>
                                    <td className="px-6 py-4 truncate max-w-xs">{report.motivoIngreso}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${STATUS_COLORS[report.estado] || 'bg-red-500'}`}>
                                            {report.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <Link to={`/ver-estado/historial/${report.id}`} className="text-blue-500 hover:text-blue-700" title="Ver Historial Detallado">
                                            <FaEye className="inline" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginatedReports.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                            {reports.length === 0 
                                ? 'Este cliente no tiene informes técnicos registrados.'
                                : 'No se encontraron informes que coincidan con la búsqueda.'
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
                            Anterior
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClientHistory;