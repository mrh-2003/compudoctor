import React, { useState, useEffect } from 'react';
import { getLogs } from '../services/logService';
import { useAuth } from '../context/AuthContext';
import { FaEye, FaSearch, FaFilter } from 'react-icons/fa';
import Modal from '../components/common/Modal';

function Historial() {
    const { currentUser } = useAuth();
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredLogs(logs);
        } else {
            const lowerSearch = searchTerm.toLowerCase();
            setFilteredLogs(logs.filter(log =>
                (log.userEmail && log.userEmail.toLowerCase().includes(lowerSearch)) ||
                (log.summary && log.summary.toLowerCase().includes(lowerSearch)) ||
                (log.entityName && log.entityName.toLowerCase().includes(lowerSearch)) ||
                (log.action && log.action.toLowerCase().includes(lowerSearch))
            ));
        }
    }, [searchTerm, logs]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getLogs(500); // Retrieve last 500 logs
            setLogs(data);
            setFilteredLogs(data);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (log) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLog(null);
    };

    const KEY_LABELS = {
        id: "ID",
        otherDescription: "Otra Descripción",
        createdAt: "Fecha Creación",
        marca: "Marca",
        otherComponentType: "Otro Tipo",
        area: "Área Actual",
        estado: "Estado",
        diagnosticoPorArea: "Historial por Áreas",
        reportNumber: "N° Informe",
        serie: "Serie",
        saldo: "Saldo",
        servicesList: "Servicios",
        montoServicio: "Monto Servicios",
        telefono: "Teléfono",
        ubicacionFisica: "Ubicación",
        tecnicoActual: "Técnico Actual",
        diagnostico: "Costo Diagnóstico",
        tecnicoTesteo: "Técnico Testeo",
        additionalServices: "Servicios Adicionales",
        detallesPago: "Detalles Pago",
        modelo: "Modelo",
        tecnicoActualId: "ID Tec. Actual",
        tecnicoInicial: "Técnico Inicial",
        fecha: "Fecha",
        tecnicoEntrega: "Técnico Entrega",
        observacionEntrega: "Obs. Entrega",
        tecnicoResponsableId: "ID Tec. Responsable",
        sistemaOperativo: "Sistema Operativo",
        items: "Componentes Check",
        pagosRealizado: "Pagos Realizados",
        aCuenta: "A Cuenta",
        tipoEquipo: "Tipo Equipo",
        comprobante: "Comprobante",
        canTurnOn: "Enciende",
        clientName: "Cliente",
        tecnicoRecepcion: "Técnico Recepción",
        clientId: "ID Cliente",
        hasAdditionalServices: "Tiene Adicionales",
        comprobantesPago: "Comprobantes Pago",
        horaEntrega: "Hora Entrega",
        tecnicoEntregaId: "ID Tec. Entrega",
        tecnicoInicialId: "ID Tec. Inicial",
        hora: "Hora",
        tecnicoTesteoId: "ID Tec. Testeo",
        motivoIngreso: "Motivo Ingreso",
        ruc: "RUC",
        tecnicoResponsable: "Técnico Responsable",
        tecnicoRecepcionId: "ID Tec. Recepción",
        total: "Total",
        documentosVentaCompra: "Docs Venta/Compra",
        fechaEntrega: "Fecha Entrega",
        bitlockerKey: "Bitlocker",
        observaciones: "Observaciones",
        nombre: "Nombre",
        email: "Email",
        rol: "Rol",
        permissions: "Permisos",
        especialidad: "Especialidad"
    };

    const formatValue = (value) => {
        if (value === null || value === undefined) return <span className="text-gray-400">null</span>;
        if (typeof value === 'object') {
            if (value instanceof Date) return value.toLocaleString();
            if (value.seconds) return new Date(value.seconds * 1000).toLocaleString(); // Timestamp
            return <pre className="text-xs bg-gray-100 dark:bg-gray-900 dark:text-gray-200 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>;
        }
        if (value === true) return "SI";
        if (value === false) return "NO";
        return String(value);
    };

    if (loading) return <div className="text-center p-8">Cargando historial...</div>;

    if (!currentUser || currentUser.rol !== 'SUPERADMIN') {
        return <div className="text-center p-8 text-red-500">Acceso denegado. Solo SUPERADMIN puede ver el historial.</div>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                Historial de Acciones del Sistema
            </h1>

            <div className="mb-6 flex gap-4">
                <div className="relative flex-grow max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <FaSearch />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por usuario, resumen, entidad..."
                        className="pl-10 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={fetchLogs} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-semibold">
                    Actualizar
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase font-bold">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Acción</th>
                            <th className="px-6 py-3">Entidad</th>
                            <th className="px-6 py-3">Resumen</th>
                            <th className="px-6 py-3 text-center">Detalle</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{log.userEmail || 'Desconocido'}</span>
                                        {/* <span className="text-xs text-gray-500">{log.userId}</span> */}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                            log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium">{log.entityName}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={log.summary}>
                                    {log.summary}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleViewDetail(log)}
                                        className="text-gray-500 hover:text-blue-500 transition-colors"
                                        title="Ver Detalles"
                                    >
                                        <FaEye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    No se encontraron registros.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && selectedLog && (
                <Modal onClose={handleCloseModal} maxWidth="max-w-3xl">
                    <div className="p-4 md:p-6 w-full">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2 flex justify-between items-center">
                            <span>Detalle del Registro</span>
                            <span className="text-xs font-normal bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{selectedLog.id}</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase">Fecha</p>
                                <p>{selectedLog.timestamp ? new Date(selectedLog.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase">Usuario</p>
                                <p>{selectedLog.userEmail} <span className="text-xs text-gray-400">({selectedLog.userId})</span></p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase">Acción</p>
                                <p>{selectedLog.action}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase">Entidad Afectada</p>
                                <p>{selectedLog.entityName} {selectedLog.entityId && <span className="text-xs text-gray-400">(ID: {selectedLog.entityId})</span>}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Resumen</p>
                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border dark:border-gray-700">
                                {selectedLog.summary}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Datos del Objeto (Entity)</p>
                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded border dark:border-gray-700 max-h-96 overflow-y-auto">
                                {selectedLog.entity ? (
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {Object.entries(selectedLog.entity).map(([key, value]) => (
                                                <tr key={key} className="border-b border-gray-200 dark:border-gray-800 last:border-0">
                                                    <td className="py-2 font-semibold text-gray-700 dark:text-gray-300 w-1/3 align-top">
                                                        {KEY_LABELS[key] || key}:
                                                    </td>
                                                    <td className="py-2 break-all align-top">{formatValue(value)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-gray-500 italic">No hay datos de entidad disponibles.</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button onClick={handleCloseModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Historial;
