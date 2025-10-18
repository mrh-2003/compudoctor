import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDiagnosticReportById, updateDiagnosticReport } from '../services/diagnosticService';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaCheckCircle, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { ThemeContext } from '../context/ThemeContext';
import Modal from '../components/common/Modal';
import Select from 'react-select';
import { getAllUsersDetailed } from '../services/userService';

const FIELD_LABELS = {
    hw_laptop: "Tipo Equipo - Laptop",
    hw_pc: "Tipo Equipo - PC",
    hw_otro: "Tipo Equipo - Otro",
    hw_otro_spec: "Especificación Otro",
    mant_hardware: "Mantenimiento de Hardware",
    reconstruccion: "Reconstrucción",
    adapt_parlantes: "Adaptación de Parlantes",
    cambio_teclado: "Cambio de Teclado",
    cambio_teclado_codigo: "Código de Teclado",
    cambio_pantalla: "Cambio de Pantalla",
    cambio_pantalla_codigo: "Código",
    cambio_pantalla_resolucion: "Resolución",
    cambio_pantalla_hz: "Hz",
    cambio_carcasa: "Cambio de Carcasa",
    cambio_carcasa_obs: "Observación de Carcasa",
    cambio_placa: "Cambio de Placa",
    cambio_placa_codigo: "Código",
    cambio_placa_especif: "Especificación",
    cambio_fuente: "Cambio de Fuente",
    cambio_fuente_codigo: "Código",
    cambio_fuente_especif: "Especificación",
    cambio_video: "Cambio de Tarjeta de Video",
    cambio_video_codigo: "Código",
    cambio_video_especif: "Especificación",
    otros: "Otros",
    otros_especif: "Especificación de Otros",
    repoten_ssd: "Repotenciación SSD",
    repoten_ssd_gb: "GB de SSD",
    repoten_nvme: "Repotenciación NVME",
    repoten_nvme_gb: "GB de NVME",
    repoten_m2: "Repotenciación M2 SATA",
    repoten_m2_gb: "GB de M2 SATA",
    repoten_hdd: "Repotenciación HDD",
    repoten_hdd_gb: "GB de HDD",
    repoten_hdd_serie: "Serie de HDD",
    repoten_hdd_codigo: "Código de HDD",
    repoten_ram: "Repotenciación RAM",
    repoten_ram_cap: "Capacidad de RAM",
    repoten_ram_cod: "Código de RAM",
    sw_laptop: "Tipo Equipo - Laptop",
    sw_pc: "Tipo Equipo - PC",
    sw_otro: "Tipo Equipo - Otro",
    sw_otro_spec: "Especificación Otro",
    backup: "Backup de Información",
    backup_obs: "Observación de Backup",
    clonacion: "Clonación de Disco",
    clonacion_obs: "Observación de Clonación",
    formateo: "Formateo + Programas",
    formateo_obs: "Observación de Formateo",
    drivers: "Instalación de Drivers",
    drivers_obs: "Observación de Drivers",
    diseno: "Instalación de Programas de Diseño",
    diseno_spec: "Especificación de Programas de Diseño",
    ingenieria: "Instalación de Programas de Ingeniería",
    ingenieria_spec: "Especificación de Programas de Ingeniería",
    act_win: "Activación de Windows",
    act_win_obs: "Observación de Activación de Windows",
    act_office: "Activación de Office",
    act_office_obs: "Observación de Activación de Office",
    optimizacion: "Optimización de sistema",
    optimizacion_obs: "Observación de Optimización",
    sw_otros: "Otros",
    sw_otros_spec: "Especificación de Otros",
    elec_video: "Tarjeta de Video",
    elec_placa: "Placa",
    elec_otro: "Otro",
    elec_codigo: "Código",
    elec_etapa: "Etapa",
    elec_obs: "Observación",
    tec_apoyo: "Técnico de Apoyo",
    ubicacionFisica: "Ubicación Física"
};

