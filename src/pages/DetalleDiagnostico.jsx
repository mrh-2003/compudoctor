import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDiagnosticReportById, updateDiagnosticReport } from '../services/diagnosticService';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaCheckCircle, FaCheck, FaTimes, FaTimesCircle  } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { ThemeContext } from '../context/ThemeContext';
import Modal from '../components/common/Modal';
import Select from 'react-select';
import { getAllUsersDetailed } from '../services/userService';

const FIELD_LABELS = {
    clientName: "Cliente",
    telefono: "Teléfono",
    tipoEquipo: "Tipo de Equipo",
    marca: "Marca",
    modelo: "Modelo",
    serie: "Serie",
    sistemaOperativo: "Sistema Operativo",
    bitlockerKey: "Clave Bitlocker",
    observaciones: "Observaciones de Recepción",
    motivoIngreso: "Motivo de Ingreso",
    area: "Área de Destino",
    tecnicoRecepcion: "Técnico de Recepción",
    tecnicoTesteo: "Técnico de Testeo",
    tecnicoResponsable: "Técnico Responsable",
    ubicacionFisica: "Ubicación Física",
    procesador: "Procesador", placaMadre: "Placa Madre", memoriaRam: "Memoria RAM", hdd: "HDD", 
    ssd: "SSD", m2Nvme: "M2 Nvme", tarjetaVideo: "Tarjeta de video", wifi: "Wi-Fi", 
    bateria: "Batería", cargador: "Cargador", pantalla: "Pantalla", teclado: "Teclado", 
    camara: "Cámara", microfono: "Micrófono", parlantes: "Parlantes", auriculares: "Auriculares", 
    rj45: "RJ 45", hdmi: "HDMI", vga: "VGA", usb: "USB", tipoC: "Tipo C", lectora: "Lectora", 
    touchpad: "Touchpad", otros: "Otros", rodillos: "Rodillos", cabezal: "Cabezal", tinta: "Cartuchos/Tinta", bandejas: "Bandejas",
    mant_hardware: "Mantenimiento de Hardware",
    reconstruccion: "Reconstrucción",
    adapt_parlantes: "Adaptación de Parlantes",
    cambio_teclado: "Cambio de Teclado",
    cambio_teclado_codigo: "Código de Teclado",
    cambio_pantalla: "Cambio de Pantalla",
    cambio_pantalla_codigo: "Código Pantalla",
    cambio_pantalla_resolucion: "Resolución",
    cambio_pantalla_hz: "Hz",
    cambio_carcasa: "Cambio de Carcasa",
    cambio_carcasa_obs: "Obs. Carcasa",
    cambio_placa: "Cambio de Placa",
    cambio_placa_codigo: "Código Placa",
    cambio_placa_especif: "Especif. Placa",
    cambio_fuente: "Cambio de Fuente",
    cambio_fuente_codigo: "Código Fuente",
    cambio_fuente_especif: "Especif. Fuente",
    cambio_video: "Cambio de Tarjeta de Video",
    cambio_video_codigo: "Código Video",
    cambio_video_especif: "Especif. Video",
    otros_especif: "Especificación Otros",
    repoten_ssd: "Repotenciación SSD",
    repoten_ssd_gb: "GB SSD",
    repoten_ssd_serie: "Serie SSD",
    repoten_nvme: "Repotenciación NVME",
    repoten_nvme_gb: "GB NVME",
    repoten_nvme_serie: "Serie NVME",
    repoten_m2: "Repotenciación M2 SATA",
    repoten_m2_gb: "GB M2 SATA",
    repoten_m2_serie: "Serie M2 SATA",
    repoten_hdd: "Repotenciación HDD",
    repoten_hdd_gb: "GB HDD",
    repoten_hdd_serie: "Serie de HDD",
    repoten_hdd_codigo: "Código de HDD",
    repoten_ram: "Repotenciación RAM",
    repoten_ram_cap: "Capacidad RAM",
    repoten_ram_cod: "Código de RAM",
    backup: "Backup de Información",
    backup_obs: "Obs. Backup",
    clonacion: "Clonación de Disco",
    clonacion_obs: "Obs. Clonación",
    formateo: "Formateo + Programas",
    formateo_obs: "Obs. Formateo",
    drivers: "Instalación de Drivers",
    drivers_obs: "Obs. Drivers",
    diseno: "Instalación de Prog. de Diseño",
    diseno_spec: "Especif. Prog. Diseño",
    ingenieria: "Instalación de Prog. de Ingeniería",
    ingenieria_spec: "Especif. Prog. Ingeniería",
    act_win: "Activación de Windows",
    act_win_obs: "Obs. Activación Win.",
    act_office: "Activación de Office",
    act_office_obs: "Obs. Activación Off.",
    optimizacion: "Optimización de sistema",
    optimizacion_obs: "Obs. Optimización",
    sw_otros: "Otros Software",
    sw_otros_spec: "Especif. Otros Software",
    elec_video: "Rep. Tarj. Video",
    elec_placa: "Rep. Placa",
    elec_otro: "Rep. Otro",
    elec_codigo: "Código Electrónica",
    elec_etapa: "Etapa Electrónica",
    elec_obs: "Observación Electrónica",
    tec_apoyo: "Técnico de Apoyo",
    testeo_procesador: "Procesador",
    testeo_video_dedicado: "Video Dedicado",
    testeo_memoria_ram: "Memoria RAM",
    testeo_disco: "Disco (SI/NO)",
    testeo_disco_obs: "Obs. Disco",
    testeo_pantalla: "Pantalla (SI/NO)",
    testeo_pantalla_obs: "Obs. Pantalla",
    testeo_bateria: "Batería (SI/NO)",
    testeo_bateria_obs: "Obs. Batería",
    testeo_cargador: "Cargador (SI/NO)",
    testeo_cargador_obs: "Obs. Cargador",
    testeo_camara: "Cámara (SI/NO)",
    testeo_camara_obs: "Obs. Cámara",
    testeo_microfono: "Micrófono (SI/NO)",
    testeo_microfono_obs: "Obs. Micrófono",
    testeo_auricular: "Auricular (SI/NO)",
    testeo_auricular_obs: "Obs. Auricular",
    testeo_parlantes: "Parlantes (SI/NO)",
    testeo_parlantes_obs: "Obs. Parlantes",
    testeo_teclado: "Teclado (SI/NO)",
    testeo_teclado_obs: "Obs. Teclado",
    testeo_lectora: "Lectora (SI/NO)",
    testeo_lectora_obs: "Obs. Lectora",
    testeo_touchpad: "Touchpad (SI/NO)",
    testeo_touchpad_obs: "Obs. Touchpad",
    testeo_wifi: "WiFi (SI/NO)",
    testeo_wifi_obs: "Obs. WiFi",
    testeo_rj45: "RJ45 (SI/NO)",
    testeo_rj45_obs: "Obs. RJ45",
    testeo_usb: "USB (SI/NO)",
    testeo_usb_obs: "Obs. USB",
    testeo_tipo_c: "Tipo C (SI/NO)",
    testeo_tipo_c_obs: "Obs. Tipo C",
    testeo_hdmi: "HDMI (SI/NO)",
    testeo_hdmi_obs: "Obs. HDMI",
    testeo_vga: "VGA (SI/NO)",
    testeo_vga_obs: "Obs. VGA",
    testeo_otros: "Otros Testeo (SI/NO)",
    testeo_otros_obs: "Obs. Otros Testeo",
    testeo_servicio_final: "Servicio Realizado Final"
};

