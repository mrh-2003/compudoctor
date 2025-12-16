import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDiagnosticReportById, updateDiagnosticReport } from '../services/diagnosticService';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaCheckCircle, FaTimes, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { ThemeContext } from '../context/ThemeContext';
import Modal from '../components/common/Modal';
import Select from 'react-select';
import { getAllUsersDetailed } from '../services/userService';
import ReadOnlyAreaHistory from '../components/common/ReadOnlyAreaHistory';
import ReadOnlyReportHeader from '../components/common/ReadOnlyReportHeader';

const AREA_OPTIONS_CONSTANT = ['SOFTWARE', 'HARDWARE', 'ELECTRONICA', 'TESTEO'];

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
        zIndex: 9999,
    }),
    menuPortal: (baseStyles) => ({
        ...baseStyles,
        zIndex: 9999,
    }),
    option: (baseStyles, state) => ({
        ...baseStyles,
        backgroundColor: state.isFocused ? (theme === 'dark' ? '#4B5563' : '#e5e7eb') : 'transparent',
        color: theme === 'dark' ? '#fff' : '#000',
    }),
});

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
    const [motivoText, setMotivoText] = useState('');

    const [editableAdditionalServices, setEditableAdditionalServices] = useState([]);
    const [nuevoServicio, setNuevoServicio] = useState({ description: '', amount: 0 });

    // New State for "Add Service" logic
    const [enabledFields, setEnabledFields] = useState([]);
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
    const [selectedServiceToAdd, setSelectedServiceToAdd] = useState(null);
    const [isFirstTimeInArea, setIsFirstTimeInArea] = useState(true);

    const isActualTech = report?.tecnicoActualId === currentUser?.uid;
    const isAllowedToEdit = isActualTech && ['PENDIENTE', 'ASIGNADO'].includes(report?.estado);
    const isReportFinalized = report && ['TERMINADO', 'ENTREGADO'].includes(report.estado);

    const canEditAdditionalServices = isAllowedToEdit && ['HARDWARE', 'SOFTWARE'].includes(report?.area);

    const componentItems = useMemo(() => {
        if (!report || !report.items) return [];
        return report.items;
    }, [report]);

    const { diagnostico, montoServicio, total, saldo } = useMemo(() => {
        const aCuenta = parseFloat(report?.aCuenta) || 0;
        let diagCost = parseFloat(report?.diagnostico) || 0;
        let serviceTotal = parseFloat(report?.montoServicio) || 0;

        const totalAdicionales = editableAdditionalServices.reduce(
            (sum, service) => sum + (parseFloat(service.amount) || 0),
            0
        );

        const newTotal = (serviceTotal + totalAdicionales);
        const newSaldo = newTotal - aCuenta;

        return {
            diagnostico: diagCost,
            montoServicio: serviceTotal,
            total: newTotal,
            saldo: newSaldo,
        };
    }, [report, editableAdditionalServices]);

    const handleUpdateReportFinance = useCallback(async (updatedData) => {
        try {
            const currentReport = await getDiagnosticReportById(reportId);
            const aCuenta = parseFloat(currentReport?.aCuenta) || 0;
            const serviceTotal = parseFloat(currentReport?.montoServicio) || 0;
            const finalAdditionalServices = updatedData.additionalServices || currentReport.additionalServices || [];

            const totalAdicionales = finalAdditionalServices.reduce((sum, service) => sum + (parseFloat(service.amount) || 0), 0);
            const newTotal = serviceTotal + totalAdicionales;
            const newSaldo = newTotal - aCuenta;

            const updatedFields = {
                total: newTotal,
                saldo: newSaldo,
                ...updatedData
            };

            await updateDiagnosticReport(reportId, updatedFields);
            const updatedReport = await getDiagnosticReportById(reportId);
            setReport(updatedReport);
        } catch (error) {
            toast.error('Error al actualizar la información de pago.');
            console.error(error);
        }
    }, [reportId]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const fetchedReport = await getDiagnosticReportById(reportId);
                setReport(fetchedReport);
                setEnabledFields([]);

                const currentAreaHistory = fetchedReport.diagnosticoPorArea[fetchedReport.area];

                // Determine if it is first time and hydrate state
                const historyLength = currentAreaHistory ? currentAreaHistory.length : 0;
                const isFirstTime = historyLength <= 1; // 1 because startDiagnosticReport creates the first entry
                setIsFirstTimeInArea(isFirstTime);

                const currentEntry = currentAreaHistory && currentAreaHistory[historyLength - 1];
                let initialFormState = {};

                if (!isFirstTime && historyLength > 1) {
                    // Hydrate with previous data but keep current metadata (status, times)
                    const previousEntry = currentAreaHistory[historyLength - 2];
                    initialFormState = { ...previousEntry, ...currentEntry };
                } else {
                    initialFormState = currentEntry || {};
                }

                setFormState(initialFormState);

                setUbicacionFisica(fetchedReport.ubicacionFisica || '');

                setEditableAdditionalServices(fetchedReport.additionalServices || []);

                const allUsers = await getAllUsersDetailed();
                const technicians = allUsers.filter(u => u.rol === 'USER' || u.rol === 'SUPERUSER');
                setUsers(technicians.map(u => ({ value: u.id, label: u.nombre })));

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
        if (!isAllowedToEdit || isReportFinalized) return;
        // Strict guard: checks if field is read-only according to our new logic using PK or name
        const permissionKey = e.target.dataset.pk || e.target.name;
        if (isFieldReadOnly(permissionKey)) return;
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox' && checked && ['elec_video', 'elec_placa', 'elec_otro'].includes(name)) {
            setFormState(prev => ({
                ...prev,
                [name]: checked,
                [`${name}_reparable`]: 'SI'
            }));
        } else {
            setFormState(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    };

    const handleRadioChange = (e) => {
        if (!isAllowedToEdit || isReportFinalized) return;
        // Strict guard: checks if field is read-only according to our new logic using PK or name
        const permissionKey = e.target.dataset.pk || e.target.name;
        if (isFieldReadOnly(permissionKey)) return;
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAddServicioAdicional = async () => {
        if (!canEditAdditionalServices || isReportFinalized) return;
        if (!nuevoServicio.description || !nuevoServicio.amount || parseFloat(nuevoServicio.amount) <= 0) {
            toast.error('Debe ingresar una descripción y un monto válido.');
            return;
        }

        const amountValue = parseFloat(nuevoServicio.amount);
        const servicioConId = {
            ...nuevoServicio,
            amount: amountValue,
            id: Date.now()
        };

        const newAdditionalServices = [...editableAdditionalServices, servicioConId];
        setEditableAdditionalServices(newAdditionalServices);
        setNuevoServicio({ description: '', amount: 0 });

        const dataToUpdate = {
            additionalServices: newAdditionalServices,
            hasAdditionalServices: true,
        };

        await handleUpdateReportFinance(dataToUpdate);
        toast.success('Servicio adicional agregado y saldo actualizado.');
    };

    const handleDeleteServicioAdicional = async (id) => {
        if (!canEditAdditionalServices || isReportFinalized) return;
        const serviceToDelete = editableAdditionalServices.find(s => s.id === id);
        if (!serviceToDelete) return;

        const newAdditionalServices = editableAdditionalServices.filter(s => s.id !== id);
        setEditableAdditionalServices(newAdditionalServices);

        const dataToUpdate = {
            additionalServices: newAdditionalServices,
            hasAdditionalServices: newAdditionalServices.length > 0,
        };

        await handleUpdateReportFinance(dataToUpdate);
        toast.success('Servicio adicional eliminado y saldo actualizado.');
    };

    const generateTaskSummary = () => {
        if (!formState) return '';
        let summary = [];
        const CHECKED = '✅';
        const UNCHECKED_CONTENT = '🟫';

        // Helper to formatting lines
        const formatLine = (checked, label, details) => {
            if (checked) {
                return `${CHECKED} ${label}${details ? ` (${details})` : ''}`;
            } else if (details && details.trim() !== '' && details !== '-') {
                return `${UNCHECKED_CONTENT} ${label} (${details})`;
            }
            return null;
        };

        if (report.area === 'HARDWARE') {
            if (formState.mant_hardware) summary.push(`${CHECKED} Mantenimiento de Hardware`);
            if (formState.reconstruccion) summary.push(`${CHECKED} Reconstrucción`);
            if (formState.adapt_parlantes) summary.push(`${CHECKED} Adaptación de Parlantes`);

            summary.push(formatLine(formState.cambio_teclado, 'Cambio de Teclado', `Cod: ${formState.cambio_teclado_codigo || '-'}`));
            summary.push(formatLine(formState.cambio_pantalla, 'Cambio de Pantalla', `Cod: ${formState.cambio_pantalla_codigo || '-'}, Res: ${formState.cambio_pantalla_resolucion || '-'}, Hz: ${formState.cambio_pantalla_hz || '-'}`));
            summary.push(formatLine(formState.cambio_carcasa, 'Cambio de Carcasa', `Obs: ${formState.cambio_carcasa_obs || '-'}`));
            summary.push(formatLine(formState.cambio_placa, 'Cambio de Placa', `Cod: ${formState.cambio_placa_codigo || '-'}, Esp: ${formState.cambio_placa_especif || '-'}`));
            summary.push(formatLine(formState.cambio_fuente, 'Cambio de Fuente', `Cod: ${formState.cambio_fuente_codigo || '-'}, Esp: ${formState.cambio_fuente_especif || '-'}`));
            summary.push(formatLine(formState.cambio_video, 'Cambio de Tarj. Video', `Cod: ${formState.cambio_video_codigo || '-'}, Esp: ${formState.cambio_video_especif || '-'}`));
            summary.push(formatLine(formState.otros, 'Otros Hardware', formState.otros_especif));

            summary.push(formatLine(formState.repoten_ssd, 'Repotenciación SSD', `${formState.repoten_ssd_gb || '-'} GB (Serie: ${formState.repoten_ssd_serie || '-'})`));
            summary.push(formatLine(formState.repoten_nvme, 'Repotenciación NVME', `${formState.repoten_nvme_gb || '-'} GB (Serie: ${formState.repoten_nvme_serie || '-'})`));
            summary.push(formatLine(formState.repoten_m2, 'Repotenciación M.2 SATA', `${formState.repoten_m2_gb || '-'} GB (Serie: ${formState.repoten_m2_serie || '-'})`));
            summary.push(formatLine(formState.repoten_hdd, 'Repotenciación HDD', `${formState.repoten_hdd_gb || '-'} GB (Serie: ${formState.repoten_hdd_serie || '-'}, Cod: ${formState.repoten_hdd_codigo || '-'})`));
            summary.push(formatLine(formState.repoten_ram, 'Repotenciación RAM', `${formState.repoten_ram_cap || '-'} (Cod: ${formState.repoten_ram_cod || '-'})`));

        } else if (report.area === 'SOFTWARE') {
            const swFields = [
                { key: 'backup', label: 'Backup de Información' },
                { key: 'clonacion', label: 'Clonación de Disco' },
                { key: 'formateo', label: 'Formateo + Programas' },
                { key: 'drivers', label: 'Instalación de Drivers' },
                { key: 'act_win', label: 'Activación de Windows' },
                { key: 'act_office', label: 'Activación de Office' },
                { key: 'optimizacion', label: 'Optimización de sistema' },
                { key: 'diseno', label: 'Inst. de Prog. de Diseño', spec: 'diseno_spec' },
                { key: 'ingenieria', label: 'Inst. de Prog. de Ing.', spec: 'ingenieria_spec' },
                { key: 'sw_otros', label: 'Otros Software', spec: 'sw_otros_spec' }
            ];

            swFields.forEach(field => {
                const obsKey = field.spec || `${field.key}_obs`;
                const obsValue = formState[obsKey];
                const line = formatLine(formState[field.key], field.label, obsValue);
                if (line) summary.push(line);
            });

        } else if (report.area === 'ELECTRONICA') {
            summary.push(formatLine(formState.elec_video, 'TARJ. VIDEO', `Reparable: ${formState.elec_video_reparable || '?'}`));
            summary.push(formatLine(formState.elec_placa, 'PLACA', `Reparable: ${formState.elec_placa_reparable || '?'}`));
            summary.push(formatLine(formState.elec_otro, 'OTRO', `${formState.elec_otro_especif || '-'} (Reparable: ${formState.elec_otro_reparable || '?'})`));

            if (formState.elec_codigo) summary.push(`ℹ️ Código: ${formState.elec_codigo}`);
            if (formState.elec_etapa) summary.push(`ℹ️ Etapa: ${formState.elec_etapa}`);
            if (formState.elec_obs) summary.push(`ℹ️ Observaciones: ${formState.elec_obs}`);

        } else if (report.area === 'TESTEO') {
            const testFields = [
                'disco', 'pantalla', 'bateria', 'cargador', 'camara',
                'microfono', 'auricular', 'parlantes', 'teclado', 'lectora',
                'touchpad', 'wifi', 'rj45', 'usb', 'tipo_c', 'hdmi', 'vga', 'otros'
            ];

            if (formState.testeo_procesador) summary.push(`ℹ️ Procesador: ${formState.testeo_procesador}`);
            if (formState.testeo_video_dedicado) summary.push(`ℹ️ Video Dedicado: ${formState.testeo_video_dedicado}`);
            if (formState.testeo_memoria_ram) summary.push(`ℹ️ Memoria Ram: ${formState.testeo_memoria_ram}`);

            testFields.forEach(key => {
                const status = formState[`testeo_${key}`]; // SI/NO
                const obs = formState[`testeo_${key}_obs`];

                if (status) {
                    const icon = status === 'SI' ? '✅' : '❌'; // SI = Funciona, NO = No funciona
                    let line = `${icon} ${key.toUpperCase()}: ${status === 'SI' ? 'FUNCIONA' : 'NO FUNCIONA'}`;
                    if (obs) line += ` (Obs: ${obs})`;
                    summary.push(line);
                } else if (obs) {
                    summary.push(`${UNCHECKED_CONTENT} ${key.toUpperCase()}: (Estado no marcado) (Obs: ${obs})`);
                }
            });
            if (formState.testeo_servicio_final) {
                summary.push(`📝 Servicio Final: ${formState.testeo_servicio_final}`);
            }
        }

        // Filter nulls
        summary = summary.filter(line => line !== null);

        return summary.length > 0 ? summary.join('\n') : 'No se registraron detalles específicos.';
    };

    const handleOpenCompletionModal = () => {
        if (!isAllowedToEdit || isReportFinalized) return;
        const summary = generateTaskSummary();
        setMotivoText(summary);
        setIsCompletionModalOpen(true);
    };

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
        if (!isAllowedToEdit || isReportFinalized) return;
        if (!reparacionFinal) return toast.error('La descripción de la reparación es obligatoria.');
        if (!nextArea) return toast.error('Debes seleccionar la siguiente área o marcar como terminado.');
        if (!ubicacionFisica) return toast.error('Debes ingresar la ubicación física.');

        const isTransfer = nextArea !== 'TERMINADO';
        if (isTransfer && !tecnicoSiguiente) return toast.error('Debes asignar un técnico para la siguiente área.');

        const nextTechnician = isTransfer ? tecnicoSiguiente : users.find(u => u.value === report.tecnicoResponsableId);
        const nextTechnicianName = nextTechnician?.label || report.tecnicoResponsable || 'N/A';
        const nextTechnicianId = nextTechnician?.value || report.tecnicoResponsableId || 'N/A';

        if (isTransfer && nextArea === report.area && tecnicoSiguiente?.value === currentUser.uid) {
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
                serviciosAdicionales: editableAdditionalServices,
            };

            const updatedDiagnosticoPorArea = {
                ...report.diagnosticoPorArea,
                [report.area]: currentAreaHistory,
            };

            const currentACuenta = parseFloat(report.aCuenta) || 0;
            const serviceTotal = parseFloat(report.montoServicio) || 0;
            const totalAdicionales = editableAdditionalServices.reduce((sum, service) => sum + (parseFloat(service.amount) || 0), 0);
            const finalTotal = serviceTotal + totalAdicionales;
            const finalSaldo = finalTotal - currentACuenta;

            const newGlobalState = nextArea === 'TERMINADO' ? 'TERMINADO' : 'ASIGNADO';

            const updatedData = {
                diagnosticoPorArea: updatedDiagnosticoPorArea,
                estado: newGlobalState,
                area: isTransfer ? nextArea : report.area,
                tecnicoActual: isTransfer ? nextTechnicianName : report.tecnicoActual,
                tecnicoActualId: isTransfer ? nextTechnicianId : report.tecnicoActualId,
                ubicacionFisica: ubicacionFisica,

                aCuenta: currentACuenta,
                total: finalTotal,
                saldo: finalSaldo,
                additionalServices: editableAdditionalServices,
                hasAdditionalServices: editableAdditionalServices.length > 0,
            };

            if (isTransfer) {
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
            toast.success(`Tarea completada. Estado del informe: ${newGlobalState}.`);
            handleCloseCompletionModal();
            navigate('/bandeja-tecnico');

        } catch (error) {
            toast.error('Error al actualizar el informe.');
            console.error(error);
        }
    };

    const nextAreaOptions = useMemo(() => {
        if (!report) return [];
        const areaOptions = AREA_OPTIONS_CONSTANT.map(area => ({ value: area, label: area }));
        if (report.area === 'TESTEO') {
            areaOptions.push({ value: 'TERMINADO', label: 'TERMINADO (Listo para entregar)' });
        }
        return areaOptions;
    }, [report]);

    const techniciansForNextArea = useMemo(() => {
        if (!report) return users;

        if (nextArea === report?.area) {
            return users.filter(u => u.value !== currentUser.uid);
        }
        return users;
    }, [nextArea, report, users, currentUser?.uid]);

    const flatHistory = useMemo(() => {
        if (!report) return [];
        return Object.entries(report.diagnosticoPorArea)
            .flatMap(([areaName, entries]) =>
                (Array.isArray(entries) ? entries : [entries]).map(entry => ({ ...entry, areaName }))
            )
            .filter(entry => entry.estado === 'TERMINADO')
            .sort((a, b) => {
                const parseDate = (dateStr, timeStr) => {
                    if (!dateStr || !timeStr) return new Date(0);
                    const [d, m, y] = dateStr.split('-');
                    const [h, min] = timeStr.split(':');
                    return new Date(y, m - 1, d, h, min);
                };
                return parseDate(b.fecha_fin, b.hora_fin) - parseDate(a.fecha_fin, a.hora_fin);
            });
    }, [report]);

    // OPTIMIZACIÓN CLAVE: Memoizamos el Header para que NO dependa del estado del formulario (formState)
    // Solo se re-renderizará si cambian estos valores específicos.
    const memoizedReportHeader = useMemo(() => (
        <ReadOnlyReportHeader
            report={report}
            diagnostico={diagnostico}
            montoServicio={montoServicio}
            total={total}
            saldo={saldo}
            componentItems={componentItems}
        />
    ), [report, diagnostico, montoServicio, total, saldo, componentItems]);

    // OPTIMIZACIÓN CLAVE: Memoizamos el historial para que tampoco se renderice al teclear
    const memoizedHistorySection = useMemo(() => (
        <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-500 mb-3">Historial de Intervenciones</h2>
            <div className="space-y-4">
                {flatHistory.length > 0 ? (
                    flatHistory.map((entry, index) => (
                        <ReadOnlyAreaHistory key={index} entry={entry} areaName={entry.areaName} />
                    ))
                ) : (
                    <p className="text-gray-500">No hay intervenciones previas.</p>
                )}
            </div>
        </div>
    ), [flatHistory]);

    if (isLoading) return <div className="text-center p-8">Cargando informe...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;

    const handleConfirmAddService = () => {
        if (selectedServiceToAdd) {
            setEnabledFields(prev => [...prev, selectedServiceToAdd.value]);
            setIsAddServiceModalOpen(false);
            setSelectedServiceToAdd(null);
            toast.success('Campo habilitado para edición.');
        }
    };

    const isFieldReadOnly = (fieldKey) => {
        // Not read only if: First time in area OR field is specifically enabled
        if (isFirstTimeInArea) return false;
        return !enabledFields.includes(fieldKey);
    };

    // Helper to generate props dynamically based on key
    const getProps = (key, baseProps, blockPointer = false) => {
        const localReadOnly = isFieldReadOnly(key);
        const effectiveReadOnly = baseProps.readOnly || localReadOnly;

        return {
            ...baseProps,
            // Only disable if explicitly passed as true in baseProps (we will remove it from default props next)
            disabled: baseProps.disabled,
            readOnly: effectiveReadOnly,
            // Use pointer-events-none only if blockPointer is true (for checks/radios), allowing text selection for inputs
            className: `${baseProps.className} ${effectiveReadOnly && blockPointer ? 'opacity-100 pointer-events-none' : ''}`,
            tabIndex: effectiveReadOnly ? -1 : undefined,
            'data-pk': key // Store permission key for event handlers
        };
    };


    const renderAreaForm = () => {
        const techniciansForSupport = users.filter(u => u.value !== currentUser.uid);

        const commonFields = (
            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4">
                <p className="font-bold text-lg text-black dark:text-white">SERVICIO EN CURSO</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha Inicio:</label>
                        <input type="text" value={formState.fecha_inicio || ''} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">H. Inicio:</label>
                        <input type="text" value={formState.hora_inicio || ''} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Técnico de Apoyo (Opcional):</label>
                        <Select
                            options={techniciansForSupport}
                            value={tecnicoApoyo}
                            onChange={setTecnicoApoyo}
                            placeholder="Selecciona un técnico de apoyo..."
                            isClearable
                            styles={selectStyles(theme)}
                            isDisabled={!isAllowedToEdit || isReportFinalized}
                        />
                    </div>
                </div>
            </div>
        );

        const inputProps = {
            onChange: handleFormChange,
            className: "p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600",
            readOnly: !isAllowedToEdit || isReportFinalized
        };
        const checkboxProps = {
            onChange: handleFormChange,
            className: "h-4 w-4 mr-2 accent-blue-600",
            readOnly: !isAllowedToEdit || isReportFinalized,
            style: { opacity: 1, filter: 'none' }
        };
        const radioProps = {
            onChange: handleRadioChange,
            className: "h-4 w-4 mr-1 accent-blue-600",
            readOnly: !isAllowedToEdit || isReportFinalized,
            style: { opacity: 1, filter: 'none' }
        }

        const p = (key) => getProps(key, inputProps, false);
        const c = (key) => getProps(key, checkboxProps, true);
        const r = (key) => getProps(key, radioProps, true);

        switch (report.area) {
            case 'HARDWARE':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-red-500">ÁREA DE HARDWARE</h2>
                        {commonFields}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md dark:border-gray-700">
                            <label className="flex items-center"><input type="checkbox" name="mant_hardware" checked={formState.mant_hardware || false} {...c('mant_hardware')} />Mant. de Hardware</label>
                            <label className="flex items-center"><input type="checkbox" name="reconstruccion" checked={formState.reconstruccion || false} {...c('reconstruccion')} />Reconstrucción</label>
                            <label className="flex items-center"><input type="checkbox" name="adapt_parlantes" checked={formState.adapt_parlantes || false} {...c('adapt_parlantes')} />Adapt. de Parlantes</label>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700">
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_teclado" checked={formState.cambio_teclado || false} {...c('cambio_teclado')} />Cambio de Teclado:</label>
                                <input type="text" name="cambio_teclado_codigo" value={formState.cambio_teclado_codigo || ''} {...p('cambio_teclado')} placeholder="Código" className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_pantalla" checked={formState.cambio_pantalla || false} {...c('cambio_pantalla')} />Cambio de Pantalla:</label>
                                <input type="text" name="cambio_pantalla_codigo" value={formState.cambio_pantalla_codigo || ''} {...p('cambio_pantalla')} placeholder="Código" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="cambio_pantalla_resolucion" value={formState.cambio_pantalla_resolucion || ''} {...p('cambio_pantalla')} placeholder="Resolución" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="cambio_pantalla_hz" value={formState.cambio_pantalla_hz || ''} {...p('cambio_pantalla')} placeholder="Hz" className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_carcasa" checked={formState.cambio_carcasa || false} {...c('cambio_carcasa')} />Cambio de Carcasa:</label>
                                <input type="text" name="cambio_carcasa_obs" value={formState.cambio_carcasa_obs || ''} {...p('cambio_carcasa')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_placa" checked={formState.cambio_placa || false} {...c('cambio_placa')} />Cambio de Placa:</label>
                                <input type="text" name="cambio_placa_codigo" value={formState.cambio_placa_codigo || ''} {...p('cambio_placa')} placeholder="Código" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="cambio_placa_especif" value={formState.cambio_placa_especif || ''} {...p('cambio_placa')} placeholder="Especif." className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_fuente" checked={formState.cambio_fuente || false} {...c('cambio_fuente')} />Cambio de Fuente:</label>
                                <input type="text" name="cambio_fuente_codigo" value={formState.cambio_fuente_codigo || ''} {...p('cambio_fuente')} placeholder="Código" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="cambio_fuente_especif" value={formState.cambio_fuente_especif || ''} {...p('cambio_fuente')} placeholder="Especif." className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_video" checked={formState.cambio_video || false} {...c('cambio_video')} />Cambio de Tarj. Video:</label>
                                <input type="text" name="cambio_video_codigo" value={formState.cambio_video_codigo || ''} {...p('cambio_video')} placeholder="Código" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="cambio_video_especif" value={formState.cambio_video_especif || ''} {...p('cambio_video')} placeholder="Especif." className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="otros" checked={formState.otros || false} {...c('otros')} />Otros:</label>
                                <input type="text" name="otros_especif" value={formState.otros_especif || ''} {...p('otros')} placeholder="Especificar" className={`${inputProps.className} flex-1`} />
                            </div>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700">
                            <p className="font-semibold mb-3">Repotenciación:</p>

                            {/* Repotenciacion inputs use helpers */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_ssd" checked={formState.repoten_ssd || false} {...c('repoten_ssd')} />SSD</label>
                                <input type="text" name="repoten_ssd_gb" value={formState.repoten_ssd_gb || ''} {...p('repoten_ssd')} placeholder="GB" className={`${inputProps.className} w-24`} />
                                <input type="text" name="repoten_ssd_serie" value={formState.repoten_ssd_serie || ''} {...p('repoten_ssd')} placeholder="Serie" className={`${inputProps.className} flex-1`} />
                            </div>

                            {/* NVME */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_nvme" checked={formState.repoten_nvme || false} {...c('repoten_nvme')} />NVME</label>
                                <input type="text" name="repoten_nvme_gb" value={formState.repoten_nvme_gb || ''} {...p('repoten_nvme')} placeholder="GB" className={`${inputProps.className} w-24`} />
                                <input type="text" name="repoten_nvme_serie" value={formState.repoten_nvme_serie || ''} {...p('repoten_nvme')} placeholder="Serie" className={`${inputProps.className} flex-1`} />
                            </div>

                            {/* M2 SATA */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_m2" checked={formState.repoten_m2 || false} {...c('repoten_m2')} />M2 SATA</label>
                                <input type="text" name="repoten_m2_gb" value={formState.repoten_m2_gb || ''} {...p('repoten_m2')} placeholder="GB" className={`${inputProps.className} w-24`} />
                                <input type="text" name="repoten_m2_serie" value={formState.repoten_m2_serie || ''} {...p('repoten_m2')} placeholder="Serie" className={`${inputProps.className} flex-1`} />
                            </div>

                            {/* HDD (Keeping GB, Serie, Código) */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_hdd" checked={formState.repoten_hdd || false} {...c('repoten_hdd')} />HDD</label>
                                <input type="text" name="repoten_hdd_gb" value={formState.repoten_hdd_gb || ''} {...p('repoten_hdd')} placeholder="GB" className={`${inputProps.className} w-24`} />
                                <input type="text" name="repoten_hdd_serie" value={formState.repoten_hdd_serie || ''} {...p('repoten_hdd')} placeholder="Serie" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="repoten_hdd_codigo" value={formState.repoten_hdd_codigo || ''} {...p('repoten_hdd')} placeholder="Código" className={`${inputProps.className} w-24`} />
                            </div>

                            {/* MEMORIA RAM (Keeping Capacidad, Código) */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_ram" checked={formState.repoten_ram || false} {...c('repoten_ram')} />MEMORIA RAM</label>
                                <input type="text" name="repoten_ram_cap" value={formState.repoten_ram_cap || ''} {...p('repoten_ram')} placeholder="Capacidad" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="repoten_ram_cod" value={formState.repoten_ram_cod || ''} {...p('repoten_ram')} placeholder="Cód." className={`${inputProps.className} flex-1`} />
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
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="backup" checked={formState.backup || false} {...c('backup')} />Backup de Información:</label><input type="text" name="backup_obs" value={formState.backup_obs || ''} {...p('backup')} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="clonacion" checked={formState.clonacion || false} {...c('clonacion')} />Clonación de Disco:</label><input type="text" name="clonacion_obs" value={formState.clonacion_obs || ''} {...p('clonacion')} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="formateo" checked={formState.formateo || false} {...c('formateo')} />Formateo + Programas:</label><input type="text" name="formateo_obs" value={formState.formateo_obs || ''} {...p('formateo')} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="drivers" checked={formState.drivers || false} {...c('drivers')} />Instalación de Drivers:</label><input type="text" name="drivers_obs" value={formState.drivers_obs || ''} {...p('drivers')} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="act_win" checked={formState.act_win || false} {...c('act_win')} />Activación de Windows:</label><input type="text" name="act_win_obs" value={formState.act_win_obs || ''} {...p('act_win')} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="act_office" checked={formState.act_office || false} {...c('act_office')} />Activación de Office:</label><input type="text" name="act_office_obs" value={formState.act_office_obs || ''} {...p('act_office')} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="optimizacion" checked={formState.optimizacion || false} {...c('optimizacion')} />Optimización de sistema:</label><input type="text" name="optimizacion_obs" value={formState.optimizacion_obs || ''} {...p('optimizacion')} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="sw_otros" checked={formState.sw_otros || false} {...c('sw_otros')} />Otros:</label><input type="text" name="sw_otros_spec" value={formState.sw_otros_spec || ''} {...p('sw_otros')} placeholder="Especif." className={`${inputProps.className} flex-1`} /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="diseno" checked={formState.diseno || false} {...c('diseno')} />Inst. de Prog. de Diseño:</label><input type="text" name="diseno_spec" value={formState.diseno_spec || ''} {...p('diseno')} placeholder="Especif." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="ingenieria" checked={formState.ingenieria || false} {...c('ingenieria')} />Inst. de Prog. de Ing.:</label><input type="text" name="ingenieria_spec" value={formState.ingenieria_spec || ''} {...p('ingenieria')} placeholder="Especif." className={`${inputProps.className} flex-1`} /></div>
                            </div>
                        </div>
                    </div>
                );
            case 'ELECTRONICA':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-yellow-500">ÁREA DE ELECTRÓNICA</h2>
                        {commonFields}
                        <div className="space-y-4 border p-4 rounded-md dark:border-gray-700">
                            {/* TARJ. VIDEO */}
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input type="checkbox" name="elec_video" checked={formState.elec_video || false} {...c('elec_video')} />
                                    TARJ. VIDEO
                                </label>
                                {formState.elec_video && (
                                    <div className="ml-6 flex items-center gap-4">
                                        <span className="text-sm font-medium">Reparable:</span>
                                        <label className="flex items-center text-sm">
                                            <input
                                                type="radio"
                                                name="elec_video_reparable"
                                                value="SI"
                                                checked={formState.elec_video_reparable === 'SI' || formState.elec_video_reparable === undefined}
                                                {...r('elec_video')}
                                            />
                                            SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input
                                                type="radio"
                                                name="elec_video_reparable"
                                                value="NO"
                                                checked={formState.elec_video_reparable === 'NO'}
                                                {...r('elec_video')}
                                            />
                                            NO
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* PLACA */}
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input type="checkbox" name="elec_placa" checked={formState.elec_placa || false} {...c('elec_placa')} />
                                    PLACA
                                </label>
                                {formState.elec_placa && (
                                    <div className="ml-6 flex items-center gap-4">
                                        <span className="text-sm font-medium">Reparable:</span>
                                        <label className="flex items-center text-sm">
                                            <input
                                                type="radio"
                                                name="elec_placa_reparable"
                                                value="SI"
                                                checked={formState.elec_placa_reparable === 'SI' || formState.elec_placa_reparable === undefined}
                                                {...r('elec_placa')}
                                            />
                                            SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input
                                                type="radio"
                                                name="elec_placa_reparable"
                                                value="NO"
                                                checked={formState.elec_placa_reparable === 'NO'}
                                                {...r('elec_placa')}
                                            />
                                            NO
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* OTRO */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center">
                                        <input type="checkbox" name="elec_otro" checked={formState.elec_otro || false} {...c('elec_otro')} />
                                        OTRO
                                    </label>
                                    {formState.elec_otro && (
                                        <input
                                            type="text"
                                            name="elec_otro_especif"
                                            value={formState.elec_otro_especif || ''}
                                            {...p('elec_otro')}
                                            placeholder="Especificar..."
                                            className={`${inputProps.className} flex-1`}
                                        />
                                    )}
                                </div>
                                {formState.elec_otro && (
                                    <div className="ml-6 flex items-center gap-4">
                                        <span className="text-sm font-medium">Reparable:</span>
                                        <label className="flex items-center text-sm">
                                            <input
                                                type="radio"
                                                name="elec_otro_reparable"
                                                value="SI"
                                                checked={formState.elec_otro_reparable === 'SI' || formState.elec_otro_reparable === undefined}
                                                {...r('elec_otro')}
                                            />
                                            SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input
                                                type="radio"
                                                name="elec_otro_reparable"
                                                value="NO"
                                                checked={formState.elec_otro_reparable === 'NO'}
                                                {...r('elec_otro')}
                                            />
                                            NO
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700">
                            <textarea name="elec_codigo" value={formState.elec_codigo || ''} {...p('elec_generales')} placeholder="Código" className={`${inputProps.className} w-full`} rows="2"></textarea>
                            <textarea name="elec_etapa" value={formState.elec_etapa || ''} {...p('elec_generales')} placeholder="Etapa" className={`${inputProps.className} w-full`} rows="2"></textarea>
                            <textarea name="elec_obs" value={formState.elec_obs || ''} {...p('elec_generales')} placeholder="Obs" className={`${inputProps.className} w-full`} rows="3"></textarea>
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
                                    <input type="text" name="testeo_procesador" value={formState.testeo_procesador || ''} {...p('testeo_procesador')} placeholder="Obs." className={`${inputProps.className} w-full`} />
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Video Dedicado:</label>
                                    <input type="text" name="testeo_video_dedicado" value={formState.testeo_video_dedicado || ''} {...p('testeo_video_dedicado')} placeholder="Obs." className={`${inputProps.className} w-full`} />
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Memoria Ram:</label>
                                    <input type="text" name="testeo_memoria_ram" value={formState.testeo_memoria_ram || ''} {...p('testeo_memoria_ram')} placeholder="Obs." className={`${inputProps.className} w-full`} />
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Disco:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_disco" value="SI" checked={formState.testeo_disco === 'SI'} {...r('testeo_disco')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_disco" value="NO" checked={formState.testeo_disco === 'NO'} {...r('testeo_disco')} />NO
                                        </label>
                                        <input type="text" name="testeo_disco_obs" value={formState.testeo_disco_obs || ''} {...p('testeo_disco')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Pantalla:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_pantalla" value="SI" checked={formState.testeo_pantalla === 'SI'} {...r('testeo_pantalla')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_pantalla" value="NO" checked={formState.testeo_pantalla === 'NO'} {...r('testeo_pantalla')} />NO
                                        </label>
                                        <input type="text" name="testeo_pantalla_obs" value={formState.testeo_pantalla_obs || ''} {...p('testeo_pantalla')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Batería:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_bateria" value="SI" checked={formState.testeo_bateria === 'SI'} {...r('testeo_bateria')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_bateria" value="NO" checked={formState.testeo_bateria === 'NO'} {...r('testeo_bateria')} />NO
                                        </label>
                                        <input type="text" name="testeo_bateria_obs" value={formState.testeo_bateria_obs || ''} {...p('testeo_bateria')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Cargador:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_cargador" value="SI" checked={formState.testeo_cargador === 'SI'} {...r('testeo_cargador')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_cargador" value="NO" checked={formState.testeo_cargador === 'NO'} {...r('testeo_cargador')} />NO
                                        </label>
                                        <input type="text" name="testeo_cargador_obs" value={formState.testeo_cargador_obs || ''} {...p('testeo_cargador')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Cámara:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_camara" value="SI" checked={formState.testeo_camara === 'SI'} {...r('testeo_camara')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_camara" value="NO" checked={formState.testeo_camara === 'NO'} {...r('testeo_camara')} />NO
                                        </label>
                                        <input type="text" name="testeo_camara_obs" value={formState.testeo_camara_obs || ''} {...p('testeo_camara')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>

                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Micrófono:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_microfono" value="SI" checked={formState.testeo_microfono === 'SI'} {...r('testeo_microfono')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_microfono" value="NO" checked={formState.testeo_microfono === 'NO'} {...r('testeo_microfono')} />NO
                                        </label>
                                        <input type="text" name="testeo_microfono_obs" value={formState.testeo_microfono_obs || ''} {...p('testeo_microfono')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Auricular:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_auricular" value="SI" checked={formState.testeo_auricular === 'SI'} {...r('testeo_auricular')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_auricular" value="NO" checked={formState.testeo_auricular === 'NO'} {...r('testeo_auricular')} />NO
                                        </label>
                                        <input type="text" name="testeo_auricular_obs" value={formState.testeo_auricular_obs || ''} {...p('testeo_auricular')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Parlantes:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_parlantes" value="SI" checked={formState.testeo_parlantes === 'SI'} {...r('testeo_parlantes')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_parlantes" value="NO" checked={formState.testeo_parlantes === 'NO'} {...r('testeo_parlantes')} />NO
                                        </label>
                                        <input type="text" name="testeo_parlantes_obs" value={formState.testeo_parlantes_obs || ''} {...p('testeo_parlantes')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Teclado:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_teclado" value="SI" checked={formState.testeo_teclado === 'SI'} {...r('testeo_teclado')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_teclado" value="NO" checked={formState.testeo_teclado === 'NO'} {...r('testeo_teclado')} />NO
                                        </label>
                                        <input type="text" name="testeo_teclado_obs" value={formState.testeo_teclado_obs || ''} {...p('testeo_teclado')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Lectora:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_lectora" value="SI" checked={formState.testeo_lectora === 'SI'} {...r('testeo_lectora')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_lectora" value="NO" checked={formState.testeo_lectora === 'NO'} {...r('testeo_lectora')} />NO
                                        </label>
                                        <input type="text" name="testeo_lectora_obs" value={formState.testeo_lectora_obs || ''} {...p('testeo_lectora')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Touchpad:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_touchpad" value="SI" checked={formState.testeo_touchpad === 'SI'} {...r('testeo_touchpad')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_touchpad" value="NO" checked={formState.testeo_touchpad === 'NO'} {...r('testeo_touchpad')} />NO
                                        </label>
                                        <input type="text" name="testeo_touchpad_obs" value={formState.testeo_touchpad_obs || ''} {...p('testeo_touchpad')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Wifi:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_wifi" value="SI" checked={formState.testeo_wifi === 'SI'} {...r('testeo_wifi')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_wifi" value="NO" checked={formState.testeo_wifi === 'NO'} {...r('testeo_wifi')} />NO
                                        </label>
                                        <input type="text" name="testeo_wifi_obs" value={formState.testeo_wifi_obs || ''} {...p('testeo_wifi')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">RJ45:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_rj45" value="SI" checked={formState.testeo_rj45 === 'SI'} {...r('testeo_rj45')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_rj45" value="NO" checked={formState.testeo_rj45 === 'NO'} {...r('testeo_rj45')} />NO
                                        </label>
                                        <input type="text" name="testeo_rj45_obs" value={formState.testeo_rj45_obs || ''} {...p('testeo_rj45')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">USB:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_usb" value="SI" checked={formState.testeo_usb === 'SI'} {...r('testeo_usb')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_usb" value="NO" checked={formState.testeo_usb === 'NO'} {...r('testeo_usb')} />NO
                                        </label>
                                        <input type="text" name="testeo_usb_obs" value={formState.testeo_usb_obs || ''} {...p('testeo_usb')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Tipo C:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_tipo_c" value="SI" checked={formState.testeo_tipo_c === 'SI'} {...r('testeo_tipo_c')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_tipo_c" value="NO" checked={formState.testeo_tipo_c === 'NO'} {...r('testeo_tipo_c')} />NO
                                        </label>
                                        <input type="text" name="testeo_tipo_c_obs" value={formState.testeo_tipo_c_obs || ''} {...p('testeo_tipo_c')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">HDMI:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_hdmi" value="SI" checked={formState.testeo_hdmi === 'SI'} {...r('testeo_hdmi')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_hdmi" value="NO" checked={formState.testeo_hdmi === 'NO'} {...r('testeo_hdmi')} />NO
                                        </label>
                                        <input type="text" name="testeo_hdmi_obs" value={formState.testeo_hdmi_obs || ''} {...p('testeo_hdmi')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">VGA:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_vga" value="SI" checked={formState.testeo_vga === 'SI'} {...r('testeo_vga')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_vga" value="NO" checked={formState.testeo_vga === 'NO'} {...r('testeo_vga')} />NO
                                        </label>
                                        <input type="text" name="testeo_vga_obs" value={formState.testeo_vga_obs || ''} {...p('testeo_vga')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Otros:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_otros" value="SI" checked={formState.testeo_otros === 'SI'} {...r('testeo_otros')} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_otros" value="NO" checked={formState.testeo_otros === 'NO'} {...r('testeo_otros')} />NO
                                        </label>
                                        <input type="text" name="testeo_otros_obs" value={formState.testeo_otros_obs || ''} {...p('testeo_otros')} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="border-t pt-4 dark:border-gray-700">
                            <h3 className="font-bold text-lg mb-3">SERVICIO REALIZADO FINAL</h3>
                            <textarea name="testeo_servicio_final" value={formState.testeo_servicio_final || ''} {...p('testeo_servicio_final')} placeholder="Descripción del servicio realizado" className={`${inputProps.className} w-full`} rows="4"></textarea>
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

            {/* Componente MEMOIZADO: No se renderiza al escribir en el formulario */}
            {memoizedReportHeader}

            {/* SECCIÓN EDITABLE: SERVICIOS ADICIONALES */}
            {isActualTech && canEditAdditionalServices && (
                <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-red-500 border-b pb-3 dark:border-gray-700">Servicios Adicionales (Editable)</h2>

                    {/* El campo A Cuenta editable se elimina de aquí */}

                    {canEditAdditionalServices && (
                        <div className="mt-4 border p-4 rounded-lg dark:border-gray-600 space-y-4">
                            <h3 className="text-lg font-bold text-pink-500 dark:text-pink-400 border-b pb-2">Servicios Adicionales</h3>

                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Descripción del servicio"
                                    value={nuevoServicio.description}
                                    onChange={(e) =>
                                        setNuevoServicio((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    disabled={!canEditAdditionalServices || isReportFinalized}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="Monto (S/)"
                                    value={nuevoServicio.amount}
                                    onChange={(e) =>
                                        setNuevoServicio((prev) => ({
                                            ...prev,
                                            amount: parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                    className="w-full md:w-32 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    disabled={!canEditAdditionalServices || isReportFinalized}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddServicioAdicional}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-lg flex items-center disabled:bg-blue-400"
                                    disabled={!canEditAdditionalServices || isReportFinalized}
                                >
                                    <FaPlus />
                                </button>
                            </div>

                            <ul className="space-y-1">
                                {editableAdditionalServices.length === 0 && (
                                    <li className="text-gray-500">No hay servicios adicionales registrados.</li>
                                )}
                                {editableAdditionalServices.map((service) => (
                                    <li
                                        key={service.id}
                                        className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md"
                                    >
                                        <span>
                                            {service.description} - S/ {parseFloat(service.amount).toFixed(2)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteServicioAdicional(service.id)}
                                            className="ml-4 text-red-500 hover:text-red-700"
                                            disabled={!canEditAdditionalServices || isReportFinalized}
                                        >
                                            <FaTimes />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {isActualTech && (
                <>
                    <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                        {renderAreaForm()}
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                        <button
                            onClick={() => setIsAddServiceModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                            disabled={!isAllowedToEdit || isReportFinalized}
                        >
                            <FaPlus className="mr-2" /> Agregar Servicio
                        </button>
                        <button
                            onClick={handleOpenCompletionModal}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                            disabled={!isAllowedToEdit || isReportFinalized}
                        >
                            <FaCheckCircle className="mr-2" /> Completar Tarea
                        </button>
                    </div>
                </>
            )}

            {/* Componente MEMOIZADO: No se renderiza al escribir en el formulario */}
            {memoizedHistorySection}

            {isCompletionModalOpen && (
                <Modal onClose={handleCloseCompletionModal}>
                    <form onSubmit={handleCompleteTask} className="space-y-4 p-4">
                        <h2 className="text-xl font-bold">Completar Tarea en Área de {report.area}</h2>
                        <div>
                            <label className="block text-sm font-medium mb-1">Diagnostico y Servicios Realizados</label>
                            <textarea
                                value={motivoText}
                                rows="4"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Motivo de la tarea."
                                readOnly
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Observaciones</label>
                            <textarea
                                value={reparacionFinal}
                                onChange={(e) => setReparacionFinal(e.target.value)}
                                rows="4"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Describe las observaciones del equipo."
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
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
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
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
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

            {/* Modal for Adding Service (Enabling Fields) */}
            {isAddServiceModalOpen && (
                <Modal onClose={() => setIsAddServiceModalOpen(false)}>
                    <div className="p-4 space-y-4">
                        <h2 className="text-xl font-bold">Agregar Servicio / Detalle</h2>
                        <p className="text-sm text-gray-500">Seleccione el servicio o detalle que desea modificar o agregar.</p>

                        <Select
                            options={getConfigForArea(report.area)}
                            onChange={setSelectedServiceToAdd}
                            placeholder="Seleccione un servicio..."
                            styles={selectStyles(theme)}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />

                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                onClick={() => setIsAddServiceModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmAddService}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                                disabled={!selectedServiceToAdd}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// Helper to get configuration of fields per area
const getConfigForArea = (area) => {
    switch (area) {
        case 'HARDWARE':
            return [
                { value: 'mant_hardware', label: 'Mantenimiento de Hardware' },
                { value: 'reconstruccion', label: 'Reconstrucción' },
                { value: 'adapt_parlantes', label: 'Adaptación de Parlantes' },
                { value: 'cambio_teclado', label: 'Cambio de Teclado' },
                { value: 'cambio_pantalla', label: 'Cambio de Pantalla' },
                { value: 'cambio_carcasa', label: 'Cambio de Carcasa' },
                { value: 'cambio_placa', label: 'Cambio de Placa' },
                { value: 'cambio_fuente', label: 'Cambio de Fuente' },
                { value: 'cambio_video', label: 'Cambio de Tarj. Video' },
                { value: 'otros', label: 'Otros Hardware' },
                { value: 'repoten_ssd', label: 'Repotenciación SSD' },
                { value: 'repoten_nvme', label: 'Repotenciación NVME' },
                { value: 'repoten_m2', label: 'Repotenciación M.2 SATA' },
                { value: 'repoten_hdd', label: 'Repotenciación HDD' },
                { value: 'repoten_ram', label: 'Repotenciación RAM' },
            ];
        case 'SOFTWARE':
            return [
                { value: 'backup', label: 'Backup de Información' },
                { value: 'clonacion', label: 'Clonación de Disco' },
                { value: 'formateo', label: 'Formateo + Programas' },
                { value: 'drivers', label: 'Instalación de Drivers' },
                { value: 'act_win', label: 'Activación de Windows' },
                { value: 'act_office', label: 'Activación de Office' },
                { value: 'optimizacion', label: 'Optimización de sistema' },
                { value: 'diseno', label: 'Inst. de Prog. de Diseño' },
                { value: 'ingenieria', label: 'Inst. de Prog. de Ing.' },
                { value: 'sw_otros', label: 'Otros Software' }
            ];
        case 'ELECTRONICA':
            return [
                { value: 'elec_video', label: 'Tarjeta de Video' },
                { value: 'elec_placa', label: 'Placa Madre' },
                { value: 'elec_otro', label: 'Otro Componente' },
                { value: 'elec_generales', label: 'Datos Generales (Código, Etapa, Obs)' } // Virtual key for textareas
            ];
        case 'TESTEO':
            // Testeo might be different, but user asked for "Add Service" in general. 
            // Listing main test categories.
            return [
                { value: 'testeo_procesador', label: 'Procesador' },
                { value: 'testeo_video_dedicado', label: 'Video Dedicado' },
                { value: 'testeo_memoria_ram', label: 'Memoria RAM' },
                { value: 'testeo_disco', label: 'Disco' },
                { value: 'testeo_pantalla', label: 'Pantalla' },
                { value: 'testeo_bateria', label: 'Batería' },
                { value: 'testeo_cargador', label: 'Cargador' },
                { value: 'testeo_camara', label: 'Cámara' },
                { value: 'testeo_microfono', label: 'Micrófono' },
                { value: 'testeo_auricular', label: 'Auricular' },
                { value: 'testeo_parlantes', label: 'Parlantes' },
                { value: 'testeo_teclado', label: 'Teclado' },
                { value: 'testeo_lectora', label: 'Lectora' },
                { value: 'testeo_touchpad', label: 'Touchpad' },
                { value: 'testeo_wifi', label: 'Wifi' },
                { value: 'testeo_rj45', label: 'RJ45' },
                { value: 'testeo_usb', label: 'USB' },
                { value: 'testeo_tipo_c', label: 'Tipo C' },
                { value: 'testeo_hdmi', label: 'HDMI' },
                { value: 'testeo_vga', label: 'VGA' },
                { value: 'testeo_otros', label: 'Otros Testeo' },
                { value: 'testeo_servicio_final', label: 'Servicio Realizado Final' }
            ];
        default: return [];
    }
};

export default DetalleDiagnostico;