const GROUPED_FIELDS_CONFIG = {
    cambio_teclado: ["cambio_teclado_codigo"],
    cambio_pantalla: ["cambio_pantalla_codigo", "cambio_pantalla_resolucion", "cambio_pantalla_hz"],
    cambio_carcasa: ["cambio_carcasa_obs"],
    cambio_placa: ["cambio_placa_codigo", "cambio_placa_especif"],
    cambio_fuente: ["cambio_fuente_codigo", "cambio_fuente_especif"],
    cambio_video: ["cambio_video_codigo", "cambio_video_especif"],
    repoten_hdd: ["repoten_hdd_gb", "repoten_hdd_serie", "repoten_hdd_codigo"],
    repoten_ram: ["repoten_ram_cap", "repoten_ram_cod"],
    backup: ["backup_obs"],
    clonacion: ["clonacion_obs"],
    formateo: ["formateo_obs"],
    drivers: ["drivers_obs"],
    diseno: ["diseno_spec"],
    ingenieria: ["ingenieria_spec"],
    act_win: ["act_win_obs"],
    act_office: ["act_office_obs"],
    optimizacion: ["optimizacion_obs"],
    sw_otros: ["sw_otros_spec"],
};

const ALL_COMPONENTS = [
    { id: "procesador", name: "Procesador" }, { id: "placaMadre", name: "Placa Madre" },
    { id: "memoriaRam", name: "Memoria RAM" }, { id: "hdd", name: "HDD" }, { id: "ssd", name: "SSD" },
    { id: "m2Nvme", name: "M2 Nvme" }, { id: "tarjetaVideo", name: "Tarjeta de video" },
    { id: "wifi", name: "Wi-Fi" }, { id: "bateria", name: "Batería" }, { id: "cargador", name: "Cargador" },
    { id: "pantalla", name: "Pantalla" }, { id: "teclado", name: "Teclado" }, { id: "camara", name: "Cámara" },
    { id: "microfono", name: "Micrófono" }, { id: "parlantes", name: "Parlantes" },
    { id: "auriculares", name: "Auriculares" }, { id: "rj45", name: "RJ 45" }, { id: "hdmi", name: "HDMI" },
    { id: "vga", name: "VGA" }, { id: "usb", name: "USB" }, { id: "tipoC", name: "Tipo C" },
    { id: "lectora", name: "Lectora" }, { id: "touchpad", name: "Touchpad" }, { id: "otros", name: "Otros" },
];

const getComponentOptions = (type) => {
    switch (type) {
        case 'PC':
            return ALL_COMPONENTS.filter(c => c.id !== 'bateria' && c.id !== 'cargador' && c.id !== 'pantalla' && c.id !== 'teclado' && c.id !== 'camara' && c.id !== 'microfono' && c.id !== 'parlantes' && c.id !== 'auriculares' && c.id !== 'hdmi' && c.id !== 'tipoC' && c.id !== 'touchpad');
        case 'Laptop':
            return ALL_COMPONENTS.filter(c => c.id !== 'vga' && c.id !== 'lector');
        case 'Allinone':
            return ALL_COMPONENTS.filter(c => c.id !== 'bateria' && c.id !== 'cargador' && c.id !== 'microfono' && c.id !== 'parlantes' && c.id !== 'auriculares' && c.id !== 'hdmi' && c.id !== 'tipoC' && c.id !== 'touchpad' && c.id !== 'lector' && c.id !== 'vga' && c.id !== 'teclado' && c.id !== 'pantalla' && c.id !== 'camara');
        case 'Impresora':
            return [{ id: "rodillos", name: "Rodillos" }, { id: "cabezal", name: "Cabezal" }, { id: "tinta", name: "Cartuchos/Tinta" }, { id: "bandejas", name: "Bandejas" }, { id: "otros", name: "Otros" }];
        case 'Otros':
            return ALL_COMPONENTS;
        default:
            return [];
    }
};

const getComponentName = (itemId, tipoEquipo) => {
    const options = getComponentOptions(tipoEquipo) || [];
    return options.find((item) => item.id === itemId)?.name || itemId;
};

