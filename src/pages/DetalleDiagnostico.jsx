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



const SERVICE_FIELD_MAPPING = {
    // Hardware
    'cambio_teclado': [{ name: 'cambio_teclado_codigo', label: 'Código', placeholder: 'Código del teclado' }],
    'cambio_pantalla': [
        { name: 'cambio_pantalla_codigo', label: 'Código', placeholder: 'Código' },
        { name: 'cambio_pantalla_resolucion', label: 'Resolución', placeholder: 'ej. 1920x1080' },
        { name: 'cambio_pantalla_hz', label: 'Hz', placeholder: 'ej. 60Hz' }
    ],
    'cambio_carcasa': [{ name: 'cambio_carcasa_obs', label: 'Observación', placeholder: 'Detalles de carcasa' }],
    'cambio_placa': [
        { name: 'cambio_placa_codigo', label: 'Código', placeholder: 'Código' },
        { name: 'cambio_placa_especif', label: 'Especificación', placeholder: 'Detalle' }
    ],
    'cambio_fuente': [
        { name: 'cambio_fuente_codigo', label: 'Código', placeholder: 'Código' },
        { name: 'cambio_fuente_especif', label: 'Especificación', placeholder: 'Detalle' }
    ],
    'cambio_video': [
        { name: 'cambio_video_codigo', label: 'Código', placeholder: 'Código' },
        { name: 'cambio_video_especif', label: 'Especificación', placeholder: 'Detalle' }
    ],
    'otros': [{ name: 'otros_especif', label: 'Especifique', placeholder: 'Detalle del hardware' }],
    'repoten_ssd': [
        { name: 'repoten_ssd_gb', label: 'GB', placeholder: 'Capacidad' },
        { name: 'repoten_ssd_serie', label: 'Serie', placeholder: 'Nro Serie' },
        { name: 'repoten_ssd_codigo', label: 'Código', placeholder: 'Código' }
    ],
    'repoten_nvme': [
        { name: 'repoten_nvme_gb', label: 'GB', placeholder: 'Capacidad' },
        { name: 'repoten_nvme_serie', label: 'Serie', placeholder: 'Nro Serie' },
        { name: 'repoten_nvme_codigo', label: 'Código', placeholder: 'Código' }
    ],
    'repoten_m2': [
        { name: 'repoten_m2_gb', label: 'GB', placeholder: 'Capacidad' },
        { name: 'repoten_m2_serie', label: 'Serie', placeholder: 'Nro Serie' },
        { name: 'repoten_m2_codigo', label: 'Código', placeholder: 'Código' }
    ],
    'repoten_hdd': [
        { name: 'repoten_hdd_gb', label: 'GB', placeholder: 'Capacidad' },
        { name: 'repoten_hdd_serie', label: 'Serie', placeholder: 'Nro Serie' },
        { name: 'repoten_hdd_codigo', label: 'Código', placeholder: 'Código' }
    ],
    'repoten_ram': [
        { name: 'repoten_ram_cap', label: 'Capacidad', placeholder: 'ej. 8GB' },
        { name: 'repoten_ram_cod', label: 'Código', placeholder: 'Código' }
    ],

    // Software
    'backup': [{ name: 'backup_obs', label: 'Observación', placeholder: 'Detalles' }],
    'clonacion': [{ name: 'clonacion_obs', label: 'Observación', placeholder: 'Detalles' }],
    'formateo': [{ name: 'formateo_obs', label: 'Observación', placeholder: 'Detalles' }],
    'drivers': [{ name: 'drivers_obs', label: 'Observación', placeholder: 'Detalles' }],
    'act_win': [{ name: 'act_win_obs', label: 'Observación', placeholder: 'Detalles' }],
    'act_office': [{ name: 'act_office_obs', label: 'Observación', placeholder: 'Detalles' }],
    'optimizacion': [{ name: 'optimizacion_obs', label: 'Observación', placeholder: 'Detalles' }],
    'diseno': [{ name: 'diseno_spec', label: 'Especificar Programas', placeholder: 'Lista de programas' }],
    'ingenieria': [{ name: 'ingenieria_spec', label: 'Especificar Programas', placeholder: 'Lista de programas' }],
    'sw_otros': [{ name: 'sw_otros_spec', label: 'Especificar', placeholder: 'Detalle' }],

    // Electronica
    'elec_video': [
        { name: 'elec_video_spec', label: 'Especificación', placeholder: 'Detalle del cambio/reparación' }
    ],
    'elec_placa': [
        { name: 'elec_placa_spec', label: 'Especificación', placeholder: 'Detalle del cambio/reparación' }
    ],
    'elec_otro': [
        { name: 'elec_otro_especif', label: 'Especifique', placeholder: 'Detalle' }
    ]
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
    const [isSaving, setIsSaving] = useState(false);

    // const [editableAdditionalServices, setEditableAdditionalServices] = useState([]); // Removed global state
    const [nuevoServicio, setNuevoServicio] = useState({ description: '', amount: 0, specification: '' });
    const [nuevoServicioPrinterRealizado, setNuevoServicioPrinterRealizado] = useState({ description: '', amount: 0, specification: '' });
    const [nuevoServicioPrinterAdicional, setNuevoServicioPrinterAdicional] = useState({ description: '', amount: 0, specification: '' });

    const [selectedServiceOption, setSelectedServiceOption] = useState(null); // Local selection state
    const [selectedPrinterServiceRealizado, setSelectedPrinterServiceRealizado] = useState(null);
    const [selectedPrinterServiceAdicional, setSelectedPrinterServiceAdicional] = useState(null);

    // New State for "Add Service" logic
    const [enabledFields, setEnabledFields] = useState([]);
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
    const [selectedServiceToAdd, setSelectedServiceToAdd] = useState(null);
    const [isFirstTimeInArea, setIsFirstTimeInArea] = useState(true);

    const isActualTech = report?.tecnicoActualId === currentUser?.uid;
    const isAllowedToEdit = isActualTech && ['PENDIENTE', 'ASIGNADO'].includes(report?.estado);
    const isReportFinalized = report && ['TERMINADO', 'ENTREGADO'].includes(report.estado);

    const canEditAdditionalServices = isAllowedToEdit; // Simplified permission

    const componentItems = useMemo(() => {
        if (!report || !report.items) return [];
        return report.items;
    }, [report]);

    const { diagnostico, montoServicio, total, saldo } = useMemo(() => {
        const aCuenta = parseFloat(report?.aCuenta) || 0;

        // Handle "Cobra Revisión" logic
        const shouldChargeRevision = formState.printer_cobra_revision !== 'NO' && formState.cobra_revision !== 'NO';
        // Handle "Cobra Reparación" logic
        const shouldChargeReparacion = formState.cobra_reparacion !== 'NO';

        let diagCost = parseFloat(report?.diagnostico) || 0;
        const hasReparacionService = report?.servicesList?.some(s => s.service && s.service.toUpperCase().includes('REPARACIÓN'));

        if (hasReparacionService && shouldChargeReparacion) {
            diagCost = 0;
        } else if (!shouldChargeRevision) {
            diagCost = 0;
        }

        // Recalculate service total to allow excluding specific items like "Revisión" service
        let serviceTotal = 0;
        if (report?.servicesList) {
            report.servicesList.forEach(s => {
                let amount = parseFloat(s.amount) || 0;
                // If Revision is disabled and service name contains "Revisión", exclude it
                if (!shouldChargeRevision && s.service && s.service.toUpperCase().includes('REVISIÓN')) {
                    amount = 0;
                }
                // If Reparacion is disabled and service name contains "Reparación", exclude it
                if (!shouldChargeReparacion && s.service && s.service.toUpperCase().includes('REPARACIÓN')) {
                    amount = 0;
                }
                serviceTotal += amount;
            });
        } else {
            // Fallback for legacy
            serviceTotal = parseFloat(report?.montoServicio) || 0;
        }

        // Calculate total from ALL history entries + current form state + legacy global additionalServices
        let totalAdicionales = 0;

        // 1. History entries
        if (report?.diagnosticoPorArea) {
            Object.values(report.diagnosticoPorArea).flat().forEach(entry => {
                if (entry.addedServices) {
                    entry.addedServices.forEach(s => totalAdicionales += (parseFloat(s.amount) || 0));
                }
                if (entry.printer_services_additional) {
                    entry.printer_services_additional.forEach(s => totalAdicionales += (parseFloat(s.amount) || 0));
                }
            });
        }

        // 2. Current Form State (if active)
        if (formState.addedServices) {
            formState.addedServices.forEach(s => totalAdicionales += (parseFloat(s.amount) || 0));
        }
        if (formState.printer_services_additional) {
            formState.printer_services_additional.forEach(s => totalAdicionales += (parseFloat(s.amount) || 0));
        }

        // 3. Legacy Global (if any exist from before migration)
        if (report?.additionalServices) {
            report.additionalServices.forEach(s => totalAdicionales += (parseFloat(s.amount) || 0));
        }

        const newTotal = (serviceTotal + diagCost + totalAdicionales);
        const newSaldo = newTotal - aCuenta;

        return {
            diagnostico: diagCost,
            montoServicio: serviceTotal,
            total: newTotal,
            saldo: newSaldo,
        };
    }, [report, formState.addedServices, formState.printer_services_additional]);

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

    const generateTesteoServiceSummary = useCallback((currentReport, cobraRevisionValue) => {
        if (!currentReport) return '';
        let finalSummary = [];

        // 1. Initial Services
        if (currentReport.servicesList && currentReport.servicesList.length > 0) {
            currentReport.servicesList.forEach(s => {
                let amount = parseFloat(s.amount || 0);
                // Check if we should zero out revision (If explicitly NO, zero it. If undefined or SI, keep it)
                if (cobraRevisionValue === 'NO' && s.service && s.service.toUpperCase().includes('REVISIÓN')) {
                    amount = 0;
                }
                finalSummary.push(`- ${s.service}${s.specification ? ` (${s.specification})` : ''} - S/ ${amount.toFixed(2)}`);
            });
        }

        // 2. Additional Services from Areas
        if (currentReport.diagnosticoPorArea) {
            Object.entries(currentReport.diagnosticoPorArea).forEach(([area, entries]) => {
                if (area === 'TESTEO') return; // Skip current

                const areaAddedServices = [];
                entries.forEach(entry => {
                    if (entry.addedServices && entry.addedServices.length > 0) {
                        entry.addedServices.forEach(s => areaAddedServices.push(s));
                    }
                });

                if (areaAddedServices.length > 0) {
                    areaAddedServices.forEach(s => {
                        finalSummary.push(`- ${s.description}${s.specification ? ` (${s.specification})` : ''} - S/ ${parseFloat(s.amount || 0).toFixed(2)}`);
                    });
                }
            });

            // Logic for Electronics non-reparable observation
            const elecEntries = currentReport.diagnosticoPorArea['ELECTRONICA'] || [];
            const lastElecEntry = elecEntries.length > 0 ? elecEntries[elecEntries.length - 1] : null;

            if (lastElecEntry) {
                if (lastElecEntry.elec_codigo) {
                    finalSummary.push(`CÓDIGO: ${lastElecEntry.elec_codigo}`);
                }
                if (lastElecEntry.elec_etapa) {
                    finalSummary.push(`ETAPA: ${lastElecEntry.elec_etapa}`);
                }
            }
        }

        const auxEquipo = currentReport.tipoEquipo === 'Otros' ? currentReport.otherDescription : currentReport.tipoEquipo;
        return finalSummary.join('\n').trim() + '\n' + auxEquipo + ' ' + currentReport.marca + ' ' + currentReport.modelo + ' - ' + currentReport.serie;
    }, []);

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

                // AUTO-FILL TESTEO OBSERVATIONS
                if (fetchedReport.area === 'TESTEO') {
                    const hasCambioPlaca = fetchedReport.servicesList?.some(s => s.service === 'Cambio de Placa');

                    if (!hasCambioPlaca) {
                        const getDetail = (id) => fetchedReport.items?.find(i => i.id === id)?.detalles || '';

                        if (!initialFormState.testeo_procesador) initialFormState.testeo_procesador = getDetail('procesador');
                        if (!initialFormState.testeo_video_dedicado) initialFormState.testeo_video_dedicado = getDetail('tarjetaVideo');
                        if (!initialFormState.testeo_memoria_ram) initialFormState.testeo_memoria_ram = getDetail('memoriaRam');
                    }

                    // --- AUTO-FILL TESTEO FINAL SERVICE SUMMARY ---
                    initialFormState.testeo_servicio_final = generateTesteoServiceSummary(fetchedReport, initialFormState.cobra_revision);
                }

                // AUTO-FILL PRINTER SERVICES REALIZED (FIRST TIME)
                if (fetchedReport.tipoEquipo === 'Impresora' && isFirstTime) {
                    // Transform servicesList to the structure we use { id, description, amount, specification }
                    // Note: servicesList items have { service, specification, amount }
                    initialFormState.printer_services_realized = (fetchedReport.servicesList || []).map(s => ({
                        id: Date.now() + Math.random(),
                        description: s.service,
                        amount: s.amount,
                        specification: s.specification,
                        isOther: s.isOther
                    }));
                    initialFormState.printer_services_additional = [];
                }

                setFormState(initialFormState);

                setUbicacionFisica(fetchedReport.ubicacionFisica || '');

                if (!initialFormState.addedServices) initialFormState.addedServices = [];
                // setEditableAdditionalServices(fetchedReport.additionalServices || []); // Removed

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
    }, [reportId, generateTesteoServiceSummary]);

    // NEW EFFECT: Watch for cobra_revision changes in TESTEO to update summary text
    useEffect(() => {
        if (report && report.area === 'TESTEO') {
            const newSummary = generateTesteoServiceSummary(report, formState.cobra_revision);
            setFormState(prev => {
                if (prev.testeo_servicio_final === newSummary) return prev;
                return { ...prev, testeo_servicio_final: newSummary };
            });
        }
    }, [formState.cobra_revision, report, generateTesteoServiceSummary]);

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

    const handleRadioClick = (e) => {
        if (!isAllowedToEdit || isReportFinalized) return;
        const permissionKey = e.target.dataset.pk || e.target.name;
        if (isFieldReadOnly(permissionKey)) return;

        const { name, value } = e.target;
        if (formState[name] === value) {
            // Deselect if already checked
            setFormState(prev => ({
                ...prev,
                [name]: null,
            }));
        }
    };

    const handleAddLocalService = () => {
        if (!selectedServiceOption || !nuevoServicio.amount) return;

        // For TesteoManual, we don't enable fields in formState like others
        if (selectedServiceOption.value === 'TesteoManual') {
            // Pass through
        } else if (selectedServiceOption.value) {
            setEnabledFields(prev => {
                if (!prev.includes(selectedServiceOption.value)) {
                    return [...prev, selectedServiceOption.value];
                }
                return prev;
            });

            // Removed pre-check block here, moving it to post-commit inside logic below

        }

        const amountVal = parseFloat(nuevoServicio.amount);
        let finalDescription = selectedServiceOption.label;
        let finalSpec = '';
        let isOther = false;

        // Dynamic Description Building based on Mapped Fields - USING TEMP VALUES
        const mapping = SERVICE_FIELD_MAPPING[selectedServiceOption.value];
        const tempValues = nuevoServicio.dynamicValues || {};

        if (mapping) {
            const detailsParts = mapping.map(field => {
                const val = tempValues[field.name];
                if (val && val !== 'null' && val !== 'undefined') {
                    if (field.type === 'radio') {
                        return `${field.label}: ${val}`;
                    }
                    return `${field.label}: ${val}`;
                }
                return null;
            }).filter(Boolean);

            if (detailsParts.length > 0) {
                finalDescription += ` (${detailsParts.join(', ')})`;
            }

            // HERE is where we sync to formState (Summary)
            setFormState(prev => {
                const updates = { ...prev };
                // 1. Commit the dynamic values (specs, obs, etc)
                mapping.forEach(field => {
                    if (tempValues[field.name]) {
                        updates[field.name] = tempValues[field.name];
                    }
                });

                // 2. Turn on the main checkbox if applicable (e.g. ELECTRONICA parts)
                if (['ELECTRONICA', 'HARDWARE', 'SOFTWARE'].includes(report.area)) {
                    updates[selectedServiceOption.value] = true;
                    // Ensure reparable defaults if needed when turning on
                    if (report.area === 'ELECTRONICA' && ['elec_video', 'elec_placa', 'elec_otro'].includes(selectedServiceOption.value)) {
                        if (!prev[`${selectedServiceOption.value}_reparable`]) {
                            updates[`${selectedServiceOption.value}_reparable`] = 'SI';
                        }
                    }
                }
                return updates;
            });
        } else {
            // Fallback for manual spec input (e.g. 'Otros' generic or unmapped fields)
            const areasWithSpec = ['ELECTRONICA', 'HARDWARE', 'SOFTWARE'];
            if (selectedServiceOption.value === 'Otros' || (areasWithSpec.includes(report.area) && report.area !== 'TESTEO')) {
                if (!nuevoServicio.specification && selectedServiceOption.value === 'Otros') {
                    toast.error("Debe especificar el servicio.");
                    return;
                }
                if (nuevoServicio.specification) {
                    finalDescription = `${selectedServiceOption.label} (${nuevoServicio.specification})`;
                }
                if (selectedServiceOption.value === 'Otros') isOther = true;
            }
        }


        const serviceToAdd = {
            id: Date.now(),
            serviceKey: selectedServiceOption.value,
            description: finalDescription,
            amount: amountVal,
            specification: finalSpec,
            isOther: isOther
        };

        setFormState(prev => ({
            ...prev,
            addedServices: [...(prev.addedServices || []), serviceToAdd]
        }));

        // Reset inputs
        setNuevoServicio({ description: '', amount: 0, specification: '' });
        setSelectedServiceOption(null);
    };

    const handleAddPrinterService = (type) => {
        // type: 'REALIZADOS' or 'ADICIONALES'
        const isRealizado = type === 'REALIZADOS';
        const currentSelection = isRealizado ? selectedPrinterServiceRealizado : selectedPrinterServiceAdicional;
        const currentNewService = isRealizado ? nuevoServicioPrinterRealizado : nuevoServicioPrinterAdicional;
        const setSelection = isRealizado ? setSelectedPrinterServiceRealizado : setSelectedPrinterServiceAdicional;
        const setNewService = isRealizado ? setNuevoServicioPrinterRealizado : setNuevoServicioPrinterAdicional;
        const listKey = isRealizado ? 'printer_services_realized' : 'printer_services_additional';

        if (!currentSelection || !currentNewService.amount) return;

        const amountVal = parseFloat(currentNewService.amount);
        let finalDescription = currentSelection.label;
        let finalSpec = '';
        let isOther = false;

        if (currentSelection.value === 'Otros') {
            if (!currentNewService.specification) {
                toast.error("Debe especificar el servicio.");
                return;
            }
            finalDescription = currentNewService.specification;
            isOther = true;
        }

        const serviceToAdd = {
            id: Date.now(),
            description: finalDescription,
            amount: amountVal,
            specification: finalSpec, // We use description for the spec text if 'Otros', otherwise no extra spec needed or we could add it
            isOther: isOther
        };

        setFormState(prev => ({
            ...prev,
            [listKey]: [...(prev[listKey] || []), serviceToAdd]
        }));

        setNewService({ description: '', amount: 0, specification: '' });
        setSelection(null);
    };

    const handleRemovePrinterService = (index, type) => {
        const listKey = type === 'REALIZADOS' ? 'printer_services_realized' : 'printer_services_additional';
        setFormState(prev => {
            const newList = [...(prev[listKey] || [])];
            newList.splice(index, 1);
            return { ...prev, [listKey]: newList };
        });
    };

    const handleRemoveLocalService = (index) => {
        setFormState(prev => {
            const newServices = [...(prev.addedServices || [])];
            newServices.splice(index, 1);
            return {
                ...prev,
                addedServices: newServices
            };
        });
    };

    const generateTaskSummary = () => {
        if (!formState) return '';
        let summary = [];
        // For TESTEO, we keep the checklist summary because it's a diagnostic checklist
        if (report.area === 'IMPRESORA') {
            // For Impresora, keep services + additional specific to printer
            const shouldFilterRevision = formState.printer_cobra_revision === 'NO';
            const isRevision = (desc) => /revisi[oó]n/i.test(desc);

            if (formState.printer_services_realized && formState.printer_services_realized.length > 0) {
                formState.printer_services_realized.forEach(s => {
                    if (shouldFilterRevision && isRevision(s.description)) return;
                    summary.push(`- ${s.description}${s.specification ? ` (${s.specification})` : ''} - S/ ${parseFloat(s.amount).toFixed(2)}`);
                });
            }
            if (formState.printer_services_additional && formState.printer_services_additional.length > 0) {
                formState.printer_services_additional.forEach(s => {
                    if (shouldFilterRevision && isRevision(s.description)) return;
                    summary.push(`- ${s.description}${s.specification ? ` (${s.specification})` : ''} - S/ ${parseFloat(s.amount).toFixed(2)}`);
                });
            }

        } else if (report.area === 'ELECTRONICA') {
            // FOR ELECTRONICA: ONLY SHOW SERVICES (Initial + Additional) as per user request
            const initialServices = report.servicesList || [];
            const additionalServices = formState.addedServices || [];

            if (initialServices.length > 0) {
                initialServices.forEach(s => {
                    const spec = s.specification ? ` (${s.specification})` : '';
                    summary.push(`• ${s.service}${spec}`);
                });
            }

            if (additionalServices.length > 0) {
                additionalServices.forEach(s => {
                    let displayDesc = s.description;
                    // Verify if function exists before calling, as it appears missing in scan
                    if (s.serviceKey && s.serviceLabel && typeof buildServiceDescription === 'function' && SERVICE_FIELD_MAPPING[s.serviceKey]) {
                        const dyn = buildServiceDescription(s.serviceKey, s.serviceLabel, formState);
                        if (dyn) displayDesc = dyn;
                    }

                    let statusInfo = '';
                    if (s.serviceKey && ['elec_video', 'elec_placa', 'elec_otro'].includes(s.serviceKey)) {
                        const reparableStatus = formState[`${s.serviceKey}_reparable`];
                        if (reparableStatus === 'SI') statusInfo = ' - PRENDE';
                        else if (reparableStatus === 'NO') statusInfo = ' - NO PRENDE';
                    }

                    summary.push(`• ${displayDesc}${statusInfo} - S/ ${parseFloat(s.amount).toFixed(2)}`);
                });
            }

            if (formState.elec_etapa) summary.push(`Etapa: ${formState.elec_etapa}`);
            if (formState.elec_codigo) summary.push(`Código: ${formState.elec_codigo}`);

        } else {
            const initialServices = report.servicesList || [];
            const additionalServices = formState.addedServices || [];

            if (initialServices.length > 0) {
                initialServices.forEach(s => {
                    const spec = s.specification ? ` (${s.specification})` : '';
                    summary.push(`• ${s.service}${spec}`);
                });
            }

            if (additionalServices.length > 0) {
                additionalServices.forEach(s => {
                    summary.push(`• ${s.description} - S/ ${parseFloat(s.amount).toFixed(2)}`);
                });
            }
        }

        return summary.length > 0 ? summary.join('\n') : 'No se registraron servicios.';
    };

    const handleOpenCompletionModal = () => {
        if (!isAllowedToEdit || isReportFinalized) return;

        // Restore Task Summary for "Diagnostico y Servicios Realizados"
        const summary = generateTaskSummary();
        setMotivoText(summary);

        // Ensure "Observaciones" starts with Electronics Obs if applicable, otherwise blank
        if (report.area === 'ELECTRONICA') {
            setReparacionFinal(formState.elec_obs || '');
        } else if (report.area === 'IMPRESORA' || report.tipoEquipo === 'Impresora') {
            setReparacionFinal(formState.printer_observaciones || '');
        } else {
            setReparacionFinal('');
        }

        if (report.tipoEquipo === 'Impresora' || report.area === 'IMPRESORA') {
            if (report.area !== 'IMPRESORA') {
                setNextArea('IMPRESORA');
            } else {
                setNextArea('TERMINADO');
            }
            setUbicacionFisica(report.ubicacionFisica || 'TALLER');
        } else {
            // Reset or keep default
            setNextArea('');
        }

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


        // PRINTER VALIDATION
        if (report.tipoEquipo === 'Impresora') {
            // Tech 1 is usually auto-filled or strictly from report.tecnicoResponsable. 
            // Tech 2 is the external one.
            if (!formState.printer_tech2) return toast.error("El Técnico de Apoyo 2 es obligatorio.");

            // Check Imprime. It must be SI or NO.
            if (formState.printer_imprime !== 'SI' && formState.printer_imprime !== 'NO') return toast.error("Debe indicar si IMPRIME o NO.");
        }

        // ELECTRONICS VALIDATION
        if (report.area === 'ELECTRONICA' && report.tipoEquipo !== 'Impresora') {
            const isVideo = formState.elec_video;
            const isPlaca = formState.elec_placa;
            const isOtro = formState.elec_otro;

            const anySelected = isVideo || isPlaca || isOtro;

            if (anySelected) {
                const checkComponent = (checked, reparableVal, label) => {
                    if (!checked) return true;
                    const reparable = reparableVal === 'SI'; // Default is usually SI in handleFormChange but verify
                    if (reparable) {
                        if (!formState.elec_codigo?.trim()) return `El Código es obligatorio para ${label} reparable.`;
                        if (!formState.elec_etapa?.trim()) return `La Etapa es obligatoria para ${label} reparable.`;
                    } else {
                        if (!formState.elec_etapa?.trim()) return `La Etapa es obligatoria para ${label} no reparable.`;
                    }
                    return true;
                };

                const vErr = checkComponent(isVideo, formState.elec_video_reparable, 'Tarjeta Video');
                if (vErr !== true) return toast.error(vErr);

                const pErr = checkComponent(isPlaca, formState.elec_placa_reparable, 'Placa Madre');
                if (pErr !== true) return toast.error(pErr);

                const oErr = checkComponent(isOtro, formState.elec_otro_reparable, 'Otro Componente');
                if (oErr !== true) return toast.error(oErr);
            }
        }


        if (!nextArea) return toast.error('Debes seleccionar la siguiente área o marcar como terminado.');
        if (!ubicacionFisica) return toast.error('Debes ingresar la ubicación física.');

        setIsSaving(true);


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
                addedServices: formState.addedServices || [],
                // Printer specific lists persistence
                printer_services_realized: formState.printer_services_realized || [],
                printer_services_additional: formState.printer_services_additional || [],
            };

            const updatedDiagnosticoPorArea = {
                ...report.diagnosticoPorArea,
                [report.area]: currentAreaHistory,
            };

            const currentACuenta = parseFloat(report.aCuenta) || 0;

            // Use values calculated in useMemo
            const finalTotal = total;
            const finalSaldo = saldo;

            const newGlobalState = nextArea === 'TERMINADO' ? 'TERMINADO' : 'ASIGNADO';

            const updatedData = {
                diagnosticoPorArea: updatedDiagnosticoPorArea,
                estado: newGlobalState,
                area: isTransfer ? nextArea : report.area,
                tecnicoActual: isTransfer ? nextTechnicianName : report.tecnicoActual,
                tecnicoActualId: isTransfer ? nextTechnicianId : report.tecnicoActualId,
                ubicacionFisica: ubicacionFisica,

                aCuenta: currentACuenta,
                total: total,
                saldo: saldo,
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
        } finally {
            setIsSaving(false);
        }
    };

    const nextAreaOptions = useMemo(() => {
        if (!report) return [];

        // Opciones base disponibles para todos
        const generalOptions = ['SOFTWARE', 'HARDWARE', 'ELECTRONICA', 'TESTEO'];

        // Regla: En el area IMPRESORA debe mostrarse solo si el equipo es una impresora
        if (report.tipoEquipo === 'Impresora') {
            generalOptions.push('IMPRESORA');
        }

        const options = generalOptions.map(area => ({ value: area, label: area }));

        const isPrinterCompletionArea = report.tipoEquipo === 'Impresora' && report.area === 'IMPRESORA';

        if (report.area === 'TESTEO' || isPrinterCompletionArea) {
            options.push({ value: 'TERMINADO', label: 'TERMINADO (Listo para entregar)' });
        }

        return options;
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
    const accumulatedObservations = useMemo(() => {
        if (!flatHistory) return '';
        // flatHistory is DESCending (Newest first). We want ASCending (Oldest first) for accumulation log.
        const chronological = [...flatHistory].reverse();
        return chronological
            .map(h => h.reparacion)
            .filter(obs => obs && obs.trim() !== '' && obs !== 'No se registraron servicios.')
            .map(obs => `- ${obs}`) // Add bullet point per entry
            .join('\n');
    }, [flatHistory]);

    const memoizedReportHeader = useMemo(() => (
        <ReadOnlyReportHeader
            report={report}
            diagnostico={diagnostico}
            montoServicio={montoServicio}
            total={total}
            saldo={saldo}
            componentItems={componentItems}
            observations={accumulatedObservations}
        />
    ), [report, diagnostico, montoServicio, total, saldo, componentItems, accumulatedObservations]);

    // OPTIMIZACIÓN CLAVE: Memoizamos el historial para que tampoco se renderice al teclear
    const memoizedHistorySection = useMemo(() => (
        <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-500 mb-3">Historial de Intervenciones</h2>
            <div className="space-y-4">
                {flatHistory.length > 0 ? (
                    flatHistory.map((entry, index) => (
                        <ReadOnlyAreaHistory key={index} entry={entry} areaName={entry.areaName} report={report} />
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
        // Exemptions: Billing flags should always be editable if the form is generally editable
        if (fieldKey === 'cobra_revision' || fieldKey === 'printer_cobra_revision' || fieldKey === 'cobra_reparacion') return false;

        // User Request: Testeo is always editable (can be modified as many times as wanted)
        if (report && report.area === 'TESTEO') return false;

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
        const hasRevisionService = report.servicesList?.some(s => s.service && s.service.toUpperCase().includes('REVISIÓN'));
        const hasReparacionService = report.servicesList?.some(s => s.service && s.service.toUpperCase().includes('REPARACIÓN'));

        // PRINTER SPECIAL VIEW OVERRIDE or if Area is IMPRESORA
        if (report.tipoEquipo === 'Impresora' || report.area === 'IMPRESORA') {
            const inputProps = {
                onChange: handleFormChange,
                className: "p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600",
                readOnly: !isAllowedToEdit || isReportFinalized
            };
            const radioProps = {
                onChange: handleRadioChange,
                className: "h-4 w-4 mr-1 accent-red-600", // Using red to match the design vibe or standard
                readOnly: !isAllowedToEdit || isReportFinalized
            };

            const p = (key) => ({ name: key, value: formState[key] || '', ...inputProps });
            const r = (key) => ({ name: key, ...radioProps });


            const PRINTER_SERVICES_OPTIONS = ['Limpieza de Cabezal Manual', 'Limpieza de Cabezal Software', 'Reseteo', 'Cambio de Placa', 'Cambio de Escaner', 'Mantenimiento de Hardware', 'Otros'].map(s => ({ value: s, label: s }));

            const renderPrinterServiceAdder = (title, type, selection, setSelection, newServiceState, setNewServiceState, list) => {
                return (
                    <div className="border border-gray-300 dark:border-gray-600 p-4 rounded-md mb-4 bg-gray-50 dark:bg-gray-700/50">
                        <h4 className="font-bold text-sm mb-2 text-gray-700 dark:text-gray-300 uppercase">{title}</h4>
                        {/* List */}
                        <ul className="mb-4 space-y-1">
                            {list && list.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600">
                                    <span>{item.description}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold">S/ {parseFloat(item.amount).toFixed(2)}</span>
                                        {!isReportFinalized && type === 'ADICIONALES' && isAllowedToEdit && (
                                            <button onClick={() => handleRemovePrinterService(idx, type)} className="text-red-500 hover:text-red-700"><FaTimes /></button>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {(!list || list.length === 0) && <li className="text-xs text-gray-500 italic">No hay servicios registrados.</li>}
                        </ul>

                        {/* Adder */}
                        {(!isReportFinalized && isAllowedToEdit && type === 'ADICIONALES') && (
                            <div className="flex flex-col md:flex-row gap-2 items-end">
                                <div className="flex-grow w-full">
                                    <label className="text-xs font-bold mb-1 block">SERVICIO / DETALLE</label>
                                    <Select
                                        options={PRINTER_SERVICES_OPTIONS}
                                        value={selection}
                                        onChange={setSelection}
                                        placeholder="Seleccione..."
                                        styles={selectStyles(theme)}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-bold mb-1 block">COSTO (S/)</label>
                                    <input
                                        type="number"
                                        value={newServiceState.amount}
                                        onChange={(e) => setNewServiceState(prev => ({ ...prev, amount: e.target.value }))}
                                        onFocus={() => setNewServiceState(prev => ({ ...prev, amount: '' }))}
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 text-sm h-[38px]"
                                    />
                                </div>
                                <button
                                    onClick={() => handleAddPrinterService(type)}
                                    disabled={!selection || !newServiceState.amount}
                                    className="bg-black text-white px-3 py-2 rounded h-[38px] text-xs font-bold uppercase disabled:bg-gray-400 whitespace-nowrap"
                                >
                                    + AGREGAR S.A
                                </button>
                            </div>
                        )}
                        {/* Other Spec */}
                        {selection && selection.label === 'Otros' && (
                            <div className="mt-2">
                                <input
                                    type="text"
                                    value={newServiceState.specification}
                                    onChange={(e) => setNewServiceState(prev => ({ ...prev, specification: e.target.value }))}
                                    placeholder="Especifique..."
                                    className="w-full p-2 border border-red-500 rounded text-sm"
                                />
                            </div>
                        )}
                    </div>
                )
            };

            return (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 space-y-6">
                    <h2 className="text-xl font-bold text-center mb-6 uppercase border-b pb-4 dark:border-gray-700">ÁREA DE TESTEO DE IMPRESORA</h2>

                    {/* Header Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-500 text-xs">N° INFORME</span>
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded font-mono font-bold">{report.reportNumber}</div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-500 text-xs">MARCA</span>
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded font-bold">{report.marca}</div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-500 text-xs">MODELO</span>
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded font-bold">{report.modelo}</div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-500 text-xs">SERIE</span>
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded font-bold">{report.serie}</div>
                        </div>
                    </div>

                    {/* Technicians */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-1">TEC. DE APOYO 1 (ASIGNADO/RESPONSABLE)</label>
                            <input
                                type="text"
                                value={report.tecnicoResponsable || 'No asignado'}
                                readOnly
                                className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">TEC. DE APOYO 2 (EXTERNO) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                {...p('printer_tech2')}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Nombre del técnico externo"
                            />
                        </div>
                    </div>

                    {/* Imprime */}
                    <div className="flex flex-col items-center justify-center p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                        <span className="font-bold mb-3">¿IMPRIME?</span>
                        <div className="flex gap-8">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value="SI" checked={formState.printer_imprime === 'SI'} {...r('printer_imprime')} className="w-5 h-5 accent-black dark:accent-white" />
                                <span className="font-bold">SI</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value="NO" checked={formState.printer_imprime === 'NO'} {...r('printer_imprime')} className="w-5 h-5 accent-black dark:accent-white" />
                                <span className="font-bold">NO</span>
                            </label>
                        </div>
                    </div>

                    {/* Services Lists */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderPrinterServiceAdder(
                            "MOTIVO DE INGRESO",
                            "REALIZADOS",
                            selectedPrinterServiceRealizado,
                            setSelectedPrinterServiceRealizado,
                            nuevoServicioPrinterRealizado,
                            setNuevoServicioPrinterRealizado,
                            formState.printer_services_realized
                        )}
                        {renderPrinterServiceAdder(
                            "SERVICIO ADICIONAL",
                            "ADICIONALES",
                            selectedPrinterServiceAdicional,
                            setSelectedPrinterServiceAdicional,
                            nuevoServicioPrinterAdicional,
                            setNuevoServicioPrinterAdicional,
                            formState.printer_services_additional
                        )}
                    </div>

                    {/* Observations */}
                    <div>
                        <label className="block text-sm font-bold mb-1 uppercase bg-black text-white px-2 py-1 w-max rounded-t">OBSERVACIONES</label>
                        <textarea
                            name="printer_observaciones"
                            value={formState.printer_observaciones || ''}
                            onChange={handleFormChange}
                            rows="4"
                            className="w-full p-3 border-2 border-black rounded-b-md rounded-tr-md dark:bg-gray-700 dark:border-gray-600 font-medium"
                            placeholder="Ingrese las observaciones técnicas aquí..."
                            readOnly={!isAllowedToEdit || isReportFinalized}
                        ></textarea>
                    </div>

                    {/* Cobro Revision */}
                    {hasRevisionService && (
                        <div className="flex justify-end items-center gap-4">
                            <span className="font-bold text-sm">¿SE COBRA REVISIÓN?</span>
                            <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 px-3 py-1 rounded border dark:border-gray-600">
                                <input type="radio" name="printer_cobra_revision" value="SI" checked={formState.printer_cobra_revision === 'SI' || !formState.printer_cobra_revision} {...r('printer_cobra_revision')} className="w-4 h-4 accent-black" />
                                <span className="font-bold text-sm">SI</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 px-3 py-1 rounded border dark:border-gray-600">
                                <input type="radio" name="printer_cobra_revision" value="NO" checked={formState.printer_cobra_revision === 'NO'} {...r('printer_cobra_revision')} className="w-4 h-4 accent-black" />
                                <span className="font-bold text-sm">NO</span>
                            </label>
                        </div>
                    )}

                </div>
            );
        }

        const commonFields = (
            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4">
                <p className="font-bold text-lg text-black dark:text-white">SERVICIO EN CURSO</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Técnico de Recepción:</label>
                        <input type="text" value={report.tecnicoRecepcion || ''} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Técnico Inicial (Abrio el Equipo):</label>
                        <input type="text" value={report.tecnicoInicial || ''} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Técnico de Testeo:</label>
                        <input type="text" value={report.tecnicoTesteo || ''} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
                    </div>
                </div>
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
        const r = (key) => ({
            ...getProps(key, radioProps, true),
            onClick: handleRadioClick
        });

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
                                <input type="text" name="repoten_ssd_codigo" value={formState.repoten_ssd_codigo || ''} {...p('repoten_ssd')} placeholder="Código" className={`${inputProps.className} w-24`} />
                            </div>

                            {/* NVME */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_nvme" checked={formState.repoten_nvme || false} {...c('repoten_nvme')} />NVME</label>
                                <input type="text" name="repoten_nvme_gb" value={formState.repoten_nvme_gb || ''} {...p('repoten_nvme')} placeholder="GB" className={`${inputProps.className} w-24`} />
                                <input type="text" name="repoten_nvme_serie" value={formState.repoten_nvme_serie || ''} {...p('repoten_nvme')} placeholder="Serie" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="repoten_nvme_codigo" value={formState.repoten_nvme_codigo || ''} {...p('repoten_nvme')} placeholder="Código" className={`${inputProps.className} w-24`} />
                            </div>

                            {/* M2 SATA */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_m2" checked={formState.repoten_m2 || false} {...c('repoten_m2')} />M2 SATA</label>
                                <input type="text" name="repoten_m2_gb" value={formState.repoten_m2_gb || ''} {...p('repoten_m2')} placeholder="GB" className={`${inputProps.className} w-24`} />
                                <input type="text" name="repoten_m2_serie" value={formState.repoten_m2_serie || ''} {...p('repoten_m2')} placeholder="Serie" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="repoten_m2_codigo" value={formState.repoten_m2_codigo || ''} {...p('repoten_m2')} placeholder="Código" className={`${inputProps.className} w-24`} />
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
                            {/* Dynamic Labels with Asterisks */}
                            {(() => {
                                const isVideo = formState.elec_video;
                                const isPlaca = formState.elec_placa;
                                const isOtro = formState.elec_otro;
                                const anySelected = isVideo || isPlaca || isOtro;

                                let codigoRequired = false;
                                let etapaRequired = false;

                                if (anySelected) {
                                    // Logic: if ANY selected is Reparable=SI -> Code Required
                                    // If ANY selected -> Etapa Required (per instructions: Reparable->Code+Etapa, NoRepair->Etapa)

                                    const isVideoRep = formState.elec_video_reparable === 'SI' || formState.elec_video_reparable === undefined;
                                    const isPlacaRep = formState.elec_placa_reparable === 'SI' || formState.elec_placa_reparable === undefined;
                                    const isOtroRep = formState.elec_otro_reparable === 'SI' || formState.elec_otro_reparable === undefined;

                                    if ((isVideo && isVideoRep) || (isPlaca && isPlacaRep) || (isOtro && isOtroRep)) {
                                        codigoRequired = true;
                                    }
                                    etapaRequired = true; // Always required if any component checked
                                }

                                return (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Código {codigoRequired && <span className="text-red-500">*</span>}</label>
                                            <textarea name="elec_codigo" value={formState.elec_codigo || ''} {...p('elec_generales')} placeholder="Código del repuesto..." className={`${inputProps.className} w-full`} rows="2"></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Etapa {etapaRequired && <span className="text-red-500">*</span>}</label>
                                            <textarea name="elec_etapa" value={formState.elec_etapa || ''} {...p('elec_generales')} placeholder="Etapa de la reparación..." className={`${inputProps.className} w-full`} rows="2"></textarea>
                                        </div>
                                    </>
                                );
                            })()}
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
                        {/* Cobro Revision Generic - TESTEO Only if revision service exists */}
                        {hasRevisionService && (
                            <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t dark:border-gray-700">
                                <span className="font-bold text-sm">¿SE COBRA REVISIÓN?</span>
                                <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 px-3 py-1 rounded border dark:border-gray-600">
                                    <input type="radio" name="cobra_revision" value="SI" checked={formState.cobra_revision === 'SI' || !formState.cobra_revision} {...r('cobra_revision')} className="w-4 h-4 accent-black" />
                                    <span className="font-bold text-sm">SI</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 px-3 py-1 rounded border dark:border-gray-600">
                                    <input type="radio" name="cobra_revision" value="NO" checked={formState.cobra_revision === 'NO'} {...r('cobra_revision')} className="w-4 h-4 accent-black" />
                                    <span className="font-bold text-sm">NO</span>
                                </label>
                            </div>
                        )}
                        {/* Cobro Reparacion - TESTEO Only if reparacion service exists */}
                        {hasReparacionService && (
                            <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t dark:border-gray-700">
                                <span className="font-bold text-sm">¿SE COBRA REPARACIÓN?</span>
                                <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 px-3 py-1 rounded border dark:border-gray-600">
                                    <input type="radio" name="cobra_reparacion" value="SI" checked={formState.cobra_reparacion === 'SI' || !formState.cobra_reparacion} {...r('cobra_reparacion')} className="w-4 h-4 accent-black" />
                                    <span className="font-bold text-sm">SI</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-700 px-3 py-1 rounded border dark:border-gray-600">
                                    <input type="radio" name="cobra_reparacion" value="NO" checked={formState.cobra_reparacion === 'NO'} {...r('cobra_reparacion')} className="w-4 h-4 accent-black" />
                                    <span className="font-bold text-sm">NO</span>
                                </label>
                            </div>
                        )}
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


            {isActualTech && (
                <>
                    <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                        {renderAreaForm()}
                        {report.tipoEquipo !== 'Impresora' && renderAdditionalServicesSection(
                            report, isAllowedToEdit, isReportFinalized,
                            formState, setFormState, nuevoServicio, setNuevoServicio,
                            handleAddLocalService, handleRemoveLocalService,
                            selectStyles, theme, getConfigForArea,
                            setSelectedServiceOption, selectedServiceOption
                        )}
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                        {/* Button Removed: Agregar Servicio */}
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

                        {/* GLOBAL DATE/TIME DISPLAY - FORMATTED DD-MM-YYYY */}
                        <div className="flex flex-col md:flex-row gap-4 mb-2 text-sm justify-center bg-gray-50 dark:bg-gray-700/50 p-2 rounded border dark:border-gray-600">
                            <div>
                                <span className="font-bold text-gray-600 dark:text-gray-400">Fecha/Hora Inicio:</span>
                                <span className="font-mono">
                                    {/* Format existing start date or current if missing to DD-MM-YYYY */}
                                    {(() => {
                                        // formState.fecha_inicio usually YYYY-MM-DD from HTML input date value or DD/MM/YYYY from saved.
                                        // We try to normalize to DD-MM-YYYY
                                        let dateStr = formState.fecha_inicio || new Date().toLocaleDateString('es-PE');
                                        // If it is YYYY-MM-DD
                                        if (dateStr && dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
                                            const parts = dateStr.split('-');
                                            dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                                        }
                                        // If it is D/M/YYYY or DD/MM/YYYY (saved typically)
                                        if (dateStr && dateStr.includes('/')) {
                                            dateStr = dateStr.replace(/\//g, '-');
                                        }
                                        return `${dateStr} ${formState.hora_inicio || '--:--'}`;
                                    })()}
                                </span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-600 dark:text-gray-400">Fecha/Hora Fin:</span>
                                <span className="font-mono">
                                    {(() => {
                                        const now = new Date();
                                        const day = String(now.getDate()).padStart(2, '0');
                                        const month = String(now.getMonth() + 1).padStart(2, '0'); // Jan is 0
                                        const year = now.getFullYear();
                                        const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                                        return `${day}-${month}-${year} ${time}`;
                                    })()}
                                </span>
                            </div>
                        </div>

                        {/* Display Support Technician if selected */}
                        {(() => {
                            let techSupportName = null;
                            if (report.tipoEquipo === 'Impresora' || report.area === 'IMPRESORA') {
                                techSupportName = formState.printer_tech2;
                            } else {
                                techSupportName = tecnicoApoyo?.label;
                            }

                            if (techSupportName) {
                                return (
                                    <div className="text-center mb-2 bg-blue-50 dark:bg-blue-900/30 p-2 rounded border border-blue-100 dark:border-blue-800">
                                        <span className="font-bold text-gray-600 dark:text-gray-300 text-sm">Técnico de Apoyo: </span>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 ml-2">{techSupportName.toUpperCase()}</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {report.area !== 'TESTEO' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Diagnostico y Servicios Realizados</label>
                                <textarea
                                    value={motivoText}
                                    rows="4"
                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
                                    placeholder="Motivo de la tarea."
                                    readOnly
                                ></textarea>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1">Observaciones</label>
                            <textarea
                                value={reparacionFinal}
                                onChange={(e) => {
                                    setReparacionFinal(e.target.value);
                                    if (report.area === 'IMPRESORA' || report.tipoEquipo === 'Impresora') {
                                        setFormState(prev => ({ ...prev, printer_observaciones: e.target.value }));
                                    }
                                }}
                                rows="4"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Describe las observaciones del equipo."
                            ></textarea>
                        </div>
                        {!(report.tipoEquipo === 'Impresora' || report.area === 'IMPRESORA') && (
                            <>
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
                                        onChange={(option) => {
                                            setNextArea(option.value);
                                            setTecnicoSiguiente(null);
                                        }}
                                        placeholder="Selecciona la siguiente área..."
                                        styles={selectStyles(theme)}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                </div>
                                {nextArea && nextArea !== 'TERMINADO' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Asignar a: <span className="text-red-500">*</span></label>
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
                            </>
                        )}
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={handleCloseCompletionModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg" disabled={isSaving}>Cancelar</button>
                            {(() => {
                                const isStandardFlow = !(report.tipoEquipo === 'Impresora' || report.area === 'IMPRESORA');
                                const isExpandedTransfer = nextArea && nextArea !== 'TERMINADO';
                                const isFormValid = !isStandardFlow || (
                                    ubicacionFisica &&
                                    nextArea &&
                                    (!isExpandedTransfer || tecnicoSiguiente)
                                );

                                return (
                                    <button
                                        type="submit"
                                        className={`font-bold py-2 px-4 rounded-lg flex items-center ${isFormValid ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                                        disabled={!isFormValid || isSaving}
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar y Pasar'}
                                    </button>
                                );
                            })()}
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal for Adding Service Removed */}
        </div>
    );
}

const renderAdditionalServicesSection = (report, isAllowedToEdit, isReportFinalized, formState, setFormState, nuevoServicio, setNuevoServicio, handleAddLocalService, handleRemoveLocalService, selectStyles, theme, getConfigForArea, setSelectedServiceOption, selectedServiceOption) => {

    // Helper to render dynamic inputs based on selected service
    const renderDynamicInputs = () => {
        if (!selectedServiceOption || !selectedServiceOption.value) return null;

        const mappedFields = SERVICE_FIELD_MAPPING[selectedServiceOption.value];

        if (mappedFields) {
            return (
                <div className="w-full md:w-auto flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {mappedFields.map((field) => {
                        const currentVal = nuevoServicio.dynamicValues?.[field.name] || '';
                        if (field.type === 'radio') {
                            return (
                                <div key={field.name} className="flex flex-col">
                                    <label className="text-xs font-bold text-gray-500 mb-1">{field.label}</label>
                                    <div className="flex items-center gap-2">
                                        {field.options.map(opt => (
                                            <label key={opt} className="flex items-center text-xs gap-1 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={field.name}
                                                    value={opt}
                                                    checked={currentVal === opt || (opt === 'SI' && !currentVal)}
                                                    onChange={(e) => setNuevoServicio(prev => ({
                                                        ...prev,
                                                        dynamicValues: { ...(prev.dynamicValues || {}), [field.name]: e.target.value }
                                                    }))}
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <div key={field.name} className="flex flex-col min-w-[120px]">
                                <label className="text-xs font-bold text-gray-500 mb-1">{field.label}</label>
                                <input
                                    type="text"
                                    value={currentVal}
                                    onChange={(e) => setNuevoServicio(prev => ({
                                        ...prev,
                                        dynamicValues: { ...(prev.dynamicValues || {}), [field.name]: e.target.value }
                                    }))}
                                    placeholder={field.placeholder}
                                    className="p-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 w-full"
                                />
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Fallback for 'Otros' or generic
        if (selectedServiceOption.label === 'Otros' || (['ELECTRONICA', 'HARDWARE', 'SOFTWARE'].includes(report.area) && report.area !== 'TESTEO')) {
            return (
                <div className="w-full md:w-64">
                    <label className="block text-sm font-medium mb-1">Especifique</label>
                    <input
                        type="text"
                        value={nuevoServicio.specification || ''}
                        onChange={(e) => setNuevoServicio(prev => ({ ...prev, specification: e.target.value }))}
                        className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 border-red-500 ring-1 ring-red-500"
                        placeholder="Detalle del servicio..."
                    />
                </div>
            );
        }
        return null;
    };

    return (
        <div className="border p-4 rounded-md mt-6 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-300 border-b pb-2">Servicios Adicionales de Área</h3>

            {/* Locked Services (History) Logic */}
            {(() => {
                // Find all locked service IDs from TERMINATED entries in this area
                const lockedServiceIds = new Set();
                if (report.diagnosticoPorArea && report.diagnosticoPorArea[report.area]) {
                    report.diagnosticoPorArea[report.area].forEach(entry => {
                        if (entry.estado === 'TERMINADO' && entry.addedServices) {
                            entry.addedServices.forEach(s => lockedServiceIds.add(s.id));
                        }
                    });
                }

                // formState.addedServices contains both historical (copied on init) and new session services
                // We split them for display purposes

                const allServices = formState.addedServices || [];
                const lockedServices = allServices.filter(s => lockedServiceIds.has(s.id));
                const sessionServices = allServices.filter(s => !lockedServiceIds.has(s.id));

                return (
                    <>
                        {/* Adder Section */}
                        {(isAllowedToEdit && !isReportFinalized) && (
                            <div className="flex flex-col gap-4 mb-6 p-4 bg-white dark:bg-gray-700 rounded-md border dark:border-gray-600">
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="w-full md:w-1/3 min-w-[200px]">
                                        <label className="block text-sm font-medium mb-1">Servicio</label>
                                        {report.area === 'TESTEO' ? (
                                            <input
                                                type="text"
                                                value={nuevoServicio.description || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setNuevoServicio(prev => ({ ...prev, description: val }));
                                                    // Identify as "Others" logically for handleAddLocalService to work without a Select option
                                                    setSelectedServiceOption({ value: 'TesteoManual', label: val });
                                                }}
                                                className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                                                placeholder="Describa el servicio..."
                                            />
                                        ) : (
                                            <Select
                                                options={report.tipoEquipo === 'Impresora'
                                                    ? ['Limpieza de Cabezal Manual', 'Limpieza de Cabezal Software', 'Reseteo', 'Cambio de Placa', 'Cambio de Escaner', 'Mantenimiento de Hardware', 'Otros'].map(s => ({ value: s, label: s }))
                                                    : getConfigForArea(report.area)
                                                }
                                                value={selectedServiceOption}
                                                onChange={(opt) => {
                                                    setSelectedServiceOption(opt);
                                                    if (opt) {
                                                        // REMOVED AUTO-CHECK of formState here as per user request to sync only on add.
                                                        setNuevoServicio(prev => ({ ...prev, description: opt.label, dynamicValues: {} }));
                                                    }
                                                }}
                                                placeholder="Seleccione un servicio..."
                                                styles={selectStyles(theme)}
                                                menuPortalTarget={document.body}
                                                menuPosition="fixed"
                                            />
                                        )}
                                    </div>

                                    {/* DYNAMIC INPUTS RENDER HERE */}
                                    {renderDynamicInputs()}


                                    <div className="w-full md:w-32 min-w-[100px]">
                                        <label className="block text-sm font-medium mb-1">Costo (S/)</label>
                                        <input
                                            type="number"
                                            value={nuevoServicio.amount}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (val < 0) return; // Prevent negative inputs
                                                setNuevoServicio(prev => ({ ...prev, amount: e.target.value }))
                                            }}
                                            onClick={(e) => { if (parseFloat(e.target.value) === 0) setNuevoServicio(prev => ({ ...prev, amount: '' })) }}
                                            onFocus={() => setNuevoServicio(prev => ({ ...prev, amount: '' }))}
                                            onBlur={(e) => { if (e.target.value === '') setNuevoServicio(prev => ({ ...prev, amount: 0 })) }}
                                            className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 font-bold"
                                            min="0"
                                        />
                                    </div>

                                    <div className="w-full md:w-auto">
                                        <button
                                            onClick={handleAddLocalService}
                                            disabled={!selectedServiceOption || nuevoServicio.amount === ''}
                                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg h-[38px] flex items-center justify-center"
                                        >
                                            <FaPlus className="mr-2" /> Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* List Section */}
                        <div className="space-y-2">
                            {/* Render Locked Services First */}
                            {lockedServices.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Historial (Bloqueado)</h4>
                                    <ul className="divide-y dark:divide-gray-700 bg-gray-100 dark:bg-gray-900/50 rounded-md border dark:border-gray-700">
                                        {lockedServices.map((service, index) => (
                                            <li key={service.id} className="flex justify-between items-center py-2 px-3 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <FaCheckCircle className="text-gray-400" size={12} />
                                                    <span>{service.description}</span>
                                                </div>
                                                <span className="font-medium">S/ {parseFloat(service.amount).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Render Session Services */}
                            {sessionServices.length > 0 ? (
                                <div>
                                    {lockedServices.length > 0 && <h4 className="text-xs font-bold text-blue-500 uppercase mb-2">Nuevos (Esta Sesión)</h4>}
                                    <ul className="divide-y dark:divide-gray-700">
                                        {sessionServices.map((service, index) => {
                                            const originalIndex = allServices.findIndex(s => s.id === service.id);

                                            // Dynamic Description for List
                                            let displayDesc = service.description;
                                            if (service.serviceKey && service.serviceLabel && typeof buildServiceDescription === 'function' && SERVICE_FIELD_MAPPING[service.serviceKey]) {
                                                const dyn = buildServiceDescription(service.serviceKey, service.serviceLabel, formState);
                                                if (dyn) displayDesc = dyn;
                                            }

                                            // NEW: Status Info for Electronica
                                            if (service.serviceKey && ['elec_video', 'elec_placa', 'elec_otro'].includes(service.serviceKey)) {
                                                const reparableStatus = formState[`${service.serviceKey}_reparable`];
                                                if (reparableStatus === 'SI') displayDesc += ' - PRENDE';
                                                else if (reparableStatus === 'NO') displayDesc += ' - NO PRENDE';
                                            }

                                            return (
                                                <li key={service.id || index} className="flex justify-between items-center py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                                        {displayDesc}
                                                    </span>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                                                            S/ {parseFloat(service.amount).toFixed(2)}
                                                        </span>
                                                        {(isAllowedToEdit && !isReportFinalized) && (
                                                            <button
                                                                onClick={() => handleRemoveLocalService(originalIndex)}
                                                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                                title="Eliminar servicio"
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : (
                                lockedServices.length === 0 && <p className="text-gray-500 italic text-sm">No se han registrado servicios adicionales.</p>
                            )}
                        </div>

                        {/* Total Local Preview */}
                        {allServices.length > 0 && (
                            <div className="mt-4 pt-2 border-t dark:border-gray-600 flex justify-end">
                                <span className="font-bold text-lg">Total Adicionales Área: S/ {allServices.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0).toFixed(2)}</span>
                            </div>
                        )}
                    </>
                );
            })()}
        </div>
    );
};

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
                { value: 'repoten_ssd', label: 'SSD' },
                { value: 'repoten_nvme', label: 'NVME' },
                { value: 'repoten_m2', label: 'M.2 SATA' },
                { value: 'repoten_hdd', label: 'HDD' },
                { value: 'repoten_ram', label: 'RAM' },
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
                { value: 'elec_otro', label: 'Otro Componente' }
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