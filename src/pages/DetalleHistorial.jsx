import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDiagnosticReportById, updateDiagnosticReport } from '../services/diagnosticService';
import { FaArrowLeft, FaCheck, FaTimes, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';

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
    testeo_procesador: "Procesador",
    testeo_video_dedicado: "Video Dedicado",
    testeo_memoria_ram: "Memoria RAM",
    testeo_disco: "Disco",
    testeo_disco_obs: "Disco - Observación",
    testeo_pantalla: "Pantalla",
    testeo_pantalla_obs: "Pantalla - Observación",
    testeo_bateria: "Batería",
    testeo_bateria_obs: "Batería - Observación",
    testeo_cargador: "Cargador",
    testeo_cargador_obs: "Cargador - Observación",
    testeo_camara: "Cámara",
    testeo_camara_obs: "Cámara - Observación",
    testeo_microfono: "Micrófono",
    testeo_microfono_obs: "Micrófono - Observación",
    testeo_auricular: "Auricular",
    testeo_auricular_obs: "Auricular - Observación",
    testeo_parlantes: "Parlantes",
    testeo_parlantes_obs: "Parlantes - Observación",
    testeo_teclado: "Teclado",
    testeo_teclado_obs: "Teclado - Observación",
    testeo_lectora: "Lectora",
    testeo_lectora_obs: "Lectora - Observación",
    testeo_touchpad: "Touchpad",
    testeo_touchpad_obs: "Touchpad - Observación",
    testeo_wifi: "WiFi",
    testeo_wifi_obs: "WiFi - Observación",
    testeo_rj45: "RJ45",
    testeo_rj45_obs: "RJ45 - Observación",
    testeo_usb: "USB",
    testeo_usb_obs: "USB - Observación",
    testeo_tipo_c: "Tipo C",
    testeo_tipo_c_obs: "Tipo C - Observación",
    testeo_hdmi: "HDMI",
    testeo_hdmi_obs: "HDMI - Observación",
    testeo_vga: "VGA",
    testeo_vga_obs: "VGA - Observación",
    testeo_otros: "Otros",
    testeo_otros_obs: "Otros - Observación",
    testeo_tecnico_final: "Técnico del Testeo Final",
    testeo_servicio_final: "Servicio Realizado Final"
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
    testeo_otros: ["testeo_otros_obs"]
};

const ReadOnlyEntry = ({ entry, areaName }) => {
    const processedKeys = new Set(['tecnico', 'reparacion', 'fecha_inicio', 'hora_inicio', 'fecha_fin', 'hora_fin', 'estado', 'tecnicoId', 'ubicacionFisica']);
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
                <strong className="text-right">Fechas:</strong><span>{entry.fecha_inicio} {entry.hora_inicio} - {entry.fecha_fin || 'N/A'} {entry.hora_fin || ''}</span>
                <strong className="text-right">Estado:</strong><span className="font-semibold">{entry.estado}</span>
            </div>
            {detailsToShow.length > 0 && (
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
            )}
        </div>
    );
};

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

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

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

            if (currentUser?.id) {
                updatedData.tecnicoEntregaId = currentUser.id;
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

    if (isLoading) return <div className="text-center p-8">Cargando historial...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;

    const filteredItems = report.items?.filter(item => item.checked || item.detalles) || [];

    const flatHistory = report.diagnosticoPorArea 
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
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Link to="/ver-estado" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mr-4" title="Volver a Ver Estado">
                        <FaArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold">Diagnóstico Completo N° {report.reportNumber}</h1>
                </div>
                {report.estado === 'TERMINADO' && currentUser && (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><strong>Cliente:</strong> {report.clientName}</p>
                        <p><strong>Celular:</strong> {report.telefono || 'N/A'}</p>
                        <p><strong>Fecha de Ingreso:</strong> {report.fecha} / {report.hora}</p>
                        <p><strong>Estado Actual:</strong> <span className={`font-bold ${report.estado === 'ENTREGADO' ? 'text-green-500' : 'text-red-500'}`}>{report.estado}</span></p>
                        {report.estado === 'ENTREGADO' && (
                            <>
                                <p><strong>Fecha de Entrega:</strong> {report.fechaEntrega} / {report.horaEntrega}</p>
                                <p><strong>Técnico que Entregó:</strong> {report.tecnicoEntrega}</p>
                                {report.observacionEntrega && (
                                    <p className="col-span-full"><strong>Observación de Entrega:</strong> {report.observacionEntrega}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-purple-500 mb-3">Descripción del Equipo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><strong>Tipo:</strong> {report.tipoEquipo || 'N/A'}</p>
                        <p><strong>Marca:</strong> {report.marca || 'N/A'}</p>
                        <p><strong>Modelo:</strong> {report.modelo || 'N/A'}</p>
                        <p><strong>Serie:</strong> {report.serie || 'N/A'}</p>
                    </div>
                </div>

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

                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-yellow-500 mb-3">Detalles del Servicio</h2>
                    <p className="mb-3 text-sm">
                        <strong>Motivo de Ingreso:</strong> {report.motivoIngreso || 'N/A'}
                    </p>
                    <p className="text-sm">
                        <strong>Observaciones:</strong> {report.observaciones || 'Sin observaciones adicionales.'}
                    </p>
                </div>
                
                <div className="border-b pb-4 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-indigo-500 mb-3">Asignación de Personal</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><strong>Técnico Recepción:</strong> {report.tecnicoRecepcion || 'N/A'}</p>
                        <p><strong>Técnico Testeo:</strong> {report.tecnicoTesteo || 'N/A'}</p>
                        <p><strong>Técnico Responsable:</strong> {report.tecnicoResponsable || 'N/A'}</p>
                        <p><strong>Área Actual:</strong> {report.area || 'N/A'}</p>
                        <p><strong>Técnico Actual:</strong> {report.tecnicoActual || 'N/A'}</p>
                        <p><strong>Ubicación Física:</strong> {report.ubicacionFisica || 'N/A'}</p>
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