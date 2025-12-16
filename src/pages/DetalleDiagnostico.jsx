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

const PRINT_ORDER_MAP = [
    { num: 1, id: "procesador", label: "Procesador" },
    { num: 2, id: "placaMadre", label: "Placa Madre" },
    { num: 3, id: "memoriaRam", label: "Memoria RAM" },
    { num: 4, id: "hdd", label: "HDD" },
    { num: 5, id: "ssd", label: "SSD" },
    { num: 6, id: "m2Nvme", label: "M.2 Nvme" },
    { num: 7, id: "tarjetaVideo", label: "Tarj. de video" },
    { num: 8, id: "wifi", label: "WI-FI" },
    { num: 9, id: "bateria", label: "Batería" },
    { num: 10, id: "cargador", label: "Cargador" },
    { num: 11, id: "pantalla", label: "Pantalla" },
    { num: 12, id: "teclado", label: "Teclado" },
    { num: 13, id: "camara", label: "Cámara" },
    { num: 14, id: "microfono", label: "Micrófono" },
    { num: 15, id: "parlantes", label: "Parlantes" },
    { num: 16, id: "auriculares", label: "Auriculares" },
    { num: 17, id: "rj45", label: "RJ 45" },
    { num: 18, id: "hdmi", label: "HDMI" },
    { num: 19, id: "vga", label: "VGA" },
    { num: 20, id: "usb", label: "USB" },
    { num: 21, id: "tipoC", label: "Tipo C" },
    { num: 22, id: "lectora", label: "Lectora" },
    { num: 23, id: "touchpad", label: "Touchpad" },
    { num: 24, id: "bandejas", label: "Bandejas" },
    { num: 25, id: "cables", label: "Cables" },
    { num: 26, id: "rodillos", label: "Rodillos" },
    { num: 27, id: "cabezal", label: "Cabezal de impresión" },
    { num: 28, id: "tinta", label: "Tinta / Cartucho" },
    { num: 29, id: "otros", label: "Otros" },
];

