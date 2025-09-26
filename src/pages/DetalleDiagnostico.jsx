import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDiagnosticReportById, updateDiagnosticReport } from '../services/diagnosticService';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { ThemeContext } from '../context/ThemeContext';
import Modal from '../components/common/Modal';

function DetalleDiagnostico() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { theme } = useContext(ThemeContext);
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
    const [nextArea, setNextArea] = useState('');
    const [reparacion, setReparacion] = useState('');

    const AREA_OPTIONS = ['SOFTWARE', 'HARDWARE', 'ELECTRONICA', 'TERMINADO'];
    const otherAreas = AREA_OPTIONS.filter(area => area !== 'TERMINADO');

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
            toast.error('Error al cargar el informe.');
        }
        setIsLoading(false);
    };

    const handleOpenCompletionModal = () => {
        setIsCompletionModalOpen(true);
    };

    const handleCloseCompletionModal = () => {
        setIsCompletionModalOpen(false);
        setNextArea('');
        setReparacion('');
    };

    const handleCompleteTask = async (e) => {
        e.preventDefault();
        if (!reparacion) {
            return toast.error('La descripción de la reparación es obligatoria.');
        }

        try {
            const updatedData = {
                [`diagnosticoPorArea.${report.area}`]: {
                    reparacion,
                    tecnico: currentUser.nombre,
                    fecha: new Date().toISOString().split('T')[0],
                    estado: 'TERMINADO',
                },
                area: nextArea === 'TERMINADO' ? 'TERMINADO' : nextArea,
                estado: nextArea === 'TERMINADO' ? 'ENTREGADO' : 'EN PROGRESO',
            };

            await updateDiagnosticReport(reportId, updatedData);
            toast.success('Tarea completada y pasada a la siguiente área.');
            handleCloseCompletionModal();
            navigate('/bandeja-tecnico');
        } catch (error) {
            toast.error('Error al actualizar el informe.');
            console.error(error);
        }
    };
    
    if (isLoading) return <div className="text-center p-8">Cargando informe...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;
    if (report.tecnicoResponsable !== currentUser.nombre) return <div className="text-center p-8 text-red-500">No tienes permiso para ver este informe.</div>;

    const renderDiagnosticoSection = (area, data) => (
        <div key={area} className="border-t pt-4 mt-4 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-2">{area}</h3>
            {data.reparacion && <p><strong>Reparación:</strong> {data.reparacion}</p>}
            {data.tecnico && <p><strong>Técnico:</strong> {data.tecnico}</p>}
            {data.fecha && <p><strong>Fecha:</strong> {data.fecha}</p>}
            <p><strong>Estado:</strong> {data.estado}</p>
        </div>
    );

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center mb-6">
                <Link to="/bandeja-tecnico" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mr-4" title="Volver a la bandeja">
                    <FaArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold">Informe Técnico N° {report.reportNumber}</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 space-y-4">
                <h2 className="text-xl font-semibold mb-4 text-blue-500">Datos del Cliente y Equipo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Cliente:</strong> {report.clientName}</p>
                    <p><strong>Teléfono:</strong> {report.telefono || 'N/A'}</p>
                    <p><strong>Tipo de Equipo:</strong> {report.tipoEquipo}</p>
                    <p><strong>Marca - Modelo:</strong> {report.marca} - {report.modelo}</p>
                    <p><strong>Serie:</strong> {report.serie || 'N/A'}</p>
                    <p><strong>Motivo de Ingreso:</strong> {report.motivoIngreso}</p>
                    <p><strong>Técnico de Recepción:</strong> {report.tecnicoRecepcion}</p>
                    <p><strong>Área Actual:</strong> <span className="font-bold text-red-500">{report.area}</span></p>
                </div>
                
                <h2 className="text-xl font-semibold mt-6 text-green-500">Diagnóstico del Técnico</h2>
                <div className="space-y-2">
                    {report.diagnosticoPorArea && Object.keys(report.diagnosticoPorArea).map(area => renderDiagnosticoSection(area, report.diagnosticoPorArea[area]))}
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleOpenCompletionModal}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                    disabled={report.estado === 'ENTREGADO'}
                >
                    <FaCheckCircle className="mr-2" /> Completar Tarea
                </button>
            </div>
            
            {isCompletionModalOpen && (
                <Modal onClose={handleCloseCompletionModal}>
                    <form onSubmit={handleCompleteTask} className="space-y-4 p-4">
                        <h2 className="text-xl font-bold">Completar Tarea en Área de {report.area}</h2>
                        <div>
                            <label className="block text-sm font-medium mb-1">Diagnóstico y Reparación Realizada</label>
                            <textarea
                                value={reparacion}
                                onChange={(e) => setReparacion(e.target.value)}
                                rows="4"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Describe el diagnóstico y la reparación que realizaste."
                                required
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Pasar a la Siguiente Área</label>
                            <select
                                value={nextArea}
                                onChange={(e) => setNextArea(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                required
                            >
                                <option value="">Selecciona la siguiente área</option>
                                {otherAreas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                                <option value="TERMINADO">TERMINADO (Listo para entregar)</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={handleCloseCompletionModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Guardar y Pasar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default DetalleDiagnostico;