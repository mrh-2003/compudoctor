import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDiagnosticReportById, updateDiagnosticReport } from '../services/diagnosticService';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { ThemeContext } from '../context/ThemeContext';
import Modal from '../components/common/Modal';
import Select from 'react-select';
import { getAllUsersDetailed } from '../services/userService';

function DetalleDiagnostico() {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { theme } = useContext(ThemeContext);
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
    const [formState, setFormState] = useState({});
    const [reparacionFinal, setReparacionFinal] = useState('');
    const [nextArea, setNextArea] = useState('');
    const [users, setUsers] = useState([]);
    const [tecnicoActual, setTecnicoActual] = useState(null);

    const AREA_OPTIONS = ['SOFTWARE', 'HARDWARE', 'ELECTRONICA'];
    const filteredUsers = users.filter(user => user.label !== currentUser.nombre);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const fetchedReport = await getDiagnosticReportById(reportId);
                setReport(fetchedReport);
                if (fetchedReport?.diagnosticoPorArea && fetchedReport.diagnosticoPorArea[fetchedReport.area]) {
                    setFormState(fetchedReport.diagnosticoPorArea[fetchedReport.area]);
                }
                const allUsers = await getAllUsersDetailed();
                setUsers(allUsers.map(u => ({ value: u.id, label: u.nombre, especialidad: u.especialidad })));
            } catch (error) {
                toast.error('Error al cargar el informe.');
            } finally {
                setIsLoading(false);
            }
        };
        if (reportId) {
            fetchData();
        }
    }, [reportId]);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleOpenCompletionModal = () => {
        setIsCompletionModalOpen(true);
    };

    const handleCloseCompletionModal = () => {
        setIsCompletionModalOpen(false);
        setNextArea('');
        setReparacionFinal('');
        setTecnicoActual(null);
    };

    const handleCompleteTask = async (e) => {
        e.preventDefault();
        
        const isResponsible = report.tecnicoResponsable === currentUser.nombre;
        
        if (!reparacionFinal) {
            return toast.error('La descripción de la reparación es obligatoria.');
        }

        try {
            const updatedData = {
                diagnosticoPorArea: {
                    ...report.diagnosticoPorArea,
                    [report.area]: {
                        ...formState,
                        reparacion: reparacionFinal,
                        tecnico: currentUser.nombre,
                        fecha: new Date().toISOString().split('T')[0],
                        estado: 'TERMINADO',
                    },
                },
                estado: nextArea === 'TERMINADO' ? 'ENTREGADO' : 'EN PROGRESO',
                area: nextArea,
                tecnicoActual: tecnicoActual?.label || report.tecnicoResponsable,
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
    
    const renderAreaForm = () => {
        const isResponsible = report.tecnicoResponsable === currentUser.nombre;
        const currentTecnico = report.diagnosticoPorArea[report.area]?.tecnico || '';

        const commonFields = (
            <>
                <p className="font-bold text-lg text-black dark:text-white">SERVICIO REALIZADO</p>
                <div className="border p-4 rounded-md dark:border-gray-700">
                    <div>
                        <label className="block text-sm font-medium mb-1">Técnico 1:</label>
                        <input type="text" value={currentTecnico || currentUser.nombre} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 mt-2">Técnico de Apoyo:</label>
                        <Select
                            options={users.filter(u => u.label !== currentUser.nombre)}
                            value={tecnicoActual}
                            onChange={setTecnicoActual}
                            placeholder="Selecciona técnico de apoyo..."
                            isClearable
                            isDisabled={!isResponsible}
                        />
                    </div>
                </div>
            </>
        );

        switch (report.area) {
            case 'HARDWARE':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-red-500">ÁREA DE HARDWARE</h2>
                        {commonFields}
                        <div className="border p-4 rounded-md dark:border-gray-700">
                            <p className="font-bold text-lg text-black dark:text-white">REPORTE DE ESTADO DEL EQUIPO</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Componentes Internos</h4>
                                    <label className="flex items-center space-x-2">
                                        <span className="w-32">Procesador</span>
                                        <input type="text" name="procesador_obs" value={formState.procesador_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-1 text-xs border rounded-md dark:bg-gray-700" />
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <span className="w-32">Memoria RAM</span>
                                        <input type="text" name="memoria_ram_obs" value={formState.memoria_ram_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-1 text-xs border rounded-md dark:bg-gray-700" />
                                    </label>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Conectividad</h4>
                                    <label className="flex items-center space-x-2">
                                        <span className="w-32">WiFi</span>
                                        <input type="checkbox" name="wifi_funciona" checked={formState.wifi_funciona || false} onChange={handleFormChange} className="h-4 w-4" /> <span className="ml-1">Sí</span>
                                        <input type="checkbox" name="wifi_no_funciona" checked={formState.wifi_no_funciona || false} onChange={handleFormChange} className="h-4 w-4 ml-2" /> <span className="ml-1">No</span>
                                        <input type="text" name="wifi_obs" value={formState.wifi_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-1 text-xs border rounded-md dark:bg-gray-700" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'SOFTWARE':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-blue-500">ÁREA DE SOFTWARE</h2>
                        {commonFields}
                        <div className="border p-4 rounded-md dark:border-gray-700">
                            <p className="font-bold text-lg text-black dark:text-white">REPORTE DE ESTADO DEL EQUIPO</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Servicios</h4>
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" name="backup" checked={formState.backup || false} onChange={handleFormChange} className="h-4 w-4" />
                                        <span className="flex-1">Backup de Información</span>
                                        <input type="text" name="backup_obs" value={formState.backup_obs || ''} onChange={handleFormChange} placeholder="Obs." className="w-32 p-1 text-xs border rounded-md dark:bg-gray-700" />
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" name="formateo" checked={formState.formateo || false} onChange={handleFormChange} className="h-4 w-4" />
                                        <span className="flex-1">Formateo + programas básicos</span>
                                        <input type="text" name="formateo_obs" value={formState.formateo_obs || ''} onChange={handleFormChange} placeholder="Obs." className="w-32 p-1 text-xs border rounded-md dark:bg-gray-700" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'ELECTRONICA':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-yellow-500">ÁREA DE ELECTRÓNICA</h2>
                        {commonFields}
                        <div className="border p-4 rounded-md dark:border-gray-700">
                            <p className="font-bold text-lg text-black dark:text-white">SERVICIO REALIZADO</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Diagnóstico</h4>
                                    <label className="block mb-2">
                                        Obs. General:
                                        <textarea name="electronica_obs" value={formState.electronica_obs || ''} onChange={handleFormChange} rows="3" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    </label>
                                    <label className="block mb-2">
                                        Código Placa:
                                        <input type="text" name="codigo_placa" value={formState.codigo_placa || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isLoading) return <div className="text-center p-8">Cargando informe...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;
    
    // Verificación de permisos basada en tecnicoActual
    const isCurrentUserTechnician = report.tecnicoActual === currentUser.nombre;
    const isCurrentUserResponsible = report.tecnicoResponsable === currentUser.nombre;
    
    if (!isCurrentUserTechnician && !isCurrentUserResponsible) {
        return <div className="text-center p-8 text-red-500">No tienes permiso para ver este informe.</div>;
    }

    const filteredUsersOptions = users.filter(user => user.label !== currentUser.nombre && user.label !== report.tecnicoResponsable);
    
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
                    <p><strong>Técnico Responsable:</strong> {report.tecnicoResponsable}</p>
                    <p><strong>Área Actual:</strong> <span className="font-bold text-red-500">{report.area}</span></p>
                    <p><strong>Técnico Actual:</strong> <span className="font-bold text-red-500">{report.tecnicoActual}</span></p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 mt-6">
                <h2 className="text-xl font-semibold text-purple-500">Formulario de Diagnóstico</h2>
                {renderAreaForm()}
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
                                value={reparacionFinal}
                                onChange={(e) => setReparacionFinal(e.target.value)}
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
                                {isCurrentUserResponsible ? (
                                    <>
                                        {AREA_OPTIONS.map(area => <option key={area} value={area}>{area}</option>)}
                                        <option value="TERMINADO">TERMINADO (Listo para entregar)</option>
                                    </>
                                ) : (
                                    <option value={report.area}>{report.area}</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Asignar a:</label>
                            <Select
                                options={isCurrentUserResponsible ? filteredUsers : [{ value: 'return', label: report.tecnicoResponsable }]}
                                value={tecnicoActual}
                                onChange={setTecnicoActual}
                                placeholder="Selecciona el técnico..."
                                isClearable
                                isDisabled={!isCurrentUserResponsible && !report.tecnicoResponsable}
                            />
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