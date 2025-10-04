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

    if (isLoading) return <div className="text-center p-8">Cargando historial...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;

    const renderDetailSection = (title, data) => (
        <div className="border p-4 rounded-lg dark:border-gray-700">
            <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">{title}</h3>
            {Object.keys(data).length > 0 ? (
                Object.entries(data).map(([key, value]) => (
                    <p key={key} className="text-sm">
                        <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong> {value || 'N/A'}
                    </p>
                ))
            ) : (
                <p className="text-sm text-gray-500">No hay información registrada en esta sección.</p>
            )}
        </div>
    );

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center mb-6">
                <Link to="/ver-estado" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mr-4" title="Volver a Ver Estado">
                    <FaArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold">Historial del Informe N° {report.reportNumber}</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 space-y-4">
                <h2 className="text-xl font-semibold text-blue-500">Datos Generales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Cliente:</strong> {report.clientName}</p>
                    <p><strong>Equipo:</strong> {report.tipoEquipo} - {report.marca} {report.modelo}</p>
                    <p><strong>Motivo de Ingreso:</strong> {report.motivoIngreso}</p>
                    <p><strong>Técnico de Recepción:</strong> {report.tecnicoRecepcion}</p>
                    <p><strong>Estado Actual:</strong> <span className="font-bold text-red-500">{report.estado}</span></p>
                    <p><strong>Área de Trabajo:</strong> <span className="font-bold text-red-500">{report.area}</span></p>
                </div>
                
                <hr className="my-4 dark:border-gray-700" />
                <h2 className="text-xl font-semibold text-green-500">Historial de Reparaciones</h2>
                {report.diagnosticoPorArea && Object.keys(report.diagnosticoPorArea).length > 0 ? (
                    Object.entries(report.diagnosticoPorArea).map(([area, data]) => (
                        <div key={area} className="border p-4 rounded-lg dark:border-gray-700">
                            <h3 className="font-bold text-lg">{area}</h3>
                            <p><strong>Técnico:</strong> {data.tecnico}</p>
                            <p><strong>Fecha:</strong> {data.fecha}</p>
                            <p><strong>Reparación:</strong> {data.reparacion || 'No especificado'}</p>
                            <p><strong>Estado:</strong> <span className="font-bold">{data.estado}</span></p>
                            {Object.keys(data).length > 4 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-sm">Detalles Adicionales:</h4>
                                    <ul className="list-disc pl-5 text-sm">
                                        {Object.entries(data).filter(([key]) => !['tecnico', 'fecha', 'reparacion', 'estado'].includes(key)).map(([key, value]) => (
                                            <li key={key}>
                                                <strong>{key.replace(/_/g, ' ')}:</strong> {value}
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
    );
}

export default DetalleHistorial;