const GROUPED_FIELDS_CONFIG = {
    cambio_teclado: ["cambio_teclado_codigo"],
    cambio_pantalla: ["cambio_pantalla_codigo", "cambio_pantalla_resolucion", "cambio_pantalla_hz"],
    cambio_carcasa: ["cambio_carcasa_obs"],
    cambio_placa: ["cambio_placa_codigo", "cambio_placa_especif"],
    cambio_fuente: ["cambio_fuente_codigo", "cambio_fuente_especif"],
    cambio_video: ["cambio_video_codigo", "cambio_video_especif"],
    repoten_ssd: ["repoten_ssd_gb", "repoten_ssd_serie"],
    repoten_nvme: ["repoten_nvme_gb", "repoten_nvme_serie"],
    repoten_m2: ["repoten_m2_gb", "repoten_m2_serie"],
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
    elec_otro: ["elec_codigo", "elec_etapa", "elec_obs"],
    testeo_disco: ["testeo_disco_obs"],
    testeo_pantalla: ["testeo_pantalla_obs"],
    testeo_bateria: ["testeo_bateria_obs"],
    testeo_cargador: ["testeo_cargador_obs"],
    testeo_camara: ["testeo_camara_obs"],
    testeo_microfono: ["testeo_microfono_obs"],
    testeo_auricular: ["testeo_auricular_obs"],
    testeo_parlantes: ["testeo_parlantes_obs"],
    testeo_teclado: ["testeo_teclado_obs"],
    testeo_lectora: ["testeo_lectora_obs"],
    testeo_touchpad: ["testeo_touchpad_obs"],
    testeo_wifi: ["testeo_wifi_obs"],
    testeo_rj45: ["testeo_rj45_obs"],
    testeo_usb: ["testeo_usb_obs"],
    testeo_tipo_c: ["testeo_tipo_c_obs"],
    testeo_hdmi: ["testeo_hdmi_obs"],
    testeo_vga: ["testeo_vga_obs"],
    testeo_otros: ["testeo_otros_obs"],
};

const IGNORED_KEYS = new Set([
    'tecnico', 'reparacion', 'fecha_inicio', 'hora_inicio', 'fecha_fin', 'hora_fin', 'estado', 'tecnicoId', 'areaName', 'hw_tipo', 'sw_tipo', 'ubicacionFisica', 'tec_apoyoId'
]);

