import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDiagnosticReportById } from '../services/diagnosticService';
import { FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

function DetalleHistorial() {
    const { reportId } = useParams();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (reportId) {
            fetchReport();
        }
    }, [reportId]);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const fetchedReport = await getDiagnosticReportById(reportId);
            setReport(fetchedReport);
        } catch (error) {
            toast.error('Error al cargar el historial del informe.');
        } finally {
            setIsLoading(false);
        }
    };

    // Component Options (Necesario para mapear IDs a nombres en la vista)
    const COMPONENT_OPTIONS = {
        PC: [
            { id: "procesador", name: "Procesador" },
            { id: "placaMadre", name: "Placa Madre" },
            { id: "memoriaRam", name: "Memoria RAM" },
            { id: "hdd", name: "HDD" },
            { id: "ssd", name: "SSD" },
            { id: "m2Nvme", name: "M2 Nvme" },
            { id: "tarjetaVideo", name: "Tarjeta de video" },
            { id: "wifi", name: "Wi-Fi" },
            { id: "rj45", name: "RJ 45" },
            { id: "vga", name: "VGA" },
            { id: "usb", name: "USB" },
            { id: "lectora", name: "Lectora" },
            { id: "otros", name: "Otros" },
        ],
        Laptop: [
            { id: "procesador", name: "Procesador" },
            { id: "placaMadre", name: "Placa Madre" },
            { id: "memoriaRam", name: "Memoria RAM" },
            { id: "hdd", name: "HDD" },
            { id: "ssd", name: "SSD" },
            { id: "m2Nvme", name: "M2 Nvme" },
            { id: "tarjetaVideo", name: "Tarjeta de video" },
            { id: "wifi", name: "Wi-Fi" },
            { id: "bateria", name: "Batería" },
            { id: "cargador", name: "Cargador" },
            { id: "pantalla", name: "Pantalla" },
            { id: "teclado", name: "Teclado" },
            { id: "camara", name: "Cámara" },
            { id: "microfono", name: "Micrófono" },
            { id: "parlantes", name: "Parlantes" },
            { id: "auriculares", name: "Auriculares" },
            { id: "rj45", name: "RJ 45" },
            { id: "hdmi", name: "HDMI" },
            { id: "vga", name: "VGA" },
            { id: "usb", name: "USB" },
            { id: "tipoC", name: "Tipo C" },
            { id: "lectora", name: "Lectora" },
            { id: "touchpad", name: "Touchpad" },
            { id: "otros", name: "Otros" },
        ],
        Allinone: [
            { id: "procesador", name: "Procesador" },
            { id: "placaMadre", name: "Placa Madre" },
            { id: "memoriaRam", name: "Memoria RAM" },
            { id: "hdd", name: "HDD" },
            { id: "ssd", name: "SSD" },
            { id: "m2Nvme", name: "M2 Nvme" },
            { id: "tarjetaVideo", name: "Tarjeta de video" },
            { id: "wifi", name: "Wi-Fi" },
            { id: "rj45", name: "RJ 45" },
            { id: "usb", name: "USB" },
            { id: "lector", name: "Lectora" },
            { id: "otros", name: "Otros" },
        ],
        Impresora: [
            { id: "rodillos", name: "Rodillos" },
            { id: "cabezal", name: "Cabezal" },
            { id: "tinta", name: "Cartuchos/Tinta" },
            { id: "bandejas", name: "Bandejas" },
            { id: "otros", name: "Otros" },
        ],
        Otros: [{ id: "otros", name: "Otros" }],
    };

    const getComponentName = (itemId, tipoEquipo) => {
        const options = COMPONENT_OPTIONS[tipoEquipo] || [];
        return options.find((item) => item.id === itemId)?.name || itemId;
    };


    if (isLoading) return <div className="text-center p-8">Cargando historial...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;

    // Filtramos los items chequeados o con detalles
    const filteredItems = report.items?.filter(item => item.checked || item.detalles) || [];
    
    // El renderDetailSection original ya no es necesario o se re-utiliza de forma diferente
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center mb-6">
                <Link to="/ver-estado" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mr-4" title="Volver a Ver Estado">
                    <FaArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold">Diagnóstico Completo N° {report.reportNumber}</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 space-y-6">
                
                {/* 1. Datos de Recepción */}
                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-blue-500 mb-3">Datos de Recepción</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><strong>Cliente:</strong> {report.clientName}</p>
                        <p><strong>Celular:</strong> {report.telefono || 'N/A'}</p>
                        <p><strong>Fecha de Ingreso:</strong> {report.fecha} / {report.hora}</p>
                        <p><strong>Estado Actual:</strong> <span className="font-bold text-red-500">{report.estado}</span></p>
                    </div>
                </div>

                {/* 2. Descripción del Equipo */}
                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-purple-500 mb-3">Descripción del Equipo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><strong>Tipo:</strong> {report.tipoEquipo || 'N/A'}</p>
                        <p><strong>Marca:</strong> {report.marca || 'N/A'}</p>
                        <p><strong>Modelo:</strong> {report.modelo || 'N/A'}</p>
                        <p><strong>Serie:</strong> {report.serie || 'N/A'}</p>
                    </div>
                </div>

                {/* 3. Componentes y Accesorios */}
                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-green-500 mb-3">Componentes y Accesorios</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {filteredItems.length > 0 ? (
                            filteredItems.map(item => (
                                <p key={item.id} className="truncate">
                                    <strong>{getComponentName(item.id, report.tipoEquipo)}:</strong> {item.detalles || 'OK'}
                                </p>
                            ))
                        ) : (<p className="text-gray-500 col-span-2">No se registraron componentes específicos.</p>)}
                        
                        {(report.sistemaOperativo || report.bitlockerKey) && (
                            <>
                                {report.sistemaOperativo && <p><strong>S.O.:</strong> {report.sistemaOperativo}</p>}
                                {report.bitlockerKey && <p><strong>Bitlocker Key:</strong> {report.bitlockerKey}</p>}
                            </>
                        )}
                    </div>
                </div>

                {/* 4. Detalles del Servicio y Observaciones */}
                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-yellow-500 mb-3">Detalles del Servicio</h2>
                    <p className="mb-3 text-sm">
                        <strong>Motivo de Ingreso:</strong> {report.motivoIngreso || 'N/A'}
                    </p>
                    <p className="text-sm">
                        <strong>Observaciones:</strong> {report.observaciones || 'Sin observaciones adicionales.'}
                    </p>
                </div>
                
                {/* 5. Asignación de Personal */}
                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-indigo-500 mb-3">Asignación de Personal</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><strong>Técnico Recepción:</strong> {report.tecnicoRecepcion || 'N/A'}</p>
                        <p><strong>Técnico Testeo:</strong> {report.tecnicoTesteo || 'N/A'}</p>
                        <p><strong>Técnico Responsable:</strong> {report.tecnicoResponsable || 'N/A'}</p>
                        <p><strong>Área de Destino:</strong> {report.area || 'N/A'}</p>
                    </div>
                </div>

                {/* 6. Historial de Reparaciones (Original de este componente) */}
                <div>
                    <h2 className="text-xl font-semibold text-red-500 mb-3">Historial de Reparaciones</h2>
                    {report.diagnosticoPorArea && Object.keys(report.diagnosticoPorArea).length > 0 ? (
                        Object.entries(report.diagnosticoPorArea).map(([area, data]) => (
                            <div key={area} className="border p-4 rounded-lg mt-3 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                                <h3 className="font-bold text-lg mb-2">{area}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <p><strong>Técnico:</strong> {data.tecnico || 'N/A'}</p>
                                    <p><strong>Fecha:</strong> {data.fecha || 'N/A'}</p>
                                    <p className="col-span-full"><strong>Reparación:</strong> {data.reparacion || 'No especificado'}</p>
                                    <p><strong>Estado:</strong> <span className="font-bold">{data.estado}</span></p>
                                </div>
                                {Object.keys(data).length > 4 && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-sm">Detalles Adicionales:</h4>
                                        <ul className="list-disc pl-5 text-sm">
                                            {Object.entries(data).filter(([key]) => !['tecnico', 'fecha', 'reparacion', 'estado'].includes(key)).map(([key, value]) => (
                                                <li key={key}>
                                                    <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong> {value}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No hay historial de reparaciones para este informe.</p>
                    )}
                </div>
                
            </div>
        </div>
    );
}

export default DetalleHistorial;