const selectStyles = (theme) => ({
    control: (baseStyles) => ({
        ...baseStyles,
        backgroundColor: theme === 'dark' ? '#374151' : '#fff',
        borderColor: theme === 'dark' ? '#4B5563' : baseStyles.borderColor,
    }),
    singleValue: (baseStyles) => ({
        ...baseStyles,
        color: theme === 'dark' ? '#fff' : '#000',
    }),
    menu: (baseStyles) => ({
        ...baseStyles,
        backgroundColor: theme === 'dark' ? '#374151' : '#fff',
    }),
    option: (baseStyles, state) => ({
        ...baseStyles,
        backgroundColor: state.isFocused ? (theme === 'dark' ? '#4B5563' : '#e5e7eb') : 'transparent',
        color: theme === 'dark' ? '#fff' : '#000',
    }),
});

const ReadOnlyEntry = ({ entry, areaName }) => {
    const processedKeys = new Set(['tecnico', 'tecnicoId', 'reparacion', 'fecha_inicio', 'hora_inicio', 'fecha_fin', 'hora_fin', 'estado']);
    const detailsToShow = [];

    const allGroupedSubKeys = Object.values(GROUPED_FIELDS_CONFIG).flat();

    for (const key in entry) {
        if (processedKeys.has(key) || !entry[key]) continue;

        const mainGroupKey = Object.keys(GROUPED_FIELDS_CONFIG).find(groupKey => GROUPED_FIELDS_CONFIG[groupKey].includes(key));
        if (mainGroupKey) continue;

        if (GROUPED_FIELDS_CONFIG[key]) {
            const groupItems = [
                entry[key] ? <FaCheck key={`${key}-check`} className="text-green-500" /> : <FaTimes key={`${key}-times`} className="text-red-500" />,
                ...GROUPED_FIELDS_CONFIG[key].map(subKey => (
                    entry[subKey] ? <span key={subKey} className="ml-2">{FIELD_LABELS[subKey] || subKey}: {entry[subKey]}</span> : null
                )).filter(Boolean)
            ];
            detailsToShow.push({ key, label: FIELD_LABELS[key] || key, value: <div className="flex items-center gap-1 flex-wrap">{groupItems}</div> });
            processedKeys.add(key);
            GROUPED_FIELDS_CONFIG[key].forEach(subKey => processedKeys.add(subKey));
        } else if (!allGroupedSubKeys.includes(key)) {
            detailsToShow.push({
                key,
                label: FIELD_LABELS[key] || key,
                value: typeof entry[key] === 'boolean' ? (entry[key] ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-500" />) : entry[key]
            });
            processedKeys.add(key);
        }
    }

    return (
        <div className="border p-3 rounded-md mt-2 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-sm">
            <h3 className="font-bold text-lg">{areaName} - {entry.fecha_fin} {entry.hora_fin}</h3>
            <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
                <strong className="text-right">Técnico:</strong><span>{entry.tecnico}</span>
                <strong className="text-right">Reparación:</strong><span>{entry.reparacion || 'N/A'}</span>
                <strong className="text-right">Ubicación Física:</strong><span>{entry.ubicacionFisica || 'N/A'}</span>
                <strong className="text-right">Fechas:</strong><span>{entry.fecha_inicio} {entry.hora_inicio} - {entry.fecha_fin || 'N/A'} {entry.hora_fin || ''}</span>
                <strong className="text-right">Estado:</strong><span className="font-semibold">{entry.estado}</span>
            </div>
            <div className="mt-2 border-t pt-2 dark:border-gray-600">
                <h4 className="font-semibold">Detalles de la intervención:</h4>
                <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
                    {detailsToShow.map(({ key, label, value }) => (
                        <React.Fragment key={key}>
                            <strong className="text-right">{label}:</strong>
                            <div>{value}</div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

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
    const [tecnicoSiguiente, setTecnicoSiguiente] = useState(null);
    const [ubicacionFisica, setUbicacionFisica] = useState('');

    const AREA_OPTIONS = ['SOFTWARE', 'HARDWARE', 'ELECTRONICA'];

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const fetchedReport = await getDiagnosticReportById(reportId);
                setReport(fetchedReport);

                const currentAreaHistory = fetchedReport.diagnosticoPorArea[fetchedReport.area];
                const lastEntry = currentAreaHistory && currentAreaHistory.findLast((entry) => entry.tecnicoId === currentUser.uid);
                
                // Transición de ASIGNADO a PENDIENTE/EN PROGRESO al abrir la tarea por primera vez
                if (lastEntry && lastEntry.estado === 'ASIGNADO') {
                    const now = new Date();
                    const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
                    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                    
                    const updatedAreaHistory = [...currentAreaHistory];
                    const lastEntryIndex = updatedAreaHistory.findIndex(e => e === lastEntry);

                    updatedAreaHistory[lastEntryIndex] = {
                        ...lastEntry,
                        estado: 'PENDIENTE', 
                        fecha_inicio: formattedDate,
                        hora_inicio: formattedTime,
                    };
                    
                    await updateDiagnosticReport(reportId, {
                        diagnosticoPorArea: {
                            ...fetchedReport.diagnosticoPorArea,
                            [fetchedReport.area]: updatedAreaHistory,
                        },
                        estado: 'PENDIENTE',
                    });

                    // Vuelve a cargar el reporte con el estado actualizado
                    const updatedReport = await getDiagnosticReportById(reportId);
                    setReport(updatedReport);
                    
                    setFormState({
                        fecha_inicio: updatedReport.diagnosticoPorArea[updatedReport.area].findLast(e => e.tecnicoId === currentUser.uid)?.fecha_inicio,
                        hora_inicio: updatedReport.diagnosticoPorArea[updatedReport.area].findLast(e => e.tecnicoId === currentUser.uid)?.hora_inicio
                    });
                } else if (lastEntry) {
                    setFormState({
                        fecha_inicio: lastEntry.fecha_inicio,
                        hora_inicio: lastEntry.hora_inicio
                    });
                }

                const allUsers = await getAllUsersDetailed();
                setUsers(allUsers.map(u => ({ value: u.id, label: u.nombre })));

            } catch (error) {
                toast.error('Error al cargar el informe.');
            } finally {
                setIsLoading(false);
            }
        };
        if (reportId) {
            fetchData();
        }
    }, [reportId, currentUser.uid]);


    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleOpenCompletionModal = () => setIsCompletionModalOpen(true);
    const handleCloseCompletionModal = () => {
        setIsCompletionModalOpen(false);
        setNextArea('');
        setReparacionFinal('');
        setTecnicoSiguiente(null);
        setUbicacionFisica('');
    };
    
    const handleCompleteTask = async (e) => {
        e.preventDefault();
        
        if (!reparacionFinal) return toast.error('La descripción de la reparación es obligatoria.');
        if (!nextArea) return toast.error('Debes seleccionar la siguiente área o marcar como terminado.');
        
        // Validación de ubicación física solo si NO es TERMINADO
        if (nextArea !== 'TERMINADO' && !ubicacionFisica) return toast.error('La ubicación física es obligatoria al pasar el equipo a otra área.');
        
        if (nextArea !== 'TERMINADO' && !tecnicoSiguiente) return toast.error('Debes asignar un técnico para la siguiente área.');
        if (nextArea === report.area && tecnicoSiguiente?.value === currentUser.uid) {
            return toast.error('No puedes reasignarte el informe a ti mismo en la misma área.');
        }

        try {
            const now = new Date();
            const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
            const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
            const currentAreaHistory = [...(report.diagnosticoPorArea[report.area] || [])];
            
            // Buscar la entrada del técnico actual que no esté finalizada
            const lastEntryIndex = currentAreaHistory.findLastIndex(
                (entry) => entry.tecnicoId === currentUser.uid && entry.estado !== 'FINALIZADO' && entry.estado !== 'TERMINADO'
            );
            
            if (lastEntryIndex === -1) {
                return toast.error('Error: No se encontró una tarea PENDIENTE o ASIGNADA a tu nombre en el historial de esta área.');
            }
            
            const currentEntry = currentAreaHistory[lastEntryIndex];
            
            currentAreaHistory[lastEntryIndex] = {
                ...currentEntry,
                ...formState,
                reparacion: reparacionFinal,
                fecha_fin: formattedDate,
                hora_fin: formattedTime,
                ubicacionFisica: ubicacionFisica,
                estado: 'FINALIZADO', // La tarea del técnico en esta área se marca como FINALIZADO
            };
    
            const updatedDiagnosticoPorArea = {
                ...report.diagnosticoPorArea,
                [report.area]: currentAreaHistory,
            };
    
            const updatedData = {
                diagnosticoPorArea: updatedDiagnosticoPorArea,
                estado: nextArea === 'TERMINADO' ? 'ENTREGADO' : 'ASIGNADO', // Estado general del informe
                area: nextArea !== 'TERMINADO' ? nextArea : report.area,
                tecnicoActual: tecnicoSiguiente ? tecnicoSiguiente.label : report.tecnicoResponsable,
                tecnicoActualId: tecnicoSiguiente ? tecnicoSiguiente.value : report.tecnicoResponsableId,
                ubicacionFisica: ubicacionFisica,
            };
    
            if (nextArea !== 'TERMINADO') {
                const newAreaHistory = [...(updatedDiagnosticoPorArea[nextArea] || [])];
                newAreaHistory.push({
                    reparacion: '',
                    tecnico: tecnicoSiguiente.label,
                    tecnicoId: tecnicoSiguiente.value,
                    ubicacionFisica: ubicacionFisica,
                    fecha_inicio: formattedDate,
                    hora_inicio: formattedTime,
                    fecha_fin: '',
                    hora_fin: '',
                    estado: 'ASIGNADO', // La nueva tarea se establece como ASIGNADO
                });
                updatedData.diagnosticoPorArea[nextArea] = newAreaHistory;
            }
    
            await updateDiagnosticReport(reportId, updatedData);
            toast.success('Tarea completada y asignación actualizada.');
            handleCloseCompletionModal();
            navigate('/bandeja-tecnico');
    
        } catch (error) {
            toast.error('Error al actualizar el informe.');
            console.error(error);
        }
    };
    
    const renderAreaForm = () => {
        const commonFields = (
            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4">
                <p className="font-bold text-lg text-black dark:text-white">SERVICIO REALIZADO</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Téc. 1:</label>
                        <input type="text" value={currentUser.nombre} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha Inicio:</label>
                        <input type="text" value={formState.fecha_inicio || ''} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">H. Inicio:</label>
                        <input type="text" value={formState.hora_inicio || ''} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Téc. de Apoyo:</label>
                        <input type="text" name="tec_apoyo" value={formState.tec_apoyo || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                </div>
            </div>
        );

        switch (report.area) {
            case 'HARDWARE':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-red-500">ÁREA DE HARDWARE</h2>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center"><input type="checkbox" name="hw_laptop" checked={formState.hw_laptop || false} onChange={handleFormChange} className="h-4 w-4 mr-2" />LAPTOP</label>
                            <label className="flex items-center"><input type="checkbox" name="hw_pc" checked={formState.hw_pc || false} onChange={handleFormChange} className="h-4 w-4 mr-2" />PC</label>
                            <label className="flex items-center"><input type="checkbox" name="hw_otro" checked={formState.hw_otro || false} onChange={handleFormChange} className="h-4 w-4 mr-2" />OTRO</label>
                            <input type="text" name="hw_otro_spec" value={formState.hw_otro_spec || ''} onChange={handleFormChange} placeholder="Especificar" className="flex-1 p-2 border rounded-md dark:bg-gray-700"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center"><input type="checkbox" name="mant_hardware" checked={formState.mant_hardware || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Mant. de Hardware</label>
                            <label className="flex items-center"><input type="checkbox" name="reconstruccion" checked={formState.reconstruccion || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Reconstrucción</label>
                            <label className="flex items-center"><input type="checkbox" name="adapt_parlantes" checked={formState.adapt_parlantes || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Adapt. de Parlantes</label>
                        </div>
                        <div className="space-y-2">
                             <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center"><input type="checkbox" name="cambio_teclado" checked={formState.cambio_teclado || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Teclado:</label>
                                <input type="text" name="cambio_teclado_codigo" value={formState.cambio_teclado_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center"><input type="checkbox" name="cambio_pantalla" checked={formState.cambio_pantalla || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Pantalla:</label>
                                <input type="text" name="cambio_pantalla_codigo" value={formState.cambio_pantalla_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700"/>
                                <input type="text" name="cambio_pantalla_resolucion" value={formState.cambio_pantalla_resolucion || ''} onChange={handleFormChange} placeholder="Resolución" className="p-2 border rounded-md dark:bg-gray-700"/>
                                <input type="text" name="cambio_pantalla_hz" value={formState.cambio_pantalla_hz || ''} onChange={handleFormChange} placeholder="Hz" className="p-2 border rounded-md dark:bg-gray-700"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center"><input type="checkbox" name="cambio_carcasa" checked={formState.cambio_carcasa || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Carcasa:</label>
                                <input type="text" name="cambio_carcasa_obs" value={formState.cambio_carcasa_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center"><input type="checkbox" name="cambio_placa" checked={formState.cambio_placa || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Placa:</label>
                                <input type="text" name="cambio_placa_codigo" value={formState.cambio_placa_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700"/>
                                <input type="text" name="cambio_placa_especif" value={formState.cambio_placa_especif || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                             <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center"><input type="checkbox" name="cambio_fuente" checked={formState.cambio_fuente || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Fuente:</label>
                                <input type="text" name="cambio_fuente_codigo" value={formState.cambio_fuente_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700"/>
                                <input type="text" name="cambio_fuente_especif" value={formState.cambio_fuente_especif || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center"><input type="checkbox" name="cambio_video" checked={formState.cambio_video || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Tarj. Video:</label>
                                <input type="text" name="cambio_video_codigo" value={formState.cambio_video_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700"/>
                                <input type="text" name="cambio_video_especif" value={formState.cambio_video_especif || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center"><input type="checkbox" name="otros" checked={formState.otros || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Otros:</label>
                                <input type="text" name="otros_especif" value={formState.otros_especif || ''} onChange={handleFormChange} placeholder="Especificar" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <p className="font-semibold">Repotenciación:</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center"><input type="checkbox" name="repoten_ssd" checked={formState.repoten_ssd || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>SSD</label>
                                <input type="text" name="repoten_ssd_gb" value={formState.repoten_ssd_gb || ''} onChange={handleFormChange} placeholder="GB" className="p-2 border rounded-md dark:bg-gray-700 w-24"/>
                                <label className="flex items-center"><input type="checkbox" name="repoten_nvme" checked={formState.repoten_nvme || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>NVME</label>
                                <input type="text" name="repoten_nvme_gb" value={formState.repoten_nvme_gb || ''} onChange={handleFormChange} placeholder="GB" className="p-2 border rounded-md dark:bg-gray-700 w-24"/>
                                <label className="flex items-center"><input type="checkbox" name="repoten_m2" checked={formState.repoten_m2 || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>M2 SATA</label>
                                <input type="text" name="repoten_m2_gb" value={formState.repoten_m2_gb || ''} onChange={handleFormChange} placeholder="GB" className="p-2 border rounded-md dark:bg-gray-700 w-24"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center"><input type="checkbox" name="repoten_hdd" checked={formState.repoten_hdd || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>HDD</label>
                                <input type="text" name="repoten_hdd_gb" value={formState.repoten_hdd_gb || ''} onChange={handleFormChange} placeholder="GB" className="p-2 border rounded-md dark:bg-gray-700 w-24"/>
                                <input type="text" name="repoten_hdd_serie" value={formState.repoten_hdd_serie || ''} onChange={handleFormChange} placeholder="Serie" className="p-2 border rounded-md dark:bg-gray-700"/>
                                <input type="text" name="repoten_hdd_codigo" value={formState.repoten_hdd_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center"><input type="checkbox" name="repoten_ram" checked={formState.repoten_ram || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>MEMORIA RAM</label>
                                <input type="text" name="repoten_ram_cap" value={formState.repoten_ram_cap || ''} onChange={handleFormChange} placeholder="Capacidad" className="p-2 border rounded-md dark:bg-gray-700"/>
                                <input type="text" name="repoten_ram_cod" value={formState.repoten_ram_cod || ''} onChange={handleFormChange} placeholder="Cód." className="p-2 border rounded-md dark:bg-gray-700"/>
                            </div>
                        </div>
                        {commonFields}
                    </div>
                );
            case 'SOFTWARE':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-blue-500">ÁREA DE SOFTWARE</h2>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center"><input type="checkbox" name="sw_laptop" checked={formState.sw_laptop || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>LAPTOP</label>
                            <label className="flex items-center"><input type="checkbox" name="sw_pc" checked={formState.sw_pc || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>PC</label>
                            <label className="flex items-center"><input type="checkbox" name="sw_otro" checked={formState.sw_otro || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>OTRO</label>
                            <input type="text" name="sw_otro_spec" value={formState.sw_otro_spec || ''} onChange={handleFormChange} placeholder="Especificar" className="flex-1 p-2 border rounded-md dark:bg-gray-700"/>
                        </div>
                         <div className="space-y-2">
                            <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="backup" checked={formState.backup || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Backup de Información:</label><input type="text" name="backup_obs" value={formState.backup_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="clonacion" checked={formState.clonacion || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Clonación de Disco:</label><input type="text" name="clonacion_obs" value={formState.clonacion_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="formateo" checked={formState.formateo || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Formateo + Programas:</label><input type="text" name="formateo_obs" value={formState.formateo_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="drivers" checked={formState.drivers || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Instalación de Drivers:</label><input type="text" name="drivers_obs" value={formState.drivers_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="diseno" checked={formState.diseno || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Inst. de Prog. de Diseño:</label><input type="text" name="diseno_spec" value={formState.diseno_spec || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="ingenieria" checked={formState.ingenieria || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Inst. de Prog. de Ing.:</label><input type="text" name="ingenieria_spec" value={formState.ingenieria_spec || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="act_win" checked={formState.act_win || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Activación de Windows:</label><input type="text" name="act_win_obs" value={formState.act_win_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="act_office" checked={formState.act_office || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Activación de Office:</label><input type="text" name="act_office_obs" value={formState.act_office_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="optimizacion" checked={formState.optimizacion || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Optimización de sistema:</label><input type="text" name="optimizacion_obs" value={formState.optimizacion_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="sw_otros" checked={formState.sw_otros || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Otros:</label><input type="text" name="sw_otros_spec" value={formState.sw_otros_spec || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                        </div>
                        {commonFields}
                    </div>
                );
            case 'ELECTRONICA':
                return (
                     <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-yellow-500">ÁREA DE ELECTRÓNICA</h2>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center"><input type="checkbox" name="elec_video" checked={formState.elec_video || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>TARJ. VIDEO</label>
                            <label className="flex items-center"><input type="checkbox" name="elec_placa" checked={formState.elec_placa || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>PLACA</label>
                            <label className="flex items-center"><input type="checkbox" name="elec_otro" checked={formState.elec_otro || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>OTRO</label>
                        </div>
                        <div className="space-y-2">
                           <textarea name="elec_codigo" value={formState.elec_codigo || ''} onChange={handleFormChange} placeholder="Código" className="w-full p-2 border rounded-md dark:bg-gray-700" rows="2"></textarea>
                           <textarea name="elec_etapa" value={formState.elec_etapa || ''} onChange={handleFormChange} placeholder="Etapa" className="w-full p-2 border rounded-md dark:bg-gray-700" rows="2"></textarea>
                           <textarea name="elec_obs" value={formState.elec_obs || ''} onChange={handleFormChange} placeholder="Obs" className="w-full p-2 border rounded-md dark:bg-gray-700" rows="3"></textarea>
                        </div>
                        {commonFields}
                    </div>
                );
            default:
                return <p>Área no configurada.</p>;
        }
    };

    const flatHistory = useMemo(() => {
        if (!report || !report.diagnosticoPorArea) return [];
        return Object.entries(report.diagnosticoPorArea)
            .flatMap(([areaName, entries]) => 
                (Array.isArray(entries) ? entries : [entries]).map(entry => ({...entry, areaName}))
            )
            .filter(entry => entry.estado === 'FINALIZADO')
            .sort((a, b) => {
                // Ordenar por fecha y hora de finalización
                if (!a.fecha_fin || !b.fecha_fin) return 0;
                const dateA = new Date(`${a.fecha_fin.split('-').reverse().join('-')}T${a.hora_fin}`);
                const dateB = new Date(`${b.fecha_fin.split('-').reverse().join('-')}T${b.hora_fin}`);
                return dateA - dateB;
            });
    }, [report]);
    
    if (isLoading) return <div className="text-center p-8">Cargando informe...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;

    const isCurrentUserTechnician = report.tecnicoActualId === currentUser.uid;
    
    if (!isCurrentUserTechnician) {
        return <div className="text-center p-8 text-red-500">No tienes permiso para ver este informe.</div>;
    }
    
    const currentTaskState = report.diagnosticoPorArea[report.area]?.findLast(
        (entry) => entry.tecnicoId === currentUser.uid
    )?.estado || 'PENDIENTE';

    const filteredItems = report.items?.filter(item => item.checked || item.detalles) || [];

    const getTechnicianOptions = () => {
        if (nextArea === report.area) {
            return users.filter(u => u.value !== currentUser.uid);
        }
        return users;
    };
    
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
                    <p><strong>Sistema Operativo:</strong> {report.sistemaOperativo || 'N/A'}</p>
                    <p><strong>Clave Bitlocker:</strong> {report.bitlockerKey ? 'Sí' : 'No'}</p>
                    <p><strong>Motivo de Ingreso:</strong> {report.motivoIngreso}</p>
                    <p><strong>Técnico de Recepción:</strong> {report.tecnicoRecepcion}</p>
                    <p><strong>Técnico Testeo:</strong> {report.tecnicoTesteo || 'N/A'}</p>
                    <p><strong>Técnico Responsable:</strong> {report.tecnicoResponsable || 'N/A'}</p>
                    <p><strong>Área Actual:</strong> <span className="font-bold text-red-500">{report.area}</span></p>
                    <p><strong>Técnico Asignado:</strong> <span className="font-bold text-red-500">{report.tecnicoActual}</span></p>
                    <p><strong>Estado Tarea:</strong> <span className="font-bold text-red-500">{currentTaskState}</span></p>
                </div>
                 <div className="mt-4 border-t pt-4 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-green-500 mb-2">Componentes y Accesorios Registrados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {filteredItems.length > 0 ? (
                            filteredItems.map(item => (
                                <p key={item.id} className="truncate">
                                    <strong>{getComponentName(item.id, report.tipoEquipo)}:</strong> {item.detalles || 'OK'}
                                </p>
                            ))
                        ) : (<p className="text-gray-500 col-span-full">No se registraron componentes específicos.</p>)}
                    </div>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-500 mb-3">Historial de Intervenciones</h2>
                <div className="space-y-4">
                    {flatHistory.length > 0 ? (
                        flatHistory.map((entry, index) => (
                            <ReadOnlyEntry key={index} entry={entry} areaName={entry.areaName} />
                        ))
                    ) : (
                        <p className="text-gray-500">No hay intervenciones previas.</p>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 mt-6">
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
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">
                                Ubicación Física del Equipo
                                {nextArea !== 'TERMINADO' && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <input
                                type="text"
                                value={ubicacionFisica}
                                onChange={(e) => setUbicacionFisica(e.target.value)}
                                placeholder="Ej: Estante C3, Mesa de trabajo 5"
                                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                                    nextArea !== 'TERMINADO' && !ubicacionFisica ? 'ring-2 ring-red-500' : ''
                                }`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Pasar a la Siguiente Área</label>
                            <Select
                                options={[
                                    ...AREA_OPTIONS.map(area => ({value: area, label: area})),
                                    {value: 'TERMINADO', label: 'TERMINADO (Listo para entregar)'}
                                ]}
                                onChange={(option) => setNextArea(option.value)}
                                placeholder="Selecciona la siguiente área..."
                                styles={selectStyles(theme)}
                            />
                        </div>
                        {nextArea && nextArea !== 'TERMINADO' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Asignar a:</label>
                                <Select
                                    options={getTechnicianOptions()}
                                    value={tecnicoSiguiente}
                                    onChange={setTecnicoSiguiente}
                                    placeholder="Selecciona el técnico..."
                                    isClearable
                                    styles={selectStyles(theme)}
                                />
                            </div>
                        )}
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