// Componente visual puro, extraído para evitar recreación
const ReadOnlyReportHeader = React.memo(({ report, diagnostico, montoServicio, total, saldo, componentItems }) => {
    const readOnlyInputProps = {
        readOnly: true,
        className: "w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed bg-white dark:bg-gray-800",
    };

    const componentItemsMap = componentItems.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
    }, {});

    const getCheckItemData = (id) => {
        const item = componentItemsMap[id];
        const isChecked = item?.checked || false;
        let detailText = (item?.detalles && item.detalles.trim() !== '') ? item.detalles : '';
        return { isChecked, detailText };
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 space-y-6">
            <h2 className="text-xl font-semibold text-blue-500 border-b pb-3 dark:border-gray-700">Datos del Cliente y Equipo (Recepción)</h2>

            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900">
                <p className="font-bold text-lg text-purple-500 dark:text-purple-400">INFORMACIÓN DEL CLIENTE</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="col-span-full">
                        <label className="block text-sm font-medium mb-1">Cliente:</label>
                        <input type="text" value={report.clientName || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Teléfono:</label>
                        <input type="text" value={report.telefono || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha/Hora Ingreso:</label>
                        <input type="text" value={`${report.fecha} ${report.hora}`} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Estado Actual:</label>
                        <input type="text" value={report.estado || 'N/A'} {...readOnlyInputProps} className={`${readOnlyInputProps.className} font-bold ${report.estado === 'ENTREGADO' ? 'text-green-500' : report.estado === 'TERMINADO' ? 'text-orange-500' : 'text-red-500'}`} />
                    </div>
                </div>
            </div>

            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900">
                <p className="font-bold text-lg text-green-500 dark:text-green-400">INFORMACIÓN DEL EQUIPO</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">¿Enciende?:</label>
                        <input type="text" value={report.canTurnOn || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Equipo:</label>
                        <input type="text" value={report.tipoEquipo || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Marca:</label>
                        <input type="text" value={report.marca || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Modelo:</label>
                        <input type="text" value={report.modelo || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Serie:</label>
                        <input type="text" value={report.serie || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Sistema Operativo:</label>
                        <input type="text" value={report.sistemaOperativo || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Clave Bitlocker:</label>
                        <input type="text" value={report.bitlockerKey ? 'Sí' : 'No'} {...readOnlyInputProps} />
                    </div>
                </div>
            </div>

            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900">
                <p className="font-bold text-lg text-orange-500 dark:text-orange-400">DETALLES DE RECEPCIÓN</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-full">
                        <label className="block text-sm font-medium mb-1">Motivo de Ingreso (Servicios):</label>
                        <textarea value={report.motivoIngreso || 'N/A'} {...readOnlyInputProps} rows="2"></textarea>
                    </div>
                    <div className="col-span-full">
                        <label className="block text-sm font-medium mb-1">Observaciones de Recepción:</label>
                        <textarea value={report.observaciones || 'N/A'} {...readOnlyInputProps} rows="2"></textarea>
                    </div>
                    <div className="col-span-full">
                        <label className="block text-sm font-medium mb-1">Detalles de Pago (Recepción):</label>
                        <input type="text" value={report.detallesPago || 'N/A'} {...readOnlyInputProps} />
                    </div>
                </div>
            </div>
        
            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900">
                <p className="font-bold text-lg text-pink-500 dark:text-pink-400">RESUMEN FINANCIERO (BASE)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> 
                    <div className="hidden lg:block">
                        <label className="block text-sm font-medium mb-1">Costo Diagnóstico (S/)</label>
                        <input type="text" value={diagnostico.toFixed(2)} {...readOnlyInputProps} /> 
                    </div>
                    <div className="hidden lg:block">
                        <label className="block text-sm font-medium mb-1">Monto Servicios (S/)</label>
                        <input type="text" value={montoServicio.toFixed(2)} {...readOnlyInputProps} /> 
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-2"> 
                        <label className="block text-sm font-medium mb-1">Total (S/)</label>
                        <input type="text" value={total.toFixed(2)} {...readOnlyInputProps} className={`${readOnlyInputProps.className} font-bold`} />
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <label className="block text-sm font-medium mb-1">Saldo (S/)</label>
                        <input type="text" value={saldo.toFixed(2)} {...readOnlyInputProps} className={`${readOnlyInputProps.className} font-bold ${saldo > 0 ? 'text-red-500' : 'text-green-500'}`} />
                    </div>
                </div>
            </div>

            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900">
                <p className="font-bold text-lg text-cyan-500 dark:text-cyan-400">COMPONENTES Y ACCESORIOS REGISTRADOS</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    {PRINT_ORDER_MAP.filter(item => componentItemsMap[item.id]?.checked || (componentItemsMap[item.id]?.detalles && componentItemsMap[item.id]?.detalles.trim() !== '')).map(item => {
                        const { isChecked, detailText } = getCheckItemData(item.id);
                        
                        if (!isChecked && !detailText) return null;

                        return (
                            <div key={item.id} className="flex items-center space-x-2">
                                <div className="flex items-center w-36 flex-shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={isChecked} 
                                        readOnly 
                                        disabled 
                                        className="h-4 w-4 mr-2 accent-green-600"
                                        style={{ opacity: 1, filter: 'none', accentColor: isChecked ? '#10B981' : '#D1D5DB' }}
                                    />
                                    <label className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                                        {item.label}:
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    value={detailText || (isChecked ? 'Registrado' : 'N/A')}
                                    {...readOnlyInputProps}
                                    className={`${readOnlyInputProps.className} flex-1 truncate text-xs py-1`}
                                />
                            </div>
                        );
                    })}
                    {componentItems.length === 0 && (
                        <p className="text-gray-500 col-span-full">No se registraron componentes específicos.</p>
                    )}
                </div>
            </div>
        </div>
    );
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

                const currentAreaHistory = fetchedReport.diagnosticoPorArea[fetchedReport.area];
                const lastEntry = currentAreaHistory && currentAreaHistory[currentAreaHistory.length - 1];

                setFormState(lastEntry || {});

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

    const handleOpenCompletionModal = () => {
        if (!isAllowedToEdit || isReportFinalized) return;
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

    const renderAreaForm = () => {
        const techniciansForSupport = users.filter(u => u.value !== currentUser.uid);

        const commonFields = (
            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4">
                <p className="font-bold text-lg text-black dark:text-white">SERVICIO EN CURSO</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha Inicio:</label>
                        <input type="text" value={formState.fecha_inicio || ''} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" disabled={isReportFinalized} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">H. Inicio:</label>
                        <input type="text" value={formState.hora_inicio || ''} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" disabled={isReportFinalized} />
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
            disabled: !isAllowedToEdit || isReportFinalized
        };
        const checkboxProps = {
            onChange: handleFormChange,
            className: "h-4 w-4 mr-2 accent-blue-600",
            disabled: !isAllowedToEdit || isReportFinalized,
            style: { opacity: 1, filter: 'none' } 
        };
        const radioProps = {
            onChange: handleRadioChange,
            className: "h-4 w-4 mr-1 accent-blue-600",
            disabled: !isAllowedToEdit || isReportFinalized,
            style: { opacity: 1, filter: 'none' } 
        }

        switch (report.area) {
            case 'HARDWARE':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-red-500">ÁREA DE HARDWARE</h2>
                        {commonFields}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md dark:border-gray-700">
                            <label className="flex items-center"><input type="checkbox" name="mant_hardware" checked={formState.mant_hardware || false} {...checkboxProps} />Mant. de Hardware</label>
                            <label className="flex items-center"><input type="checkbox" name="reconstruccion" checked={formState.reconstruccion || false} {...checkboxProps} />Reconstrucción</label>
                            <label className="flex items-center"><input type="checkbox" name="adapt_parlantes" checked={formState.adapt_parlantes || false} {...checkboxProps} />Adapt. de Parlantes</label>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700">
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_teclado" checked={formState.cambio_teclado || false} {...checkboxProps} />Cambio de Teclado:</label>
                                <input type="text" name="cambio_teclado_codigo" value={formState.cambio_teclado_codigo || ''} {...inputProps} placeholder="Código" className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_pantalla" checked={formState.cambio_pantalla || false} {...checkboxProps} />Cambio de Pantalla:</label>
                                <input type="text" name="cambio_pantalla_codigo" value={formState.cambio_pantalla_codigo || ''} {...inputProps} placeholder="Código" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="cambio_pantalla_resolucion" value={formState.cambio_pantalla_resolucion || ''} {...inputProps} placeholder="Resolución" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="cambio_pantalla_hz" value={formState.cambio_pantalla_hz || ''} {...inputProps} placeholder="Hz" className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_carcasa" checked={formState.cambio_carcasa || false} {...checkboxProps} />Cambio de Carcasa:</label>
                                <input type="text" name="cambio_carcasa_obs" value={formState.cambio_carcasa_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_placa" checked={formState.cambio_placa || false} {...checkboxProps} />Cambio de Placa:</label>
                                <input type="text" name="cambio_placa_codigo" value={formState.cambio_placa_codigo || ''} {...inputProps} placeholder="Código" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="cambio_placa_especif" value={formState.cambio_placa_especif || ''} {...inputProps} placeholder="Especif." className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_fuente" checked={formState.cambio_fuente || false} {...checkboxProps} />Cambio de Fuente:</label>
                                <input type="text" name="cambio_fuente_codigo" value={formState.cambio_fuente_codigo || ''} {...inputProps} placeholder="Código" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="cambio_fuente_especif" value={formState.cambio_fuente_especif || ''} {...inputProps} placeholder="Especif." className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="cambio_video" checked={formState.cambio_video || false} {...checkboxProps} />Cambio de Tarj. Video:</label>
                                <input type="text" name="cambio_video_codigo" value={formState.cambio_video_codigo || ''} {...inputProps} placeholder="Código" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="cambio_video_especif" value={formState.cambio_video_especif || ''} {...inputProps} placeholder="Especif." className={`${inputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" name="otros" checked={formState.otros || false} {...checkboxProps} />Otros:</label>
                                <input type="text" name="otros_especif" value={formState.otros_especif || ''} {...inputProps} placeholder="Especificar" className={`${inputProps.className} flex-1`} />
                            </div>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700">
                            <p className="font-semibold mb-3">Repotenciación:</p>

                            {/* SSD */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_ssd" checked={formState.repoten_ssd || false} {...checkboxProps} />SSD</label>
                                <input type="text" name="repoten_ssd_gb" value={formState.repoten_ssd_gb || ''} {...inputProps} placeholder="GB" className={`${inputProps.className} w-24`} />
                                <input type="text" name="repoten_ssd_serie" value={formState.repoten_ssd_serie || ''} {...inputProps} placeholder="Serie" className={`${inputProps.className} flex-1`} />
                            </div>

                            {/* NVME */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_nvme" checked={formState.repoten_nvme || false} {...checkboxProps} />NVME</label>
                                <input type="text" name="repoten_nvme_gb" value={formState.repoten_nvme_gb || ''} {...inputProps} placeholder="GB" className={`${inputProps.className} w-24`} />
                                <input type="text" name="repoten_nvme_serie" value={formState.repoten_nvme_serie || ''} {...inputProps} placeholder="Serie" className={`${inputProps.className} flex-1`} />
                            </div>

                            {/* M2 SATA */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_m2" checked={formState.repoten_m2 || false} {...checkboxProps} />M2 SATA</label>
                                <input type="text" name="repoten_m2_gb" value={formState.repoten_m2_gb || ''} {...inputProps} placeholder="GB" className={`${inputProps.className} w-24`} />
                                <input type="text" name="repoten_m2_serie" value={formState.repoten_m2_serie || ''} {...inputProps} placeholder="Serie" className={`${inputProps.className} flex-1`} />
                            </div>

                            {/* HDD (Keeping GB, Serie, Código) */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_hdd" checked={formState.repoten_hdd || false} {...checkboxProps} />HDD</label>
                                <input type="text" name="repoten_hdd_gb" value={formState.repoten_hdd_gb || ''} {...inputProps} placeholder="GB" className={`${inputProps.className} w-24`} />
                                <input type="text" name="repoten_hdd_serie" value={formState.repoten_hdd_serie || ''} {...inputProps} placeholder="Serie" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="repoten_hdd_codigo" value={formState.repoten_hdd_codigo || ''} {...inputProps} placeholder="Código" className={`${inputProps.className} w-24`} />
                            </div>

                            {/* MEMORIA RAM (Keeping Capacidad, Código) */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" name="repoten_ram" checked={formState.repoten_ram || false} {...checkboxProps} />MEMORIA RAM</label>
                                <input type="text" name="repoten_ram_cap" value={formState.repoten_ram_cap || ''} {...inputProps} placeholder="Capacidad" className={`${inputProps.className} flex-1`} />
                                <input type="text" name="repoten_ram_cod" value={formState.repoten_ram_cod || ''} {...inputProps} placeholder="Cód." className={`${inputProps.className} flex-1`} />
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
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="backup" checked={formState.backup || false} {...checkboxProps} />Backup de Información:</label><input type="text" name="backup_obs" value={formState.backup_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="clonacion" checked={formState.clonacion || false} {...checkboxProps} />Clonación de Disco:</label><input type="text" name="clonacion_obs" value={formState.clonacion_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="formateo" checked={formState.formateo || false} {...checkboxProps} />Formateo + Programas:</label><input type="text" name="formateo_obs" value={formState.formateo_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="drivers" checked={formState.drivers || false} {...checkboxProps} />Instalación de Drivers:</label><input type="text" name="drivers_obs" value={formState.drivers_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="act_win" checked={formState.act_win || false} {...checkboxProps} />Activación de Windows:</label><input type="text" name="act_win_obs" value={formState.act_win_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="act_office" checked={formState.act_office || false} {...checkboxProps} />Activación de Office:</label><input type="text" name="act_office_obs" value={formState.act_office_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="optimizacion" checked={formState.optimizacion || false} {...checkboxProps} />Optimización de sistema:</label><input type="text" name="optimizacion_obs" value={formState.optimizacion_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="sw_otros" checked={formState.sw_otros || false} {...checkboxProps} />Otros:</label><input type="text" name="sw_otros_spec" value={formState.sw_otros_spec || ''} {...inputProps} placeholder="Especif." className={`${inputProps.className} flex-1`} /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="diseno" checked={formState.diseno || false} {...checkboxProps} />Inst. de Prog. de Diseño:</label><input type="text" name="diseno_spec" value={formState.diseno_spec || ''} {...inputProps} placeholder="Especif." className={`${inputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" name="ingenieria" checked={formState.ingenieria || false} {...checkboxProps} />Inst. de Prog. de Ing.:</label><input type="text" name="ingenieria_spec" value={formState.ingenieria_spec || ''} {...inputProps} placeholder="Especif." className={`${inputProps.className} flex-1`} /></div>
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
                                    <input type="checkbox" name="elec_video" checked={formState.elec_video || false} {...checkboxProps} />
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
                                                {...radioProps}
                                            />
                                            SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input
                                                type="radio"
                                                name="elec_video_reparable"
                                                value="NO"
                                                checked={formState.elec_video_reparable === 'NO'}
                                                {...radioProps}
                                            />
                                            NO
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* PLACA */}
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input type="checkbox" name="elec_placa" checked={formState.elec_placa || false} {...checkboxProps} />
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
                                                {...radioProps}
                                            />
                                            SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input
                                                type="radio"
                                                name="elec_placa_reparable"
                                                value="NO"
                                                checked={formState.elec_placa_reparable === 'NO'}
                                                {...radioProps}
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
                                        <input type="checkbox" name="elec_otro" checked={formState.elec_otro || false} {...checkboxProps} />
                                        OTRO
                                    </label>
                                    {formState.elec_otro && (
                                        <input
                                            type="text"
                                            name="elec_otro_especif"
                                            value={formState.elec_otro_especif || ''}
                                            {...inputProps}
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
                                                {...radioProps}
                                            />
                                            SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input
                                                type="radio"
                                                name="elec_otro_reparable"
                                                value="NO"
                                                checked={formState.elec_otro_reparable === 'NO'}
                                                {...radioProps}
                                            />
                                            NO
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700">
                            <textarea name="elec_codigo" value={formState.elec_codigo || ''} {...inputProps} placeholder="Código" className={`${inputProps.className} w-full`} rows="2"></textarea>
                            <textarea name="elec_etapa" value={formState.elec_etapa || ''} {...inputProps} placeholder="Etapa" className={`${inputProps.className} w-full`} rows="2"></textarea>
                            <textarea name="elec_obs" value={formState.elec_obs || ''} {...inputProps} placeholder="Obs" className={`${inputProps.className} w-full`} rows="3"></textarea>
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
                                    <input type="text" name="testeo_procesador" value={formState.testeo_procesador || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} w-full`} />
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Video Dedicado:</label>
                                    <input type="text" name="testeo_video_dedicado" value={formState.testeo_video_dedicado || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} w-full`} />
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Memoria Ram:</label>
                                    <input type="text" name="testeo_memoria_ram" value={formState.testeo_memoria_ram || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} w-full`} />
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Disco:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_disco" value="SI" checked={formState.testeo_disco === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_disco" value="NO" checked={formState.testeo_disco === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_disco_obs" value={formState.testeo_disco_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Pantalla:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_pantalla" value="SI" checked={formState.testeo_pantalla === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_pantalla" value="NO" checked={formState.testeo_pantalla === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_pantalla_obs" value={formState.testeo_pantalla_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Batería:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_bateria" value="SI" checked={formState.testeo_bateria === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_bateria" value="NO" checked={formState.testeo_bateria === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_bateria_obs" value={formState.testeo_bateria_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Cargador:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_cargador" value="SI" checked={formState.testeo_cargador === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_cargador" value="NO" checked={formState.testeo_cargador === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_cargador_obs" value={formState.testeo_cargador_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Cámara:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_camara" value="SI" checked={formState.testeo_camara === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_camara" value="NO" checked={formState.testeo_camara === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_camara_obs" value={formState.testeo_camara_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>

                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Micrófono:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_microfono" value="SI" checked={formState.testeo_microfono === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_microfono" value="NO" checked={formState.testeo_microfono === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_microfono_obs" value={formState.testeo_microfono_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Auricular:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_auricular" value="SI" checked={formState.testeo_auricular === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_auricular" value="NO" checked={formState.testeo_auricular === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_auricular_obs" value={formState.testeo_auricular_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Parlantes:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_parlantes" value="SI" checked={formState.testeo_parlantes === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_parlantes" value="NO" checked={formState.testeo_parlantes === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_parlantes_obs" value={formState.testeo_parlantes_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Teclado:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_teclado" value="SI" checked={formState.testeo_teclado === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_teclado" value="NO" checked={formState.testeo_teclado === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_teclado_obs" value={formState.testeo_teclado_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Lectora:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_lectora" value="SI" checked={formState.testeo_lectora === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_lectora" value="NO" checked={formState.testeo_lectora === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_lectora_obs" value={formState.testeo_lectora_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Touchpad:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_touchpad" value="SI" checked={formState.testeo_touchpad === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_touchpad" value="NO" checked={formState.testeo_touchpad === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_touchpad_obs" value={formState.testeo_touchpad_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Wifi:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_wifi" value="SI" checked={formState.testeo_wifi === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_wifi" value="NO" checked={formState.testeo_wifi === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_wifi_obs" value={formState.testeo_wifi_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">RJ45:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_rj45" value="SI" checked={formState.testeo_rj45 === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_rj45" value="NO" checked={formState.testeo_rj45 === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_rj45_obs" value={formState.testeo_rj45_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">USB:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_usb" value="SI" checked={formState.testeo_usb === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_usb" value="NO" checked={formState.testeo_usb === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_usb_obs" value={formState.testeo_usb_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Tipo C:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_tipo_c" value="SI" checked={formState.testeo_tipo_c === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_tipo_c" value="NO" checked={formState.testeo_tipo_c === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_tipo_c_obs" value={formState.testeo_tipo_c_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">HDMI:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_hdmi" value="SI" checked={formState.testeo_hdmi === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_hdmi" value="NO" checked={formState.testeo_hdmi === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_hdmi_obs" value={formState.testeo_hdmi_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">VGA:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_vga" value="SI" checked={formState.testeo_vga === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_vga" value="NO" checked={formState.testeo_vga === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_vga_obs" value={formState.testeo_vga_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Otros:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_otros" value="SI" checked={formState.testeo_otros === 'SI'} {...radioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" name="testeo_otros" value="NO" checked={formState.testeo_otros === 'NO'} {...radioProps} />NO
                                        </label>
                                        <input type="text" name="testeo_otros_obs" value={formState.testeo_otros_obs || ''} {...inputProps} placeholder="Obs." className={`${inputProps.className} flex-1`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="border-t pt-4 dark:border-gray-700">
                            <h3 className="font-bold text-lg mb-3">SERVICIO REALIZADO FINAL</h3>
                            <textarea name="testeo_servicio_final" value={formState.testeo_servicio_final || ''} {...inputProps} placeholder="Descripción del servicio realizado" className={`${inputProps.className} w-full`} rows="4"></textarea>
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
            {isActualTech && canEditAdditionalServices &&(
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

                    <div className="mt-8 flex justify-end">
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
        </div>
    );
}

export default DetalleDiagnostico;