import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDiagnosticReportById, updateDiagnosticReport } from '../services/diagnosticService';
import { FaArrowLeft, FaCheck, FaTimes, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';

// --- CONSTANTES GLOBALES (Duplicadas para DetalleHistorial) ---

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
    "lectora": "Lectora", "touchpad": "Touchpad", "rodillos": "Rodillos", 
    "cabezal": "Cabezal", "tinta": "Cartuchos/Tinta", "bandejas": "Bandejas", "otros": "Otros"
};

const getComponentName = (itemId) => {
    return ALL_COMPONENTS_MAP[itemId] || itemId;
};

// --- COMPONENTES AUXILIARES ---

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
                        {detailsToShow.map(({ key, label, value, type }) => (
                            <div key={key} className="flex flex-wrap items-center">
                                <strong className="mr-1">{label}:</strong>
                                {type === 'check' ? value : <span>{value}</span>}
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

// --- COMPONENTE PRINCIPAL ---

function DetalleHistorial() {
    const { reportId } = useParams();
    const { currentUser } = useAuth();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [observacionEntrega, setObservacionEntrega] = useState('');

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

    const handleOpenDeliveryModal = () => setIsDeliveryModalOpen(true);
    const handleCloseDeliveryModal = () => {
        setIsDeliveryModalOpen(false);
        setObservacionEntrega('');
    };

    const handleDeliverEquipment = async (e) => {
        e.preventDefault();
        try {
            const now = new Date();
            const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
            const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const updatedData = {
                estado: 'ENTREGADO',
                fechaEntrega: formattedDate,
                horaEntrega: formattedTime,
                tecnicoEntrega: currentUser?.nombre || 'N/A',
                observacionEntrega: observacionEntrega || ''
            };

            if (currentUser?.uid) {
                updatedData.tecnicoEntregaId = currentUser.uid;
            }

            await updateDiagnosticReport(reportId, updatedData);
            toast.success('Equipo marcado como entregado exitosamente.');
            handleCloseDeliveryModal();
            fetchReport();
        } catch (error) {
            toast.error('Error al marcar el equipo como entregado.');
            console.error(error);
        }
    };

    const flatHistory = useMemo(() => {
        if (!report) return [];
        return report.diagnosticoPorArea 
            ? Object.entries(report.diagnosticoPorArea)
                .flatMap(([areaName, entries]) => 
                    (Array.isArray(entries) ? entries : [entries]).map(entry => ({...entry, areaName}))
                )
                .filter(entry => entry.estado === 'TERMINADO')
                .sort((a, b) => {
                    const dateA = new Date(`${a.fecha_fin.split('-').reverse().join('-')}T${a.hora_fin}`);
                    const dateB = new Date(`${b.fecha_fin.split('-').reverse().join('-')}T${b.hora_fin}`);
                    return dateB - dateA;
                })
            : [];
    }, [report]);

    const componentItems = useMemo(() => {
        if (!report || !report.items) return [];
        return report.items
            .filter(item => item.checked || (item.detalles && item.detalles.trim() !== ''))
            .map(item => ({...item, name: getComponentName(item.id)}));
    }, [report]);

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (isLoading) return <div className="text-center p-8">Cargando historial...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;
    
    // La acción de entrega solo está disponible si el estado es TERMINADO y no ENTREGADO
    const canDeliver = report.estado === 'TERMINADO';

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Link to="/ver-estado" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mr-4" title="Volver a Ver Estado">
                        <FaArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold">Diagnóstico Completo N° {report.reportNumber}</h1>
                </div>
                {canDeliver && currentUser && (currentUser.rol === 'ADMIN' || currentUser.rol === 'SUPERADMIN' || currentUser.rol === 'SUPERUSER') && (
                    <button
                        onClick={handleOpenDeliveryModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                    >
                        <FaCheckCircle className="mr-2" /> Marcar como Entregado
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 space-y-6">
                
                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-blue-500 mb-3">Datos de Recepción</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <p><strong>Cliente:</strong> {report.clientName || 'N/A'}</p>
                        <p><strong>Teléfono:</strong> {report.telefono || 'N/A'}</p>
                        <p><strong>Fecha de Ingreso:</strong> {report.fecha} / {report.hora}</p>
                        <p><strong>Estado Actual:</strong> <span className={`font-bold ${report.estado === 'ENTREGADO' ? 'text-green-500' : report.estado === 'TERMINADO' ? 'text-orange-500' : 'text-red-500'}`}>{report.estado}</span></p>
                        {report.estado === 'ENTREGADO' && (
                            <>
                                <p><strong>Fecha de Entrega:</strong> {report.fechaEntrega} / {report.horaEntrega}</p>
                                <p><strong>Técnico que Entregó:</strong> {report.tecnicoEntrega}</p>
                                {report.observacionEntrega && (
                                    <p className="col-span-full"><strong>Observación de Entrega:</strong> {report.observacionEntrega}</p>
                                )}
                            </>
                        )}
                        <p><strong>Detalles de Pago:</strong> {report.detallesPago || 'N/A'}</p>
                    </div>
                </div>

                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-purple-500 mb-3">Descripción del Equipo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><strong>Tipo:</strong> {report.tipoEquipo || 'N/A'}</p>
                        <p><strong>Marca:</strong> {report.marca || 'N/A'}</p>
                        <p><strong>Modelo:</strong> {report.modelo || 'N/A'}</p>
                        <p><strong>Serie:</strong> {report.serie || 'N/A'}</p>
                        <p><strong>Sistema Operativo:</strong> {report.sistemaOperativo || 'N/A'}</p>
                        <p><strong>Clave Bitlocker:</strong> {report.bitlockerKey ? 'Sí' : 'No'}</p>
                    </div>
                </div>

                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-green-500 mb-3">Componentes y Accesorios (Inicial)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {componentItems.length > 0 ? (
                            componentItems.map(item => <ComponentItem key={item.id} item={item} />)
                        ) : (<p className="text-gray-500 col-span-full">No se registraron componentes específicos.</p>)}
                    </div>
                </div>

                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-yellow-500 mb-3">Detalles del Servicio</h2>
                    <p className="mb-3 text-sm">
                        <strong>Motivo de Ingreso:</strong> {report.motivoIngreso || 'N/A'}
                    </p>
                    <p className="text-sm">
                        <strong>Observaciones:</strong> {report.observaciones || 'Sin observaciones adicionales.'}
                    </p>
                    {(report.hasAdditionalServices || report.additionalServices?.length > 0) && (
                        <div className="mt-4 border-t pt-4 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-pink-500 mb-2">Servicios Adicionales</h3>
                            <ul className="list-disc list-inside text-sm">
                                {report.additionalServices.map((service, index) => (
                                    <li key={index}>{service.description} (S/ {parseFloat(service.amount).toFixed(2)})</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="mt-4 border-t pt-4 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-red-500 mb-2">Resumen de Costos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm font-bold">
                            <p>Diagnóstico: S/ {report.diagnostico ? parseFloat(report.diagnostico).toFixed(2) : '0.00'}</p>
                            <p>Servicio: S/ {report.montoServicio ? parseFloat(report.montoServicio).toFixed(2) : '0.00'}</p>
                            <p>Total: S/ {report.total ? parseFloat(report.total).toFixed(2) : '0.00'}</p>
                            <p>A Cuenta: S/ {report.aCuenta ? parseFloat(report.aCuenta).toFixed(2) : '0.00'}</p>
                            <p>Saldo: S/ {report.saldo ? parseFloat(report.saldo).toFixed(2) : '0.00'}</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h2 className="text-xl font-semibold text-red-500 mb-3">Historial Completo de Intervenciones</h2>
                    {flatHistory.length > 0 ? (
                        <div className="space-y-4">
                            {flatHistory.map((entry, index) => (
                                <ReadOnlyEntry key={index} entry={entry} areaName={entry.areaName} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No hay historial de intervenciones para este informe.</p>
                    )}
                </div>
                
            </div>

            {isDeliveryModalOpen && (
                <Modal onClose={handleCloseDeliveryModal}>
                    <form onSubmit={handleDeliverEquipment} className="space-y-4 p-4">
                        <h2 className="text-xl font-bold">Marcar Equipo como Entregado</h2>
                        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 p-3 rounded-md text-sm">
                            <p><strong>Informe N°:</strong> {report.reportNumber}</p>
                            <p><strong>Cliente:</strong> {report.clientName}</p>
                            <p><strong>Equipo:</strong> {report.tipoEquipo} - {report.marca} {report.modelo}</p>
                            <p className="font-bold text-red-600 mt-2">¡Advertencia! Esta acción marcará el equipo como **ENTREGADO** y no se podrá modificar.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Observación de Entrega (Opcional)</label>
                            <textarea
                                value={observacionEntrega}
                                onChange={(e) => setObservacionEntrega(e.target.value)}
                                rows="3"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Ingresa alguna observación sobre la entrega..."
                            ></textarea>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-3 rounded-md text-sm">
                            <p className="font-semibold mb-2">Información de Entrega:</p>
                            <ul className="space-y-1">
                                <li><strong>Fecha:</strong> {formattedDate}</li>
                                <li><strong>Hora:</strong> {formattedTime}</li>
                                <li><strong>Técnico:</strong> {currentUser?.nombre || 'N/A'}</li>
                            </ul>
                        </div>
                        <div className="flex justify-end space-x-2"> 
                            <button type="button" onClick={handleCloseDeliveryModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Confirmar Entrega</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default DetalleHistorial;