const ALL_COMPONENTS_MAP = {
    "procesador": "Procesador", "placaMadre": "Placa Madre", "memoriaRam": "Memoria RAM", "hdd": "HDD", 
    "ssd": "SSD", "m2Nvme": "M2 Nvme", "tarjetaVideo": "Tarjeta de video", "wifi": "Wi-Fi", 
    "bateria": "Batería", "cargador": "Cargador", "pantalla": "Pantalla", "teclado": "Teclado", 
    "camara": "Cámara", "microfono": "Micrófono", "parlantes": "Parlantes", "auriculares": "Auriculares", 
    "rj45": "RJ 45", "hdmi": "HDMI", "vga": "VGA", "usb": "USB", "tipoC": "Tipo C", 
    "lectora": "Lectora", "touchpad": "Touchpad", "otros": "Otros", "rodillos": "Rodillos", 
    "cabezal": "Cabezal", "tinta": "Cartuchos/Tinta", "bandejas": "Bandejas"
};

const getComponentName = (itemId) => {
    return ALL_COMPONENTS_MAP[itemId] || itemId;
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
    const processedKeys = new Set(IGNORED_KEYS);
    const detailsToShow = [];

    const availableGroups = {};
    Object.keys(GROUPED_FIELDS_CONFIG).forEach(groupKey => {
        const isChecked = entry[groupKey] === true;
        
        const subDetails = GROUPED_FIELDS_CONFIG[groupKey].map(subKey => ({
            key: subKey,
            label: FIELD_LABELS[subKey] || subKey,
            value: entry[subKey],
            type: 'text' 
        })).filter(item => item.value && String(item.value).trim() !== "");

        const hasDetails = subDetails.length > 0;
        
        if (isChecked || hasDetails) { 
            availableGroups[groupKey] = {
                isChecked: isChecked,
                subDetails: subDetails
            };
            
            processedKeys.add(groupKey);
            availableGroups[groupKey].subDetails.forEach(item => processedKeys.add(item.key));
        } else {
             GROUPED_FIELDS_CONFIG[groupKey].forEach(subKey => processedKeys.add(subKey));
        }
    });

    for (const key in entry) {
        if (processedKeys.has(key) || typeof entry[key] === 'object' || key.endsWith('Id') || key.startsWith('sw_tipo') || key.startsWith('hw_tipo')) continue;

        let value = entry[key];
        let label = FIELD_LABELS[key] || key;

        if (key in availableGroups) {
             continue; 
        } else if (typeof value === 'boolean') {
            if (!value) continue;
            
            detailsToShow.push({
                key,
                label,
                value: value ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-500" />,
                type: 'check'
            });
        } else if (value && String(value).trim() !== '') {
            detailsToShow.push({
                key,
                label,
                value: String(value),
                type: 'text'
            });
        }
    }

    const taskStatus = entry.estado === 'TERMINADO' ? 'TERMINADO' : 'ASIGNADO';

    const hasAdditionalDetails = detailsToShow.length > 0 || Object.keys(availableGroups).length > 0;

    return (
        <div className="border p-3 rounded-md mt-2 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-sm">
            <h3 className="font-bold text-lg text-blue-500 dark:text-blue-400">Intervención en {areaName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                <div><strong className="font-semibold">Técnico:</strong> {entry.tecnico}</div>
                <div><strong className="font-semibold">Ubicación Física:</strong> {entry.ubicacionFisica || 'N/A'}</div>
                <div><strong className="font-semibold">Fechas:</strong> {entry.fecha_inicio} {entry.hora_inicio} - {entry.fecha_fin || 'N/A'} {entry.hora_fin || ''}</div>
                <div><strong className="font-semibold">Estado:</strong> <span className={`font-semibold ${taskStatus === 'TERMINADO' ? 'text-green-600' : 'text-orange-500'}`}>{taskStatus}</span></div>
            </div>
            {entry.reparacion && (
                <div className="mt-2 pt-2 border-t dark:border-gray-600">
                    <strong className="block font-semibold">Descripción del Trabajo:</strong>
                    <span>{entry.reparacion}</span>
                </div>
            )}
            
            {hasAdditionalDetails && (
                <div className="mt-2 border-t pt-2 dark:border-gray-600">
                    <h4 className="font-semibold mb-2 text-indigo-500">Detalles Adicionales:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {detailsToShow.map(({ key, label, value, type }) => (
                            <div key={key} className="flex flex-wrap items-center">
                                <strong className="mr-1">{label}:</strong>
                                {type === 'check' ? value : <span>{value}</span>}
                            </div>
                        ))}
                        {Object.keys(availableGroups).map(groupKey => (
                            <div key={groupKey} className="col-span-full mb-1">
                                <span className="font-bold">{FIELD_LABELS[groupKey] || groupKey}:</span> 
                                {availableGroups[groupKey].isChecked && <FaCheck className="text-green-500 inline ml-1 mr-2" />}
                                {availableGroups[groupKey].subDetails.map(item => (
                                    <span key={item.key} className="ml-2 block md:inline">
                                        <em>{item.label}:</em> {item.value}
                                    </span>
                                ))}
                            </div>
                        ))}
                        
                    </div>
                </div>
            )}
        </div>
    );
};

const ComponentItem = ({ item }) => {
    const isChecked = item.checked;
    const hasDetails = item.detalles && item.detalles.trim() !== '';

    if (!isChecked && !hasDetails) return null;
    
    return (
        <div className="flex items-center space-x-2 text-sm">
            {isChecked ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-gray-400" />}
            <span className="font-semibold">{item.name}:</span>
            <span className="text-gray-700 dark:text-gray-300">{item.detalles || (isChecked ? 'OK' : 'N/A')}</span>
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
    const [tecnicoApoyo, setTecnicoApoyo] = useState(null);
    const [ubicacionFisica, setUbicacionFisica] = useState('');

    const AREA_OPTIONS_CONSTANT = ['SOFTWARE', 'HARDWARE', 'ELECTRONICA', 'TESTEO'];

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const fetchedReport = await getDiagnosticReportById(reportId);
                setReport(fetchedReport);

                const currentAreaHistory = fetchedReport.diagnosticoPorArea[fetchedReport.area];
                const lastEntry = currentAreaHistory && currentAreaHistory[currentAreaHistory.length - 1];

                setFormState(lastEntry || {});

                setUbicacionFisica(fetchedReport.ubicacionFisica || '');

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
    }, [reportId]);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleRadioChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleOpenCompletionModal = () => setIsCompletionModalOpen(true);
    const handleCloseCompletionModal = () => {
        setIsCompletionModalOpen(false);
        setNextArea('');
        setReparacionFinal('');
        setTecnicoSiguiente(null);
        setUbicacionFisica(report?.ubicacionFisica || '');
        setTecnicoApoyo(null);
    };
    
    const handleCompleteTask = async (e) => {
        e.preventDefault();
        if (!reparacionFinal) return toast.error('La descripción de la reparación es obligatoria.');
        if (!nextArea) return toast.error('Debes seleccionar la siguiente área o marcar como terminado.');
        if (!ubicacionFisica) return toast.error('Debes ingresar la ubicación física.');
        if (nextArea !== 'TERMINADO' && !tecnicoSiguiente) return toast.error('Debes asignar un técnico para la siguiente área.');
        if (nextArea === report.area && tecnicoSiguiente?.label === currentUser.nombre) {
            return toast.error('No puedes reasignarte el informe a ti mismo en la misma área.');
        }

        try {
            const now = new Date();
            const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
            const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
            const currentAreaHistory = [...(report.diagnosticoPorArea[report.area] || [])];
            const lastEntryIndex = currentAreaHistory.length - 1;
            
            const currentEntry = currentAreaHistory[lastEntryIndex];

            currentAreaHistory[lastEntryIndex] = {
                ...currentEntry,
                ...formState,
                reparacion: reparacionFinal,
                tec_apoyo: tecnicoApoyo?.label || '',
                tec_apoyoId: tecnicoApoyo?.value || '',
                fecha_fin: formattedDate,
                hora_fin: formattedTime,
                estado: 'TERMINADO',
            };
    
            const updatedDiagnosticoPorArea = {
                ...report.diagnosticoPorArea,
                [report.area]: currentAreaHistory,
            };

            const nextTechnician = tecnicoSiguiente || users.find(u => u.value === report.tecnicoResponsableId);
            const nextTechnicianName = nextTechnician?.label || report.tecnicoResponsable || 'N/A';
            const nextTechnicianId = nextTechnician?.value || report.tecnicoResponsableId || 'N/A';
            
            const updatedData = {
                diagnosticoPorArea: updatedDiagnosticoPorArea,
                estado: nextArea === 'TERMINADO' ? nextArea : 'ASIGNADO',
                area: nextArea !== 'TERMINADO' ? nextArea : report.area,
                tecnicoActual: nextArea === 'TERMINADO' ? report.tecnicoActual : nextTechnicianName,
                tecnicoActualId: nextArea === 'TERMINADO' ? report.tecnicoActualId : nextTechnicianId,
                ubicacionFisica: ubicacionFisica,
            };
    
            if (nextArea !== 'TERMINADO') {
                const newAreaHistory = [...(updatedDiagnosticoPorArea[nextArea] || [])];
                newAreaHistory.push({
                    reparacion: '',
                    tecnico: nextTechnicianName,
                    tecnicoId: nextTechnicianId,
                    ubicacionFisica: ubicacionFisica,
                    fecha_inicio: formattedDate,
                    hora_inicio: formattedTime,
                    fecha_fin: '',
                    hora_fin: '',
                    estado: 'ASIGNADO',
                });
                updatedData.diagnosticoPorArea[nextArea] = newAreaHistory;
            }  
    
            await updateDiagnosticReport(reportId, updatedData);
            toast.success('Tarea completada con éxito.');
            handleCloseCompletionModal();
            navigate('/bandeja-tecnico');
    
        } catch (error) {
            toast.error('Error al actualizar el informe.');
            console.error(error);
        }
    };

    const nextAreaOptions = useMemo(() => {
        if (!report) return [];
        if (report.area === 'TESTEO') {
            return [
                ...AREA_OPTIONS_CONSTANT.map(area => ({value: area, label: area})),
                {value: 'TERMINADO', label: 'TERMINADO (Listo para entregar)'}
            ];
        } else {
            return AREA_OPTIONS_CONSTANT.map(area => ({value: area, label: area}));
        }
    }, [report]);
    
    const techniciansForNextArea = useMemo(() => {
        if (!report) return users;
        
        if (nextArea === report.area) { 
            return users.filter(u => u.value !== currentUser.uid);
        }
        return users;
    }, [nextArea, report, users, currentUser.uid]);

    const flatHistory = useMemo(() => {
        if (!report) return [];
        return Object.entries(report.diagnosticoPorArea)
            .flatMap(([areaName, entries]) => 
                (Array.isArray(entries) ? entries : [entries]).map(entry => ({...entry, areaName}))
            )
            .filter(entry => entry.estado === 'TERMINADO')
            .sort((a, b) => {
                const dateA = new Date(`${a.fecha_fin.split('-').reverse().join('-')}T${a.hora_fin}`);
                const dateB = new Date(`${b.fecha_fin.split('-').reverse().join('-')}T${b.hora_fin}`);
                return dateB - dateA;
            });
    }, [report]);
    
    if (isLoading) return <div className="text-center p-8">Cargando informe...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;
    
    const isCurrentUserTechnician = report.tecnicoActual === currentUser.nombre;
    
    if (!isCurrentUserTechnician) {
        return <div className="text-center p-8 text-red-500">No tienes permiso para ver este informe.</div>;
    }

    const renderAreaForm = () => {
        const techniciansForSupport = users.filter(u => u.value !== currentUser.uid);

        const commonFields = (
            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4">
                <p className="font-bold text-lg text-black dark:text-white">SERVICIO EN CURSO</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Técnico Actual:</label>
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
                    <div className="col-span-full">
                        <label className="block text-sm font-medium mb-1">Técnico de Apoyo (Opcional):</label>
                         <Select
                            options={techniciansForSupport}
                            value={tecnicoApoyo}
                            onChange={setTecnicoApoyo}
                            placeholder="Selecciona un técnico de apoyo..."
                            isClearable
                            styles={selectStyles(theme)}
                        />
                    </div>
                </div>
            </div>
        );

        switch (report.area) {
            case 'HARDWARE':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-red-500">ÁREA DE HARDWARE</h2>
                        {commonFields}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md dark:border-gray-700">
                            <label className="flex items-center"><input type="checkbox" name="mant_hardware" checked={formState.mant_hardware || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Mant. de Hardware</label>
                            <label className="flex items-center"><input type="checkbox" name="reconstruccion" checked={formState.reconstruccion || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Reconstrucción</label>
                            <label className="flex items-center"><input type="checkbox" name="adapt_parlantes" checked={formState.adapt_parlantes || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Adapt. de Parlantes</label>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700">
                             <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_teclado" checked={formState.cambio_teclado || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Teclado:</label>
                                <input type="text" name="cambio_teclado_codigo" value={formState.cambio_teclado_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_pantalla" checked={formState.cambio_pantalla || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Pantalla:</label>
                                <input type="text" name="cambio_pantalla_codigo" value={formState.cambio_pantalla_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                                <input type="text" name="cambio_pantalla_resolucion" value={formState.cambio_pantalla_resolucion || ''} onChange={handleFormChange} placeholder="Resolución" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                                <input type="text" name="cambio_pantalla_hz" value={formState.cambio_pantalla_hz || ''} onChange={handleFormChange} placeholder="Hz" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_carcasa" checked={formState.cambio_carcasa || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Carcasa:</label>
                                <input type="text" name="cambio_carcasa_obs" value={formState.cambio_carcasa_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_placa" checked={formState.cambio_placa || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Placa:</label>
                                <input type="text" name="cambio_placa_codigo" value={formState.cambio_placa_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                                <input type="text" name="cambio_placa_especif" value={formState.cambio_placa_especif || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                             <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_fuente" checked={formState.cambio_fuente || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Fuente:</label>
                                <input type="text" name="cambio_fuente_codigo" value={formState.cambio_fuente_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                                <input type="text" name="cambio_fuente_especif" value={formState.cambio_fuente_especif || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_video" checked={formState.cambio_video || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Cambio de Tarj. Video:</label>
                                <input type="text" name="cambio_video_codigo" value={formState.cambio_video_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                                <input type="text" name="cambio_video_especif" value={formState.cambio_video_especif || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="otros" checked={formState.otros || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Otros:</label>
                                <input type="text" name="otros_especif" value={formState.otros_especif || ''} onChange={ handleFormChange} placeholder="Especificar" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700">
                             <p className="font-semibold mb-3">Repotenciación:</p>
                             
                            {/* SSD */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_ssd" checked={formState.repoten_ssd || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>SSD</label>
                                <input type="text" name="repoten_ssd_gb" value={formState.repoten_ssd_gb || ''} onChange={handleFormChange} placeholder="GB" className="p-2 border rounded-md dark:bg-gray-700 w-24"/>
                                <input type="text" name="repoten_ssd_serie" value={formState.repoten_ssd_serie || ''} onChange={handleFormChange} placeholder="Serie" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>

                            {/* NVME */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_nvme" checked={formState.repoten_nvme || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>NVME</label>
                                <input type="text" name="repoten_nvme_gb" value={formState.repoten_nvme_gb || ''} onChange={handleFormChange} placeholder="GB" className="p-2 border rounded-md dark:bg-gray-700 w-24"/>
                                <input type="text" name="repoten_nvme_serie" value={formState.repoten_nvme_serie || ''} onChange={handleFormChange} placeholder="Serie" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>

                            {/* M2 SATA */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_m2" checked={formState.repoten_m2 || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>M2 SATA</label>
                                <input type="text" name="repoten_m2_gb" value={formState.repoten_m2_gb || ''} onChange={handleFormChange} placeholder="GB" className="p-2 border rounded-md dark:bg-gray-700 w-24"/>
                                <input type="text" name="repoten_m2_serie" value={formState.repoten_m2_serie || ''} onChange={handleFormChange} placeholder="Serie" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>

                            {/* HDD (Keeping GB, Serie, Código) */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_hdd" checked={formState.repoten_hdd || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>HDD</label>
                                <input type="text" name="repoten_hdd_gb" value={formState.repoten_hdd_gb || ''} onChange={handleFormChange} placeholder="GB" className="p-2 border rounded-md dark:bg-gray-700 w-24"/>
                                <input type="text" name="repoten_hdd_serie" value={formState.repoten_hdd_serie || ''} onChange={handleFormChange} placeholder="Serie" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                                <input type="text" name="repoten_hdd_codigo" value={formState.repoten_hdd_codigo || ''} onChange={handleFormChange} placeholder="Código" className="p-2 border rounded-md dark:bg-gray-700 w-24"/>
                            </div>

                            {/* MEMORIA RAM (Keeping Capacidad, Código) */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_ram" checked={formState.repoten_ram || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>MEMORIA RAM</label>
                                <input type="text" name="repoten_ram_cap" value={formState.repoten_ram_cap || ''} onChange={handleFormChange} placeholder="Capacidad" className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                                <input type="text" name="repoten_ram_cod" value={formState.repoten_ram_cod || ''} onChange={handleFormChange} placeholder="Cód." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/>
                            </div>
                        </div>
                    </div>
                );
            case 'SOFTWARE':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-blue-500">ÁREA DE SOFTWARE</h2>
                        {commonFields}
                        <div className="space-y-3 border p-4 rounded-md dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="backup" checked={formState.backup || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Backup de Información:</label><input type="text" name="backup_obs" value={formState.backup_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="clonacion" checked={formState.clonacion || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Clonación de Disco:</label><input type="text" name="clonacion_obs" value={formState.clonacion_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="formateo" checked={formState.formateo || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Formateo + Programas:</label><input type="text" name="formateo_obs" value={formState.formateo_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="drivers" checked={formState.drivers || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Instalación de Drivers:</label><input type="text" name="drivers_obs" value={formState.drivers_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="act_win" checked={formState.act_win || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Activación de Windows:</label><input type="text" name="act_win_obs" value={formState.act_win_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="act_office" checked={formState.act_office || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Activación de Office:</label><input type="text" name="act_office_obs" value={formState.act_office_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="optimizacion" checked={formState.optimizacion || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Optimización de sistema:</label><input type="text" name="optimizacion_obs" value={formState.optimizacion_obs || ''} onChange={handleFormChange} placeholder="Obs." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="sw_otros" checked={formState.sw_otros || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Otros:</label><input type="text" name="sw_otros_spec" value={formState.sw_otros_spec || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="diseno" checked={formState.diseno || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Inst. de Prog. de Diseño:</label><input type="text" name="diseno_spec" value={formState.diseno_spec || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="ingenieria" checked={formState.ingenieria || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>Inst. de Prog. de Ing.:</label><input type="text" name="ingenieria_spec" value={formState.ingenieria_spec || ''} onChange={handleFormChange} placeholder="Especif." className="p-2 border rounded-md dark:bg-gray-700 flex-1"/></div>
                            </div>
                        </div>
                    </div>
                );
            case 'ELECTRONICA':
                return (
                     <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-yellow-500">ÁREA DE ELECTRÓNICA</h2>
                        {commonFields}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md dark:border-gray-700">
                            <label className="flex items-center"><input type="checkbox" name="elec_video" checked={formState.elec_video || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>TARJ. VIDEO</label>
                            <label className="flex items-center"><input type="checkbox" name="elec_placa" checked={formState.elec_placa || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>PLACA</label>
                            <label className="flex items-center"><input type="checkbox" name="elec_otro" checked={formState.elec_otro || false} onChange={handleFormChange} className="h-4 w-4 mr-2"/>OTRO</label>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700">
                           <textarea name="elec_codigo" value={formState.elec_codigo || ''} onChange={handleFormChange} placeholder="Código" className="w-full p-2 border rounded-md dark:bg-gray-700" rows="2"></textarea>
                           <textarea name="elec_etapa" value={formState.elec_etapa || ''} onChange={handleFormChange} placeholder="Etapa" className="w-full p-2 border rounded-md dark:bg-gray-700" rows="2"></textarea>
                           <textarea name="elec_obs" value={formState.elec_obs || ''} onChange={handleFormChange} placeholder="Obs" className="w-full p-2 border rounded-md dark:bg-gray-700" rows="3"></textarea>
                        </div>
                    </div>
                );
            case 'TESTEO':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-purple-500">ÁREA DE TESTEO</h2>
                        {commonFields}
                        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 p-3 rounded-md text-sm">
                            <p className="font-semibold mb-1">Instrucciones:</p>
                            <p>Marcar en orden si <strong>FUNCIONA</strong> o <strong>NO FUNCIONA</strong> el periférico testeado. Si el equipo no tiene el periférico escribirlo en <strong>OBSERVACIONES: "NO TIENE"</strong>. Si el periférico al testear tiene algún detalle escribirlo en <strong>OBSERVACIONES</strong> especificándolo. OJO: VERIFICAR SI EL TECLADO ILUMINA O NO ASÍ COMO LA PANTALLA SI ES TÁCTIL O NO Y ESCRIBIRLO EN OBSERVACIONES.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-md dark:border-gray-700">
                            <div className="space-y-3">
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Procesador:</label>
                                    <input type="text" name="testeo_procesador" value={formState.testeo_procesador || ''} onChange={handleFormChange} placeholder="Obs." className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Video Dedicado:</label>
                                    <input type="text" name="testeo_video_dedicado" value={formState.testeo_video_dedicado || ''} onChange={handleFormChange} placeholder="Obs." className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Memoria Ram:</label>
                                    <input type="text" name="testeo_memoria_ram" value={formState.testeo_memoria_ram || ''} onChange={handleFormChange} placeholder="Obs." className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Disco:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_disco" value="SI" checked={formState.testeo_disco === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_disco" value="NO" checked={formState.testeo_disco === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_disco_obs" value={formState.testeo_disco_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Pantalla:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_pantalla" value="SI" checked={formState.testeo_pantalla === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_pantalla" value="NO" checked={formState.testeo_pantalla === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_pantalla_obs" value={formState.testeo_pantalla_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Batería:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_bateria" value="SI" checked={formState.testeo_bateria === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_bateria" value="NO" checked={formState.testeo_bateria === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_bateria_obs" value={formState.testeo_bateria_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Cargador:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_cargador" value="SI" checked={formState.testeo_cargador === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_cargador" value="NO" checked={formState.testeo_cargador === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_cargador_obs" value={formState.testeo_cargador_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Cámara:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_camara" value="SI" checked={formState.testeo_camara === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_camara" value="NO" checked={formState.testeo_camara === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_camara_obs" value={formState.testeo_camara_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Micrófono:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_microfono" value="SI" checked={formState.testeo_microfono === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_microfono" value="NO" checked={formState.testeo_microfono === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_microfono_obs" value={formState.testeo_microfono_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Auricular:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_auricular" value="SI" checked={formState.testeo_auricular === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_auricular" value="NO" checked={formState.testeo_auricular === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_auricular_obs" value={formState.testeo_auricular_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Parlantes:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_parlantes" value="SI" checked={formState.testeo_parlantes === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_parlantes" value="NO" checked={formState.testeo_parlantes === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_parlantes_obs" value={formState.testeo_parlantes_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Teclado:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_teclado" value="SI" checked={formState.testeo_teclado === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_teclado" value="NO" checked={formState.testeo_teclado === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_teclado_obs" value={formState.testeo_teclado_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Lectora:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_lectora" value="SI" checked={formState.testeo_lectora === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_lectora" value="NO" checked={formState.testeo_lectora === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_lectora_obs" value={formState.testeo_lectora_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Touchpad:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_touchpad" value="SI" checked={formState.testeo_touchpad === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_touchpad" value="NO" checked={formState.testeo_touchpad === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_touchpad_obs" value={formState.testeo_touchpad_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Wifi:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_wifi" value="SI" checked={formState.testeo_wifi === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_wifi" value="NO" checked={formState.testeo_wifi === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_wifi_obs" value={formState.testeo_wifi_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">RJ45:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_rj45" value="SI" checked={formState.testeo_rj45 === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_rj45" value="NO" checked={formState.testeo_rj45 === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_rj45_obs" value={formState.testeo_rj45_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">USB:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_usb" value="SI" checked={formState.testeo_usb === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_usb" value="NO" checked={formState.testeo_usb === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_usb_obs" value={formState.testeo_usb_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Tipo C:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_tipo_c" value="SI" checked={formState.testeo_tipo_c === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_tipo_c" value="NO" checked={formState.testeo_tipo_c === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_tipo_c_obs" value={formState.testeo_tipo_c_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">HDMI:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_hdmi" value="SI" checked={formState.testeo_hdmi === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_hdmi" value="NO" checked={formState.testeo_hdmi === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_hdmi_obs" value={formState.testeo_hdmi_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">VGA:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_vga" value="SI" checked={formState.testeo_vga === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_vga" value="NO" checked={formState.testeo_vga === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_vga_obs" value={formState.testeo_vga_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Otros:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_otros" value="SI" checked={formState.testeo_otros === 'SI'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_otros" value="NO" checked={formState.testeo_otros === 'NO'} onChange={handleRadioChange} className="h-4 w-4 mr-1"/>NO
                                        </label>
                                        <input type="text" name="testeo_otros_obs" value={formState.testeo_otros_obs || ''} onChange={handleFormChange} placeholder="Obs." className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                         <div className="border-t pt-4 dark:border-gray-700">
                            <h3 className="font-bold text-lg mb-3">SERVICIO REALIZADO FINAL</h3>
                            <textarea name="testeo_servicio_final" value={formState.testeo_servicio_final || ''} onChange={handleFormChange} placeholder="Descripción del servicio realizado" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" rows="4"></textarea>
                        </div>
                    </div>
                );
            default:
                return <p>Área no configurada.</p>;
        }
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <p><strong>Cliente:</strong> {report.clientName || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> {report.telefono || 'N/A'}</p>
                    <p><strong>Tipo de Equipo:</strong> {report.tipoEquipo || 'N/A'}</p>
                    <p><strong>Marca:</strong> {report.marca || 'N/A'}</p>
                    <p><strong>Modelo:</strong> {report.modelo || 'N/A'}</p>
                    <p><strong>Serie:</strong> {report.serie || 'N/A'}</p>
                    <p><strong>Sistema Operativo:</strong> {report.sistemaOperativo || 'N/A'}</p>
                    <p><strong>Clave Bitlocker:</strong> {report.bitlockerKey ? 'Sí' : 'No'}</p>
                    <p><strong>Observaciones de Recepción:</strong> {report.observaciones || 'N/A'}</p>
                    <p><strong>Motivo de Ingreso:</strong> {report.motivoIngreso || 'N/A'}</p>
                    <p><strong>Detalles de Pago:</strong> {report.detallesPago || 'N/A'}</p>
                    <p><strong>Técnico de Recepción:</strong> {report.tecnicoRecepcion || 'N/A'}</p>
                    <p><strong>Técnico de Testeo:</strong> {report.tecnicoTesteo || 'N/A'}</p>
                    <p><strong>Técnico Responsable:</strong> {report.tecnicoResponsable || 'N/A'}</p>
                    <p><strong>Área Actual:</strong> <span className="font-bold text-red-500">{report.area || 'N/A'}</span></p>
                    <p><strong>Técnico Asignado:</strong> <span className="font-bold text-red-500">{report.tecnicoActual || 'N/A'}</span></p>
                    <p><strong>Ubicación Física:</strong> {report.ubicacionFisica || 'N/A'}</p>
                </div>

                {(report.hasAdditionalServices || report.additionalServices?.length > 0) && (
                    <div className="mt-4 border-t pt-4 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-pink-500 mb-2">Servicios Adicionales</h3>
                        <ul className="list-disc list-inside text-sm">
                            {report.additionalServices.map((service, index) => (
                                <li key={index}>{service.description}</li>
                            ))}
                        </ul>
                    </div>
                )}
                 <div className="mt-4 border-t pt-4 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-green-500 mb-2">Componentes y Accesorios Registrados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {report.items && report.items
                            .filter(item => item.checked || (item.detalles && item.detalles.trim() !== ''))
                            .map(item => ({...item, name: getComponentName(item.id)}))
                            .map(item => <ComponentItem key={item.id} item={item} />)
                        }
                         {!(report.items && report.items.filter(item => item.checked || (item.detalles && item.detalles.trim() !== '')).length > 0) && (
                            <p className="text-gray-500 col-span-full">No se registraron componentes específicos.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                {renderAreaForm()}
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleOpenCompletionModal}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                    disabled={report.estado === 'TERMINADO'}
                >
                    <FaCheckCircle className="mr-2" /> Completar Tarea
                </button>
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
                            <label className="block text-sm font-medium mb-1">Ubicación Física</label>
                            <input
                                type="text"
                                value={ubicacionFisica}
                                onChange={(e) => setUbicacionFisica(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Ingresa la ubicación física del equipo"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Pasar a la Siguiente Área</label>
                            <Select
                                options={nextAreaOptions}
                                onChange={(option) => setNextArea(option.value)}
                                placeholder="Selecciona la siguiente área..."
                                styles={selectStyles(theme)}
                            />
                        </div>
                        {nextArea && nextArea !== 'TERMINADO' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Asignar a:</label>
                                <Select
                                    options={techniciansForNextArea}
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