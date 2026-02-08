import { useState, useEffect, useMemo, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import { FaPlus, FaSave, FaPrint, FaPen, FaUserPlus, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  createDiagnosticReport,
  getNextReportNumber,
  getAllClientsForSelection,
  getClientById,
  getDiagnosticReportById,
  updateDiagnosticReport,
} from "../services/diagnosticService";
import { createClient } from "../services/clientService";
import { getAllUsersDetailed } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import Modal from '../components/common/Modal';
import logo from '../assets/images/compudoctor-logo.png';

const MANDATORY_COMPONENT_IDS = [
  "procesador", "placaMadre", "memoriaRam", "tarjetaVideo",
  "hdd", "ssd", "m2Nvme",
  "wifi", "bateria", "cargador",
  "pantalla", "teclado", "camara",
  "microfono", "parlantes"
];

const OTHER_EQUIPMENT_OPTIONS = [
  { value: "", label: "Selecciona el componente principal" },
  { value: "TARJETA_VIDEO", label: "Tarjeta de Video" },
  { value: "PLACA_MADRE_LAPTOP", label: "Placa Madre Laptop" },
  { value: "PLACA_MADRE_PC", label: "Placa Madre PC" },
  { value: "OTRO_DESCRIPCION", label: "Otro (Especificar)" },
];

const SERVICE_OPTIONS = [
  "Revisión",
  "Reparación",

  "Mantenimiento De Hardware Con Reconstrucción",
  "Mantenimiento De Hardware Con Cambio De Teclado",

  "Mantenimiento De Hardware",
  "Reconstrucción",
  "Adaptación De Parlantes",
  "Cambio De Teclado",
  "Cambio De Pantalla",
  "Cambio De Carcasa",
  "Cambio De Placa",
  "Cambio De Fuente",
  "Cambio De Tarjeta De Video",
  "SSD",
  "NVME",
  "M2 SATA",
  "HDD",
  "Memoria RAM",
  "Formateo",
  "Activación De Windows",
  "Activación De Office",
  "Backup De Información",
  "Optimización De Sistema",
  "Instalación De Programas De Diseño",
  "Instalación De Programas De Ingeniería",
  "Clonación De Disco",
  "Instalación De Driver",

  "Limpieza De Cabezal Manual De Impresora",
  "Limpieza De Cabezal Software De Impresora",
  "Reseteo De Impresora",
  "Garantía",
  "Otros"
];

const ALLOWED_SERVICES_FOR_OPTIONAL_TECH = [
  "Activación De Windows",
  "Activación De Office",
  "Backup De Información",
  "Optimización De Sistema",
  "Instalación De Programas De Diseño",
  "Instalación De Programas De Ingeniería",
  "Clonación De Disco",
  "Instalación De Driver"
];

const MAX_SERVICES = 6;

const SI_NO_DEJA_CONFIG = {
  Laptop: ['wifi', 'bateria', 'cargador', 'auriculares', 'rj45', 'hdmi', 'vga', 'usb', 'tipoC', 'lectora', 'touchpad', 'placaMadre', 'tarjetaVideo'],
  PC: ['wifi', 'rj45', 'hdmi', 'vga', 'usb', 'lectora', 'auriculares'],
  'All in one': ['rj45', 'usb', 'auriculares', 'hdmi', 'vga', 'placaMadre', 'tarjetaVideo'],
  Impresora: ['bandejas', 'rodillos', 'tinta', 'cables', 'cabezal']
};

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

function NewClientForm({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    tipoPersona: 'NATURAL',
    nombre: '',
    apellido: '',
    telefono: '',
    correo: '',
    ruc: '',
    razonSocial: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [];
    if (formData.tipoPersona === 'NATURAL') {
      requiredFields.push({ field: 'nombre', name: 'Nombre' }, { field: 'apellido', name: 'Apellido' }, { field: 'telefono', name: 'Teléfono' });
    } else if (formData.tipoPersona === 'JURIDICA') {
      requiredFields.push(
        { field: 'ruc', name: 'RUC' },
        { field: 'razonSocial', name: 'Razón Social' },
        { field: 'nombre', name: 'Nombre de Contacto' },
        { field: 'apellido', name: 'Apellido de Contacto' },
        { field: 'telefono', name: 'Teléfono de Contacto' }
      );
    } else {
      toast.error("El tipo de persona es obligatorio.");
      return;
    }

    for (const { field, name } of requiredFields) {
      if (!formData[field] || String(formData[field]).trim() === '') {
        toast.error(`El campo "${name}" es obligatorio.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      // Error handled by parent
    }
    setIsSaving(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold p-4 border-b dark:border-gray-600">Agregar Nuevo Cliente</h2>
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Persona <span className="text-red-500">*</span></label>
          <select
            name="tipoPersona"
            value={formData.tipoPersona}
            onChange={handleChange}
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            required
          >
            <option value="NATURAL">Persona Natural</option>
            <option value="JURIDICA">Persona Jurídica (Empresa)</option>
          </select>
        </div>

        {formData.tipoPersona === 'JURIDICA' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">RUC <span className="text-red-500">*</span></label>
              <input type="text" name="ruc" value={formData.ruc} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Razón Social <span className="text-red-500">*</span></label>
              <input type="text" name="razonSocial" value={formData.razonSocial} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mt-4 border-t pt-4">Datos de Contacto</h3>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{formData.tipoPersona === 'NATURAL' ? 'Nombre' : 'Nombre de Contacto'} <span className="text-red-500">*</span></label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{formData.tipoPersona === 'NATURAL' ? 'Apellido' : 'Apellido de Contacto'} <span className="text-red-500">*</span></label>
            <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{formData.tipoPersona === 'NATURAL' ? 'Teléfono' : 'Teléfono de Contacto'} <span className="text-red-500">*</span></label>
            <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Correo (Opcional)</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-2 bg-gray-100 dark:bg-gray-900 p-4 border-t dark:border-gray-600">
        <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg" disabled={isSaving}>Cancelar</button>
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-blue-300" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

function Diagnostico() {
  const { diagnosticoId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { currentUser } = useAuth();
  const { theme } = useContext(ThemeContext);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [errors, setErrors] = useState({});
  const [additionalServices, setAdditionalServices] = useState([]);
  const [newService, setNewService] = useState({ description: "", amount: 0 });
  const [showAdditionalServices, setShowAdditionalServices] = useState(false);
  const [reportNumber, setReportNumber] = useState("");
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [otherComponentType, setOtherComponentType] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const [servicesList, setServicesList] = useState([]);
  const [newServiceSelection, setNewServiceSelection] = useState({ service: "", amount: 0, specification: "" });
  const [otherServiceText, setOtherServiceText] = useState("");
  const [initialAreaAssignedStatus, setInitialAreaAssignedStatus] = useState(false);
  const [formData, setFormData] = useState({
    tipoEquipo: "",
    marca: "",
    modelo: "",
    serie: "",
    items: [],
    sistemaOperativo: "",
    bitlockerKey: false,
    observaciones: "",
    motivoIngreso: "",
    detallesPago: "",
    diagnostico: 0,
    montoServicio: 0,
    total: 0,
    aCuenta: 0,
    saldo: 0,
    tecnicoRecepcion: currentUser?.nombre || "",
    tecnicoRecepcionId: currentUser?.uid || "",
    tecnicoInicial: "",
    tecnicoInicialId: "",
    tecnicoTesteo: "",
    tecnicoTesteoId: "",
    tecnicoResponsable: "",
    tecnicoResponsableId: "",
    area: "",
    fecha: "",
    hora: "",
    estado: "",
    canTurnOn: "",
    ubicacionFisica: "",
    initialTotal: null,
    initialSaldo: null,
    initialACuenta: null,
    initialServicesList: [],
    initialDiagnostico: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const [currentDateState, setCurrentDateState] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateState(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentFormatted = useMemo(() => {
    const d = currentDateState;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return {
      day, month, year, time: `${hours}:${minutes}`,
      fullDateDash: `${day}-${month}-${year}`,
      fullDateSlash: `${day}/${month}/${year}`
    };
  }, [currentDateState]);

  const isEditMode = !!diagnosticoId;
  const isAdminOrSuperadmin = currentUser && (currentUser.rol === 'ADMIN' || currentUser.rol === 'SUPERADMIN');
  const isReportFinalized = isEditMode && ['ENTREGADO', 'TERMINADO'].includes(formData.estado);
  const isRegularUserLocked = (isReportFinalized || initialAreaAssignedStatus);
  const isFormLocked = isAdminOrSuperadmin ? false : isRegularUserLocked;

  const hasRepairService = servicesList.some(s => s.service === 'Reparación');


  const ALL_COMPONENTS = useMemo(() => {
    return PRINT_ORDER_MAP.map(item => ({ id: item.id, name: item.label }));
  }, []);

  const getComponentOptions = (type) => {
    const all = ALL_COMPONENTS;
    const printerExclusive = ['rodillos', 'cabezal', 'tinta', 'bandejas'];

    switch (type) {
      case 'PC':
        return all.filter(c =>
          !['bateria', 'cargador', 'pantalla', 'teclado', 'camara', 'microfono', 'parlantes', 'tipoC', 'touchpad', 'cables', ...printerExclusive].includes(c.id)
        );
      case 'Laptop':
        return all.filter(c =>
          !['cables', ...printerExclusive].includes(c.id)
        );
      case 'All in one':
        return all.filter(c =>
          !['lectora', 'cables', 'bateria', 'cargador', 'teclado', 'tipoC', 'touchpad', ...printerExclusive].includes(c.id)
        );
      case 'Impresora':
        return all.filter(c => ['cables', 'otros', ...printerExclusive].includes(c.id));
      case 'Otros':
        return all.filter(c => !printerExclusive.includes(c.id) && c.id !== 'cables');
      default:
        return [];
    }
  };

  const COMPONENT_OPTIONS = {
    PC: getComponentOptions('PC'),
    Laptop: getComponentOptions('Laptop'),
    "All in one": getComponentOptions('All in one'),
    Impresora: getComponentOptions('Impresora'),
    Otros: getComponentOptions('Otros'),
  };

  const OS_OPTIONS = [
    "Windows 11", "Windows 10", "Windows 8", "Windows 7", "macOS", "Linux", "Otro",
  ];
  const areaOptions = useMemo(() => {
    let options = ["SOFTWARE", "HARDWARE", "ELECTRONICA"];

    // Regla: En el area IMPRESORA debe mostrarse solo si el equipo es una impresora
    if (formData.tipoEquipo === 'Impresora') {
      options.push("IMPRESORA");
    }

    if (isAdminOrSuperadmin) {
      options.push("TESTEO");
    }
    return options;
  }, [formData.tipoEquipo, isAdminOrSuperadmin]);

  const handlePrint = () => {
    if (isEditMode && !formData.reportNumber) {
      toast.error("El informe debe estar cargado para imprimir.");
      return;
    }

    if (!isEditMode && !validateForm()) {
      toast.error("Completa los campos obligatorios marcados en rojo.");
      return;
    }

    const clientDisplay = selectedClient?.data?.tipoPersona === 'JURIDICA'
      ? selectedClient.data.razonSocial
      : `${selectedClient.data.nombre} ${selectedClient.data.apellido}`;
    const clientPhone = selectedClient?.data?.telefono || "N/A";

    let dia, mes, anio, hora;
    const dateSource = formData.fecha ? formData.fecha : currentFormatted.fullDateDash;
    [dia, mes, anio] = dateSource.split("-");
    hora = formData.hora || currentFormatted.time;

    const getCheckItemData = (id) => {
      const item = formData.items.find(i => i.id === id);
      const isChecked = item?.checked || false;
      let detailText = (item?.detalles && item.detalles.trim() !== '') ? item.detalles : '';
      return { isChecked, detailText };
    }

    const getObservaciones = () => {
      let obs = formData.observaciones || "";
      const notes = [];
      if (formData.sistemaOperativo) notes.push(`S.O: ${formData.sistemaOperativo}`);
      if (formData.bitlockerKey) notes.push("Bitlocker: SI");

      if (notes.length > 0) {
        obs += " | " + notes.join(". ");
      }
      return obs;
    };

    const printServicesList = (formData.initialServicesList && formData.initialServicesList.length > 0) ? formData.initialServicesList : servicesList;
    const printDiagnostico = (formData.initialDiagnostico !== undefined && formData.initialDiagnostico !== null && formData.initialDiagnostico !== 0) ? formData.initialDiagnostico : formData.diagnostico;
    const printTotal = (formData.initialTotal !== undefined && formData.initialTotal !== null) ? formData.initialTotal : formData.total;
    const printACuenta = (formData.initialACuenta !== undefined && formData.initialACuenta !== null) ? formData.initialACuenta : formData.aCuenta;
    const printSaldo = (formData.initialSaldo !== undefined && formData.initialSaldo !== null) ? formData.initialSaldo : formData.saldo;

    const servicesPart = printServicesList.map(s => {
      const amountVal = parseFloat(s.amount);
      const specDisplay = s.specification ? ` [${s.specification}]` : '';
      return `${s.service}${specDisplay} (S/${amountVal})`;
    }).join(', ');

    const diagPart = printDiagnostico > 0 ? `Diagnóstico (S/${printDiagnostico})` : '';

    const addPart = additionalServices.length > 0 ? additionalServices.map(s => s.description).join(', ') : '';

    const parts = [servicesPart, diagPart, addPart].filter(p => p && p.trim() !== '');
    const motivoText = parts.join(', ');

    const otherTypeDesc = otherComponentType === 'OTRO_DESCRIPCION' ? otherDescription : (OTHER_EQUIPMENT_OPTIONS.find(o => o.value === otherComponentType)?.label || '');

    const printContent = `
      <html>
        <head>
            <title>Informe Técnico ${reportNumber}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap');
                @page { size: portrait; }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                body { font-family: 'Roboto', sans-serif; margin: 0; padding: 20px; color: #000; box-sizing: border-box; font-size: 10pt; }
                .container { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid white; }
                
                .magenta { color: #ec008c; }
                .bg-magenta { background-color: #ec008c; color: white; }
                .border-magenta { border: 1px solid #ec008c; }
                .border-black { border: 1px solid #000; }

                .header { display: flex; justify-content: space-between; margin-bottom: 5px; align-items: flex-start; }
                .logo-section { width: 55%; }
                .logo-img { max-width: 250px; display: block; margin-bottom: 5px; }
                .company-info { font-size: 8pt; line-height: 1.3; font-weight: bold; }
                .company-info i { color: #ec008c; margin-right: 4px; font-style: normal; }

                .report-box { width: 40%; border: 2px solid #ec008c; border-radius: 8px; overflow: hidden; }
                .report-title { background-color: #ec008c; color: white; text-align: center; font-weight: 900; padding: 4px; font-size: 12pt; letter-spacing: 1px; }
                .date-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; border-bottom: 1px solid #ec008c; }
                .date-header { background-color: #ec008c; color: white; font-size: 8pt; padding: 2px; font-weight: bold; border-right: 1px solid white; }
                .date-cell { padding: 5px; font-weight: bold; font-size: 11pt; border-right: 1px solid #ec008c; }
                .time-row { display: flex; border-top: 1px solid #ec008c; }
                .time-label { background-color: #ec008c; color: white; padding: 2px 8px; font-size: 9pt; font-weight: bold; display: flex; align-items: center; }
                .time-value { padding: 4px 10px; font-weight: bold; font-size: 11pt; flex-grow: 1; text-align: center; }

                .client-row { display: flex; margin-bottom: 5px; gap: 10px; }
                .input-group { display: flex; align-items: center; border: 1px solid #000; padding: 3px 5px; border-radius: 5px; height: 24px; }
                .input-label { font-weight: 800; margin-right: 5px; font-size: 9pt; }
                .input-value { flex-grow: 1; font-weight: normal; font-size: 10pt; white-space: nowrap; overflow: hidden; }

                .section-header { background-color: #ec008c; color: white; text-align: center; font-weight: 800; padding: 4px; font-size: 10pt; border-radius: 6px 6px 0 0; margin-top: 5px; }
                .desc-box { border: 1px solid #ec008c; border-radius: 0 0 6px 6px; padding: 5px; }
                
                .equip-types { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 700; font-size: 9pt; flex-wrap: wrap; }
                .checkbox-box { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; vertical-align: middle; margin-left: 4px; text-align: center; line-height: 12px; font-size: 12px; }
                
                .equip-details { display: flex; gap: 10px; margin-top: 6px; }
                .line-input { display: flex; align-items: flex-end; flex-grow: 1; }
                .line-label { font-weight: 800; font-size: 9pt; margin-right: 5px; }
                .line-value { flex-grow: 1; border-bottom: 1px solid #000; font-size: 9pt; padding-left: 5px; }
                .other-detail { font-weight: normal; font-size: 9pt; border-bottom: 1px solid #000; min-width: 100px; padding-left: 4px; margin-left: 4px; }

                .checklist-container { column-count: 3; column-gap: 15px; padding: 5px 0; border: 1px solid #ec008c; margin-top: -1px; padding: 8px; }
                .component-item { display: flex; align-items: flex-end; margin-bottom: 2px; width: 100%; break-inside: avoid; }
                .comp-label { width: 120px; flex-shrink: 0; font-weight: bold; font-size: 9pt; margin-right: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .comp-checkbox-container { width: 16px; margin-right: 5px; padding-bottom: 1px; display: flex; justify-content: center; }
                .comp-checkbox { width: 14px; height: 14px; border: 1px solid #000; text-align: center; line-height: 13px; font-size: 11px; flex-shrink: 0; }
                .comp-line { flex-grow: 1; border-bottom: 1px solid #000; min-height: 14px; font-size: 8pt; padding-left: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                .text-area-container { margin-top: 8px; }
                .text-area-label { font-weight: 800; font-size: 9pt; margin-bottom: 4px; }
                .text-block { width: 100%; border: 1px solid #000; padding: 6px; font-size: 8pt; min-height: 10px; border-radius: 4px; }

                .financials { display: flex; justify-content: space-between; margin: 10px 0; padding: 0 20px; }
                .money-box { display: flex; align-items: center; border: 1px solid #000; padding: 4px 8px; border-radius: 6px; width: 28%; }
                .money-label { font-weight: 800; margin-right: 10px; font-size: 10pt; }
                .money-value { font-weight: normal; flex-grow: 1; text-align: right; }

                .warning-box { background-color: #ec008c; color: white; text-align: center; font-size: 8pt; font-weight: 700; padding: 6px; border-radius: 4px; margin-bottom: 8px; line-height: 1.2; }

                .clauses { font-size: 7pt; text-align: justify; line-height: 1.1; color: #e11d48; }
                .clause-title { background-color: #ec008c; color: white; padding: 1px 4px; font-weight: bold; font-size: 7pt; margin-right: 3px; }

                .checked::after { content: "X"; font-weight: bold; font-size: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo-section">
                        <img src="${logo}" class="logo-img" alt="COMPUDOCTOR" />
                        <div class="company-info">
                            <div><i>&#9830;</i> Jr. Camaná 1190 - 2do piso - Ofi 203, Cercado de Lima</div>
                            <div style="display:flex; gap: 15px;">
                                <span><i>&#9990;</i> 998 371 086 / 960 350 483</span>
                                <span><i>&#9742;</i> 014242142</span>
                            </div>
                            <div><i>&#9993;</i> compudoctor_@hotmail.com &nbsp;&nbsp; <i>&#127760;</i> www.compudoctor.pe</div>
                        </div>
                    </div>
                    <div class="report-box">
                        <div class="report-title">INFORME TÉCNICO <span style="float:right; font-size:10pt; margin-top:2px">N° ${reportNumber}</span></div>
                        <div class="date-grid">
                            <div style="border-right:1px solid white"><div class="date-header">DIA</div><div class="date-cell" style="border-right:1px solid #ec008c">${dia}</div></div>
                            <div style="border-right:1px solid white"><div class="date-header">MES</div><div class="date-cell" style="border-right:1px solid #ec008c">${mes}</div></div>
                            <div><div class="date-header" style="border-right:none">AÑO</div><div class="date-cell" style="border-right:none">${anio}</div></div>
                        </div>
                        <div class="time-row">
                            <div class="time-label">HORA</div>
                            <div class="time-value">${hora}</div>
                        </div>
                    </div>
                </div>

                <div class="client-row">
                    <div class="input-group" style="width: 70%">
                        <span class="input-label">Sres.</span>
                        <span class="input-value">${clientDisplay.substring(0, 55)}</span>
                    </div>
                    <div class="input-group" style="width: 30%">
                        <span class="input-label">Cel.</span>
                        <span class="input-value">${clientPhone}</span>
                    </div>
                </div>

                <div class="section-header">DESCRIPCIÓN DEL EQUIPO</div>
                <div class="desc-box">
                    <div class="equip-types">
                        <span>PC <div class="checkbox-box ${formData.tipoEquipo === 'PC' ? 'checked' : ''}"></div></span>
                        <span>Laptop <div class="checkbox-box ${formData.tipoEquipo === 'Laptop' ? 'checked' : ''}"></div></span>
                        <span>All in one <div class="checkbox-box ${formData.tipoEquipo === 'All in one' ? 'checked' : ''}"></div></span>
                        <span>Impresora <div class="checkbox-box ${formData.tipoEquipo === 'Impresora' ? 'checked' : ''}"></div></span>
                        <span>Otros <div class="checkbox-box ${formData.tipoEquipo === 'Otros' ? 'checked' : ''}"></div>
                            <span class="other-detail">${formData.tipoEquipo === 'Otros' ? otherTypeDesc : ''}</span>
                        </span>
                    </div>
                    <div class="equip-details">
                         <div class="line-input">
                            <span class="line-label">MARCA:</span>
                            <span class="line-value">${formData.marca || ''}</span>
                        </div>
                        <div class="line-input">
                            <span class="line-label">MODELO:</span>
                            <span class="line-value">${formData.modelo || ''}</span>
                        </div>
                        <div class="line-input">
                            <span class="line-label">SERIE:</span>
                            <span class="line-value">${formData.serie || ''}</span>
                        </div>
                         <div class="line-input" style="flex-grow: 0; min-width: 100px;">
                            <span class="line-label">¿Enciende?:</span>
                            <span class="line-value">${formData.canTurnOn || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div class="checklist-container">
                    ${PRINT_ORDER_MAP.map((item) => {
      const { isChecked, detailText } = getCheckItemData(item.id);
      return `
                        <div class="component-item">
                            <span class="comp-label">${item.num}. ${item.label}</span>
                            <div class="comp-checkbox-container">
                                <div class="comp-checkbox ${isChecked ? 'checked' : ''}"></div>
                            </div>
                            <div class="comp-line">${detailText}</div>
                        </div>
                    `}).join('')}
                </div>

                <div class="text-area-container">
                    <div class="text-area-label">OBSERVACIONES:</div>
                    <div class="text-block">
                        ${getObservaciones()}
                    </div>
                </div>

                <div class="text-area-container">
                    <div class="text-area-label">MOTIVO POR EL QUE INGRESA:</div>
                    <div class="text-block">
                        ${motivoText}
                    </div>
                </div>

                <div class="financials">
                    <div class="money-box">
                        <span class="money-label">TOTAL</span>
                        <span class="money-value">${(parseFloat(printTotal) || 0).toFixed(2)}</span>
                    </div>
                    <div class="money-box">
                        <span class="money-label">A CUENTA</span>
                        <span class="money-value">${(parseFloat(printACuenta) || 0).toFixed(2)}</span>
                    </div>
                    <div class="money-box">
                        <span class="money-label">SALDO</span>
                        <span class="money-value">${(parseFloat(printSaldo) || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div class="warning-box">
                    LA EMPRESA NO SE RESPONSABILIZA POR PÉRDIDA O DETERIORO DEL PRODUCTO INTERNADO PASADO LOS 60 DÍAS. LA ENTREGA DE SU EQUIPO SÓLO SERÁ POSIBLE PRESENTANDO ESTE DOCUMENTO.
                </div>

                <div class="clauses">
                    <p><span class="clause-title">CLAUSULA N° 01</span> Se dará <b>PRIORIDAD</b> al servicio según el motivo por el cual ingresa el equipo, especialmente si es por una reparación de placa. Si se encuentra algún <b>OTRO PROBLEMA</b> durante el proceso, se informará como observación. En caso de que el cliente solicite la revisión o solución de este problema adicional, se considerará como un servicio aparte, lo que implicará un costo adicional.</p>
                    <p style="margin-top:3px"><span class="clause-title">CLAUSULA N° 02</span> La garantía cubrirá únicamente el servicio realizado. Si, después de algunos días, se presenta <b>OTRO PROBLEMA</b>, no se aplicaría dicho garantía al equipo.</p>
                    <p style="margin-top:3px"><span class="clause-title">CLAUSULA N° 03</span> Todo <b>SERVICIO</b> que no incluya un producto <b>NO INCLUYE EL IGV (18%)</b>, en caso de que el cliente solicite un comprobante electrónico. Los pagos con tarjeta de <b>CRÉDITO o DÉBITO</b> tendrán un recargo adicional del 5%.</p>
                </div>
                
                <div style="margin-top: 35px; text-align: center;">
                  <div style="border-top: 1px solid #000; width: 230px; margin: 4px auto 0;"></div>
                  <div>FIRMA CLIENTE</div>
                </div>

                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 8pt;">
                   <div style="font-weight: bold; text-decoration: underline; margin-bottom: 6px;">PERSONAL ASIGNADO:</div>
                   <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                      <div><strong>Técnico de Recepción:</strong> ${formData.tecnicoRecepcion || ''}</div>
                      <div><strong>Técnico Inicial:</strong> ${formData.tecnicoInicial || ''}</div>
                      <div><strong>Técnico de Testeo:</strong> ${formData.tecnicoTesteo || ''}</div>
                      <div><strong>Técnico Responsable:</strong> ${formData.tecnicoResponsable || ''}</div>
                   </div>
                </div>
            </div>
        </body>
      </html>
    `;

    const newWindow = window.open("", "", "width=900,height=1100");
    newWindow.document.write(printContent);
    newWindow.document.close();
    newWindow.focus();

    setTimeout(() => {
      newWindow.print();
    }, 500);
  };

  const getOtherComponentAvailabilityInternal = (itemId, otherType, canTurnOn, isFormLocked) => {
    const isCheckOptional = canTurnOn === 'SI';
    let isAvailable = false;
    let isCheckDisabled = true;
    let isDetailRequired = false;
    let isDetailDisabled = isFormLocked;

    switch (otherType) {
      case 'TARJETA_VIDEO':
        if (itemId === 'otros' || itemId === 'tarjetaVideo') {
          isAvailable = true;
          isCheckDisabled = !isCheckOptional;
          isDetailRequired = isCheckOptional;
        } else {
          isAvailable = false;
          isCheckDisabled = true;
        }
        break;
      case 'PLACA_MADRE_LAPTOP':
      case 'PLACA_MADRE_PC':
        if (['procesador', 'placaMadre', 'tarjetaVideo', 'memoriaRam', 'otros', 'hdd', 'ssd', 'm2Nvme', 'auriculares', 'usb'].includes(itemId)) {
          isAvailable = true;
          isCheckDisabled = !isCheckOptional;
          isDetailRequired = isCheckOptional;
        } else {
          isAvailable = false;
          isCheckDisabled = true;
        }
        break;
      case 'OTRO_DESCRIPCION':
        if (itemId === 'otros') {
          isAvailable = true;
          isCheckDisabled = true;
          isDetailRequired = false;
        } else {
          isAvailable = false;
          isCheckDisabled = true;
        }
        break;
      default:
        if (itemId === 'otros') {
          isAvailable = true;
          isCheckDisabled = true;
          isDetailRequired = false;
        }
        break;
    }

    return { isAvailable, isCheckDisabled, isDetailRequired, isDetailDisabled };
  };

  const getComponentStatus = (itemId) => {
    const tipoEquipo = formData.tipoEquipo;
    const canTurnOn = formData.canTurnOn;
    const isSiPrende = canTurnOn === 'SI';
    const isNoPrende = canTurnOn === 'NO';
    const isAIO = tipoEquipo === 'All in one';
    const isPrinter = tipoEquipo === 'Impresora';
    const isPC = tipoEquipo === 'PC';
    const isLaptop = tipoEquipo === 'Laptop';

    // Check if Other -> Placa...
    const isOtherPlaca = tipoEquipo === 'Otros' && ['PLACA_MADRE_LAPTOP', 'PLACA_MADRE_PC'].includes(otherComponentType);

    let isAvailable = true;
    let isCheckDisabled = isFormLocked;
    let isDetailDisabled = isFormLocked;

    let isDetailRequired = false;
    let isCheckRequired = false;
    let isSelectorMode = false; // "SI DEJA" / "NO DEJA" dropdown
    let selectorType = 'DEJA';
    let siNoDejaItems = [...(SI_NO_DEJA_CONFIG[tipoEquipo] || [])];

    if (isAIO && !siNoDejaItems.includes('wifi')) {
      siNoDejaItems.push('wifi');
    }
    if ((isPC || isLaptop || isAIO) && isSiPrende) {
      siNoDejaItems = siNoDejaItems.filter(i => i !== 'tarjetaVideo');
    }
    if ((isPC || isLaptop || isAIO) && isNoPrende) {
      if (!siNoDejaItems.includes('tarjetaVideo')) siNoDejaItems.push('tarjetaVideo');
    }

    // 3. Otros (Placa Madre): Tarjeta Video is Selector
    if (isOtherPlaca && itemId === 'tarjetaVideo') {
      isSelectorMode = true;
    }

    // 4. Default Selector Check
    if (siNoDejaItems.includes(itemId)) {
      isSelectorMode = true;
      isDetailRequired = true; // Rule: "Ademas debe ser obligatorio el detalle en todos los campos donde se marca SI DEJA/NO DEJA"
    }

    if (isNoPrende && ['pantalla', 'teclado', 'camara', 'microfono', 'parlantes'].includes(itemId)) {
      isSelectorMode = true;
    }
    let mandatoryDetailSiPrende = ['procesador', 'placaMadre', 'memoriaRam', 'tarjetaVideo'];
    if (isLaptop) {
      mandatoryDetailSiPrende = [...mandatoryDetailSiPrende, 'camara', 'microfono', 'parlantes', 'teclado'];
    } else {
      mandatoryDetailSiPrende.push('auriculares');
    }
    const mandatoryCheckSiPrende = ['procesador', 'placaMadre', 'memoriaRam', 'camara', 'microfono', 'parlantes', 'tarjetaVideo', 'teclado', 'pantalla'];


    // Logic for "NO PRENDE"
    const mandatoryDetailNoPrendeLaptop = ['pantalla', 'teclado', 'camara', 'microfono', 'parlantes', 'procesador', 'placaMadre', 'memoriaRam', 'hdd', 'ssd', 'm2Nvme', 'tarjetaVideo', 'wifi', 'cargador'];
    const mandatoryCheckNoPrendeLaptop = ['procesador', 'placaMadre'];
    const mandatoryDetailNoPrendePC = ['procesador', 'placaMadre', 'memoriaRam', 'hdd', 'ssd', 'm2Nvme', 'tarjetaVideo'];
    const mandatoryCheckNoPrendePC = ['procesador', 'placaMadre', 'memoriaRam'];

    // Logic for "All in one" & "NO PRENDE" (Same as PC checks + specifics if needed)
    const mandatoryCheckNoPrendeAIO = ['procesador', 'placaMadre', 'memoriaRam'];

    // Lógica Impresora
    const mandatoryPrinterIds = ['rodillos', 'cabezal', 'tinta', 'bandejas'];

    // Lógica Discos
    const diskIds = ['hdd', 'ssd', 'm2Nvme'];

    if (isPrinter) {
      if (mandatoryPrinterIds.includes(itemId)) isDetailRequired = true;
    }

    if (isPC || isLaptop || isAIO) {
      if (isAIO && MANDATORY_COMPONENT_IDS.includes(itemId)) isDetailRequired = true;

      if (isSiPrende) {
        if (mandatoryDetailSiPrende.includes(itemId) || diskIds.includes(itemId)) isDetailRequired = true;

        if (mandatoryCheckSiPrende.filter(id => id !== 'tarjetaVideo').includes(itemId)) {
          isCheckRequired = true;
          isCheckDisabled = isFormLocked;
        }
      }

      if (isNoPrende) {
        if (isLaptop && mandatoryDetailNoPrendeLaptop.includes(itemId)) isDetailRequired = true;
        if (isPC) {
          if (mandatoryDetailNoPrendePC.includes(itemId)) isDetailRequired = true;
          if (mandatoryCheckNoPrendePC.includes(itemId)) isCheckRequired = true;
        }
        if (isAIO) {
          // "EN ALL IN ONE NO PRENDE, AGREGAR EL CHECK OBLIGATORIO EN LA CASILLA DEL PROCESADOR"
          if (mandatoryCheckNoPrendeAIO.includes(itemId)) isCheckRequired = true;
          if (MANDATORY_COMPONENT_IDS.includes(itemId) || mandatoryDetailNoPrendePC.includes(itemId)) isDetailRequired = true;
        }
      }
    }

    if (tipoEquipo === 'Otros') {
      const otherStatus = getOtherComponentAvailabilityInternal(itemId, otherComponentType, canTurnOn, isFormLocked);
      isAvailable = otherStatus.isAvailable;
      isCheckDisabled = otherStatus.isCheckDisabled;
      isDetailDisabled = otherStatus.isDetailDisabled;

      // New Rule: Otros / Placa Madre
      if (isOtherPlaca) {
        // En NO PRENDE (OTROS / PLACA), memoriaRam NO es obligatorio marcar check
        const mandatoryCheckOtherPlaca = isNoPrende ? ['procesador'] : ['procesador', 'memoriaRam'];

        if (mandatoryCheckOtherPlaca.includes(itemId)) {
          isCheckDisabled = isFormLocked;
          isDetailRequired = true;
        }

        // Configuración específica de selectores para OTROS - PLACA
        if (['memoriaRam', 'hdd', 'ssd', 'm2Nvme'].includes(itemId)) {
          isSelectorMode = true;
          isDetailRequired = true;
        }
        if (['auriculares', 'usb'].includes(itemId)) {
          isSelectorMode = true;
          selectorType = 'TIENE';
          isDetailRequired = true;
        }
      }
    } else if (isLaptop && isNoPrende) {
      if (mandatoryCheckNoPrendeLaptop.includes(itemId)) {
        isCheckRequired = true;
      }
    }

    return {
      isAvailable,
      isCheckDisabled,
      isDetailDisabled,
      isDetailRequired,
      isCheckRequired,
      isSelectorMode,
      selectorType
    };
  };

  useEffect(() => {
    const query = new URLSearchParams(search);
    const clientIdFromUrl = query.get('clientId');

    const fetchData = async () => {
      try {
        const allClients = await getAllClientsForSelection();
        setClients(allClients);

        const allUsersData = await getAllUsersDetailed();
        const filteredTechnicians = allUsersData
          .filter(u => ['USER', 'SUPERUSER'].includes(u.rol))
          .map((u) => ({ value: u.id, label: u.nombre }));

        setUsers(filteredTechnicians);

        if (diagnosticoId) {
          const report = await getDiagnosticReportById(diagnosticoId);
          if (report) {
            const client = await getClientById(report.clientId);

            const clientDisplay = client.tipoPersona === 'JURIDICA'
              ? `${client.razonSocial} (RUC: ${client.ruc})`
              : `${client.nombre} ${client.apellido}`;

            setSelectedClient({
              value: client.id,
              label: clientDisplay,
              data: client,
            });
            setReportNumber(report.reportNumber.toString().padStart(6, "0"));

            const tecnicoInicialOption = filteredTechnicians.find(u => u.value === report.tecnicoInicialId);
            const tecnicoTesteoOption = filteredTechnicians.find(u => u.value === report.tecnicoTesteoId);
            const tecnicoResponsableOption = filteredTechnicians.find(u => u.value === report.tecnicoResponsableId);

            if (report.tipoEquipo === 'Otros') {
              setOtherComponentType(report.otherComponentType || "");
              setOtherDescription(report.otherDescription || "");
            }

            let diagnosisCost = parseFloat(report.diagnostico) || 0;

            if (report.servicesList && Array.isArray(report.servicesList)) {
              const loadedServices = report.servicesList.map(s => {
                const amount = parseFloat(s.amount) || 0;
                return { ...s, amount: amount };
              });
              setServicesList(loadedServices);
            } else {
              setServicesList([]);
            }

            if (report.additionalServices) {
              setAdditionalServices(report.additionalServices.map(s => ({ ...s, amount: parseFloat(s.amount) })));
              setShowAdditionalServices(report.hasAdditionalServices || report.additionalServices.length > 0);
            }

            const isReportLockedOnLoad = ['ENTREGADO', 'TERMINADO'].includes(report.estado) || (!!report.area && report.area !== 'N/A');
            setInitialAreaAssignedStatus(isReportLockedOnLoad);

            setFormData({
              ...report,
              tipoEquipo: report.tipoEquipo === 'All in one' ? 'All in one' : report.tipoEquipo,
              diagnostico: diagnosisCost,
              montoServicio: parseFloat(report.montoServicio) || 0,
              total: parseFloat(report.total) || 0,
              aCuenta: parseFloat(report.aCuenta) || 0,
              saldo: parseFloat(report.saldo) || 0,
              canTurnOn: report.canTurnOn || "",
              bitlockerKey: report.bitlockerKey || false,
              detallesPago: report.detallesPago || "",
              observaciones: report.observaciones || "",
              ubicacionFisica: report.ubicacionFisica || "",

              tecnicoRecepcion: report.tecnicoRecepcion || currentUser?.nombre,
              tecnicoRecepcionId: report.tecnicoRecepcionId || currentUser?.uid,

              tecnicoInicial: tecnicoInicialOption?.label || report.tecnicoInicial || "",
              tecnicoInicialId: tecnicoInicialOption?.value || report.tecnicoInicialId || "",

              tecnicoTesteo: tecnicoTesteoOption?.label || report.tecnicoTesteo || "",
              tecnicoTesteoId: tecnicoTesteoOption?.value || report.tecnicoTesteoId || "",
              tecnicoResponsable: tecnicoResponsableOption?.label || report.tecnicoResponsable || "",
              tecnicoResponsableId: tecnicoResponsableOption?.value || report.tecnicoResponsableId || "",
            });

          } else {
            toast.error("Informe no encontrado.");
          }
        } else {
          const nextReportNumber = await getNextReportNumber();
          setReportNumber(nextReportNumber.toString().padStart(6, "0"));
          setInitialAreaAssignedStatus(false);

          // NEW REPORT TIME INIT
          const now = new Date();
          const day = now.getDate().toString().padStart(2, '0');
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const year = now.getFullYear();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');

          setFormData(prev => ({
            ...prev,
            fecha: `${day}-${month}-${year}`,
            hora: `${hours}:${minutes}`
          }));

          if (clientIdFromUrl) {
            const client = await getClientById(clientIdFromUrl);
            if (client) {
              const clientDisplay = client.tipoPersona === 'JURIDICA'
                ? `${client.razonSocial} (RUC: ${client.ruc})`
                : `${client.nombre} ${client.apellido}`;
              setSelectedClient({
                value: client.id,
                label: clientDisplay,
                data: client,
              });
            }
          }
        }
      } catch (error) {
        toast.error("Error al cargar datos.");

      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [diagnosticoId, search, currentUser?.uid, currentUser?.nombre]);

  useEffect(() => {
    let diagnosisCost = 0;
    let serviceTotal = 0;
    let diagnosisServiceFound = false;

    servicesList.forEach(item => {
      const amount = item.amount || 0;

      if (item.service === 'Reparación') {
        serviceTotal += amount;
        diagnosisCost = formData.diagnostico;
        diagnosisServiceFound = true;
      } else if (item.service) {
        serviceTotal += amount;
      }
    });

    if (!diagnosisServiceFound) {
      diagnosisCost = 0;
    }

    const totalAdicionales = additionalServices.reduce(
      (sum, service) => sum + (service.amount || 0),
      0
    );

    const newMontoServicio = serviceTotal;
    const newTotal = serviceTotal + totalAdicionales;

    setFormData((prev) => ({
      ...prev,
      diagnostico: diagnosisCost,
      montoServicio: newMontoServicio,
      total: newTotal,
      saldo: newTotal - (parseFloat(prev.aCuenta) || 0),
    }));
  }, [
    additionalServices,
    servicesList,
    formData.aCuenta,
    formData.diagnostico
  ]);

  const handleAddServiceItem = () => {
    const lastService = servicesList[servicesList.length - 1];

    if (servicesList.length >= MAX_SERVICES) {
      toast.error(`Solo se permiten un máximo de ${MAX_SERVICES} servicios.`);
      return;
    }

    if (servicesList.some(s => s.service === 'Reparación')) {
      toast.error("No se pueden añadir más servicios después de Reparación.");
      return;
    }

    if (lastService && (!lastService.service || (lastService.service !== 'Revisión' && lastService.service !== 'Reparación' && (!lastService.amount || parseFloat(lastService.amount) <= 0)))) {
      toast.error("Por favor, completa el servicio y el monto actual antes de añadir otro.");
      return;
    }

    setServicesList((prev) => [
      ...prev,
      { id: Date.now(), service: '', amount: 0, description: '' }
    ]);
  };

  const handleRemoveServiceItem = (id) => {
    if (isFormLocked) return;
    setServicesList((prev) => {
      const updatedList = prev.filter(item => item.id !== id);
      return updatedList.length > 0 ? updatedList : [];
    });

    if (!servicesList.some(s => s.service === 'Reparación')) {
      setFormData(prev => ({ ...prev, diagnostico: 0 }));
    }
  };

  const handleDiagnosisChange = (e) => {
    if (isFormLocked) return;
    const { value } = e.target;
    const numericValue = parseFloat(value) || 0;
    if (hasRepairService) {
      setFormData(prev => ({ ...prev, diagnostico: numericValue }));
    }
  };

  const handleAddClient = async (clientData) => {
    try {
      await createClient(clientData);
      toast.success('Cliente agregado con éxito.');

      const updatedClients = await getAllClientsForSelection();
      setClients(updatedClients);

      const newClient = updatedClients.find(c =>
        c.telefono === clientData.telefono &&
        c.tipoPersona === clientData.tipoPersona &&
        (c.tipoPersona === 'JURIDICA' ? c.ruc === clientData.ruc && c.razonSocial === clientData.razonSocial : c.nombre === clientData.nombre && c.apellido === clientData.apellido)
      );

      if (newClient) {
        setSelectedClient({ value: newClient.id, label: newClient.display, data: newClient });
      }

      setIsNewClientModalOpen(false);
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const handleInputChange = (e) => {
    if (isFormLocked) return;
    const { name, value, type, checked } = e.target;

    if (name === "bitlockerKey" && type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    if (name === 'canTurnOn') {
      const newState = { [name]: value };
      if (value === 'NO') {
        newState.sistemaOperativo = '';
        newState.bitlockerKey = false;
        newState.tecnicoTesteo = '';
        newState.tecnicoTesteoId = '';
        newState.tecnicoResponsable = '';
        newState.tecnicoResponsableId = '';
        if (!['Laptop', 'PC', 'All in one'].includes(formData.tipoEquipo)) {
          newState.tecnicoInicial = '';
          newState.tecnicoInicialId = '';
        }
        newState.area = '';

        // Previous logic clearing items removed to preserve state


        toast('Campos de Testeo (checks), Software, Técnico Testeo/Responsable y Área de Destino se han deshabilitado.');
      }
      setFormData((prev) => ({
        ...prev,
        ...newState,
      }));
      return;
    }

    if (name === 'otherComponentType') {
      setOtherComponentType(value);
      if (value === 'OTRO_DESCRIPCION') {
        setOtherDescription('');
      } else {
        setOtherDescription(OTHER_EQUIPMENT_OPTIONS.find(o => o.value === value)?.label || '');
      }

      setFormData(prev => {
        const newItems = prev.items.map(item => {
          if (value === 'TARJETA_VIDEO' && item.id === 'tarjetaVideo') {
            return { ...item, checked: true };
          }
          if ((value === 'PLACA_MADRE_LAPTOP' || value === 'PLACA_MADRE_PC') && item.id === 'placaMadre') {
            return { ...item, checked: true };
          }
          return item;
        });
        return { ...prev, items: newItems };
      });
      return;
    }

    if (name === 'otherDescription') {
      setOtherDescription(value);
      return;
    }

    if (name === 'diagnostico') {
      let numericValue = parseFloat(value) || 0;
      if (hasRepairService) {
        setFormData(prev => ({ ...prev, diagnostico: numericValue }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentFocus = (e) => {
    if (isFormLocked) return;
    e.target.value = '';
  };

  const handlePaymentChange = (e) => {
    if (isFormLocked) return;
    let { name, value } = e.target;

    let numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0) numericValue = 0;

    setFormData((prev) => ({
      ...prev,
      [name]: numericValue,
    }));
  };

  const handleWheel = (e) => {
    e.preventDefault();
  };

  const handleClientChange = (selectedOption) => {
    if (isFormLocked) return;

    setSelectedClient(selectedOption);
    if (isEditMode) {
      toast.error("No se puede cambiar el cliente en modo de edición.");
    }
  };

  const handleUserChange = (name, selectedOption) => {
    if (isFormLocked) return;
    const nameKey = name;
    const idKey = `${name}Id`;

    setFormData((prev) => ({
      ...prev,
      [nameKey]: selectedOption ? selectedOption.label : "",
      [idKey]: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleEquipoChange = (e) => {
    if (isFormLocked) return;
    const { value } = e.target;
    const newItems = getComponentOptions(value)?.map((item) => ({
      id: item.id,
      checked: false,
      detalles: "",
    })) || [];

    setOtherComponentType("");
    setOtherDescription("");

    setFormData((prev) => ({
      ...prev,
      tipoEquipo: value,
      items: newItems,
      sistemaOperativo: "",
      bitlockerKey: false,
      modelo: value === 'Otros' ? '' : prev.modelo,
      area: value === 'Impresora' ? 'IMPRESORA' : '', // Auto-assign IMPRESORA or reset
    }));
  };

  const handleItemCheck = (e) => {
    if (isFormLocked) return;
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === name ? { ...item, checked } : item
      ),
    }));
  };

  const handleItemDetailsChange = (e) => {
    if (isFormLocked) return;
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === name) {
          const updates = { detalles: value };
          if (value === "SI DEJA" || value === "SI TIENE") {
            updates.checked = true;
          } else if (value === "NO DEJA" || value === "NO TIENE") {
            updates.checked = false;
          }
          return { ...item, ...updates };
        }
        return item;
      }),
    }));
  };

  const handleAddAdditionalService = (e) => {
    e.preventDefault();
    if (isFormLocked) return;
    const amount = parseFloat(newService.amount);

    if (!newService.description || !amount || amount <= 0) {
      toast.error("Debe ingresar la descripción y un monto mayor a 0 antes de agregar un servicio adicional.");
      return;
    }

    setAdditionalServices((prev) => [
      ...prev,
      { ...newService, amount: amount, id: Date.now() },
    ]);
    setNewService({ description: "", amount: 0 });
  };

  const handleDeleteAdditionalService = (id) => {
    if (isFormLocked) return;
    setAdditionalServices((prev) =>
      prev.filter((service) => service.id !== id)
    );
  };


  const validateForm = () => {
    const newErrors = {};

    const requiredGeneralFields = [
      { field: "tipoEquipo", message: "El Tipo de Equipo es obligatorio." },
      { field: "marca", message: "La Marca es obligatoria." },
      { field: "observaciones", message: "Las Observaciones son obligatorias." },
      { field: "canTurnOn", message: "La opción '¿Enciende?' es obligatoria." },
    ];

    if (!selectedClient) {
      newErrors.client = "Seleccionar un cliente es obligatorio.";
    }

    requiredGeneralFields.forEach(({ field, message }) => {
      if (!String(formData[field])) {
        if (field === 'modelo') {
          if (formData.tipoEquipo === 'Otros') {
            if (['TARJETA_VIDEO', 'PLACA_MADRE_PC'].includes(otherComponentType)) {
              newErrors[field] = message;
            }
            return;
          }
        }
        newErrors[field] = message;
      }
    });

    if (servicesList.length === 0) {
      newErrors.servicesList = "Debe añadir al menos un servicio (Motivo de Ingreso).";
    } else {
      servicesList.forEach((item, index) => {
        if (!item.service) {
          newErrors[`service-${index}`] = "Debe seleccionar un servicio.";
        }
        if (item.service !== 'Reparación' && item.service !== 'Garantía' && (!item.amount || parseFloat(item.amount) <= 0)) {
          newErrors[`amount-${index}`] = "El monto es obligatorio y debe ser mayor a 0.";
        }
        if (item.service === 'Otros' && !item.description) {
          newErrors[`description-${index}`] = "Debe especificar la descripción del servicio 'Otros'.";
        }
        if (item.service === 'Reparación' && (!item.amount || parseFloat(item.amount) <= 0)) {
          newErrors[`amount-${index}`] = "El monto de la reparación es obligatorio y debe ser mayor a 0.";
        }
      });
    }

    const isSerieRequired = !['All in one', 'PC', 'Otros'].includes(formData.tipoEquipo);

    if (isSerieRequired && !formData.serie) {
      newErrors.serie = "La Serie es obligatoria.";
    }

    const currentComponentOptions = COMPONENT_OPTIONS[formData.tipoEquipo] || [];
    currentComponentOptions.forEach(opt => {
      // Filtrar solo los disponibles para "Otros" según la lógica interna
      if (formData.tipoEquipo === 'Otros') {
        const status = getOtherComponentAvailabilityInternal(opt.id, otherComponentType, formData.canTurnOn, false);
        if (!status.isAvailable) return;
      }

      const status = getComponentStatus(opt.id);
      const itemData = formData.items.find(i => i.id === opt.id);
      const isChecked = itemData?.checked;
      const hasDetails = itemData?.detalles && itemData.detalles.trim().length > 0;

      if (status.isCheckRequired && !isChecked) {
        newErrors[opt.id + '_check'] = "Check obligatorio.";
      }

      if (status.isDetailRequired && !hasDetails) {
        newErrors[opt.id] = "Detalle obligatorio.";
      }
    });

    if (formData.tipoEquipo === 'Otros') {
      if (!otherComponentType) {
        newErrors.otherComponentType = "Debe seleccionar el tipo de componente principal.";
      }
      if (otherComponentType === 'OTRO_DESCRIPCION' && !otherDescription) {
        newErrors.otherDescription = "Debe especificar la descripción.";
      }
    }

    const hasSoftwareOrOtherService = servicesList.some(s => s.service === 'Mantenimiento de Software' || s.isOther === true);

    const areAllServicesAllowed = servicesList.length > 0 && servicesList.every(s => ALLOWED_SERVICES_FOR_OPTIONAL_TECH.includes(s.service));
    const isOptionalByServiceList = ['Laptop', 'PC'].includes(formData.tipoEquipo) && areAllServicesAllowed;

    const isTecnicoInicialRequired = !hasSoftwareOrOtherService && !isOptionalByServiceList && (
      (formData.canTurnOn === 'SI' && !['Impresora', 'Otros', 'All in one'].includes(formData.tipoEquipo)) ||
      (formData.canTurnOn === 'NO' && ['Laptop', 'PC', 'All in one'].includes(formData.tipoEquipo))
    );

    if (isTecnicoInicialRequired && !formData.tecnicoInicialId) {
      newErrors.tecnicoInicialId = "El Técnico Inicial es obligatorio.";
    }

    if (formData.canTurnOn === 'SI') {

      const isOtherAndOtherDesc = formData.tipoEquipo === 'Otros' && otherComponentType === 'OTRO_DESCRIPCION';

      if (!isOtherAndOtherDesc && !formData.tecnicoTesteoId) {
        newErrors.tecnicoTesteoId = "El Técnico de Testeo es obligatorio.";
      }

      const isOSRequired = ['PC', 'Laptop'].includes(formData.tipoEquipo);
      if (isOSRequired && !formData.sistemaOperativo) {
        newErrors.sistemaOperativo = "El Sistema Operativo es obligatorio.";
      }
    }

    const hasWarrantyService = servicesList.some(s => s.service === 'Garantía');

    if (formData.montoServicio <= 0 && !hasRepairService && !hasWarrantyService) {
      newErrors.montoServicio = "Monto inválido.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isFormLocked || isSaving) {
      toast.error("Procesando registro. Por favor, espera.");
      return;
    }

    if (!validateForm()) {
      toast.error("Completa los campos obligatorios marcados en rojo.");
      return;
    }

    setIsSaving(true);

    const finalResponsible = formData.tecnicoResponsable;
    const finalResponsibleId = formData.tecnicoResponsableId;

    let clientReportName = '';
    const clientData = selectedClient.data;
    if (clientData.tipoPersona === 'JURIDICA') {
      clientReportName = clientData.razonSocial;
    } else {
      clientReportName = `${clientData.nombre} ${clientData.apellido}`;
    }

    const motivoIngresoText = servicesList.map(s => {
      const amountDisplay = `(S/ ${s.amount.toFixed(2)})`;
      const specDisplay = s.specification ? ` [${s.specification}]` : '';
      return `${s.service.charAt(0).toUpperCase() + s.service.slice(1)}${specDisplay} ${amountDisplay}`;
    }).join(', ');

    try {
      let finalStatus = formData.estado || "PENDIENTE";
      if (!['ENTREGADO', 'TERMINADO'].includes(finalStatus)) {
        finalStatus = (finalResponsible && formData.area) ? "ASIGNADO" : "PENDIENTE";
      }

      const baseData = {
        ...formData,
        tecnicoResponsable: finalResponsible,
        tecnicoResponsableId: finalResponsibleId,
        clientId: selectedClient.value,
        clientName: clientReportName,
        telefono: clientData.telefono,
        ruc: clientData.ruc || "",

        diagnostico: parseFloat(formData.diagnostico) || 0,
        montoServicio: parseFloat(formData.montoServicio) || 0,
        total: parseFloat(formData.total) || 0,
        aCuenta: parseFloat(formData.aCuenta) || 0,
        saldo: parseFloat(formData.saldo) || 0,
        estado: finalStatus,

        pagosRealizado: [{ fecha: new Date().toISOString(), monto: parseFloat(formData.aCuenta) || 0, formaPago: formData.detallesPago }],

        servicesList: servicesList.map(s => ({ ...s, amount: s.amount.toFixed(2) })),
        motivoIngreso: motivoIngresoText,
        additionalServices: additionalServices.map(s => ({ ...s, amount: s.amount.toFixed(2) })),
        hasAdditionalServices: additionalServices.length > 0,
        canTurnOn: formData.canTurnOn,
        ubicacionFisica: formData.ubicacionFisica,
      };
      const shouldUpdateInitial = !isReportFinalized && !initialAreaAssignedStatus;

      if (shouldUpdateInitial) {
        baseData.initialTotal = parseFloat(formData.total) || 0;
        baseData.initialSaldo = parseFloat(formData.saldo) || 0;
        baseData.initialACuenta = parseFloat(formData.aCuenta) || 0;
        baseData.initialDiagnostico = parseFloat(formData.diagnostico) || 0;
        baseData.initialServicesList = servicesList.map(s => ({ ...s, amount: s.amount.toFixed(2) }));
      } else {
        baseData.initialTotal = formData.initialTotal !== undefined ? formData.initialTotal : (parseFloat(formData.total) || 0);
        baseData.initialSaldo = formData.initialSaldo !== undefined ? formData.initialSaldo : (parseFloat(formData.saldo) || 0);
        baseData.initialACuenta = formData.initialACuenta !== undefined ? formData.initialACuenta : (parseFloat(formData.aCuenta) || 0);
        baseData.initialDiagnostico = formData.initialDiagnostico !== undefined ? formData.initialDiagnostico : (parseFloat(formData.diagnostico) || 0);

        baseData.initialServicesList = (formData.initialServicesList && formData.initialServicesList.length > 0)
          ? formData.initialServicesList
          : servicesList.map(s => ({ ...s, amount: s.amount.toFixed(2) }));
      }

      if (formData.tipoEquipo === 'Otros') {
        baseData.otherComponentType = otherComponentType;
        baseData.otherDescription = otherDescription;
      }

      if (isEditMode) {
        if (isAdminOrSuperadmin && baseData.area && baseData.area !== 'N/A') {
          const now = new Date();
          const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
          const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          baseData.tecnicoActual = baseData.tecnicoResponsable;
          baseData.tecnicoActualId = baseData.tecnicoResponsableId;
          baseData.diagnosticoPorArea = {
            ...(baseData.diagnosticoPorArea || {}),
            [baseData.area]: [{
              reparacion: '',
              tecnico: baseData.tecnicoResponsable,
              tecnicoId: baseData.tecnicoResponsableId,
              ubicacionFisica: '',
              fecha_inicio: formattedDate,
              hora_inicio: formattedTime,
              fecha_fin: '',
              hora_fin: '',
              estado: 'ASIGNADO',
            }],
          }
        }

        await updateDiagnosticReport(diagnosticoId, baseData);
        toast.success(`Informe #${reportNumber} actualizado con éxito.`);
      } else {
        baseData.tecnicoActual = finalResponsible;
        baseData.tecnicoActualId = finalResponsibleId;

        await createDiagnosticReport({
          ...baseData,
          reportNumber: parseInt(reportNumber),
          fecha: formData.fecha,
          hora: formData.hora,
        });
        toast.success(`Informe #${reportNumber} creado con éxito.`);
        handlePrint();
      }

      navigate("/ver-estado");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };
  const displayDate = formData.fecha ? formData.fecha.replace(/-/g, '/') : currentFormatted.fullDateSlash;
  const displayTime = formData.hora || currentFormatted.time;

  const hasSoftwareOrOtherService = servicesList.some(s => s.service === 'Mantenimiento de Software' || s.service === 'Otros' || (s.isOther === true));

  const areAllServicesAllowed = servicesList.length > 0 && servicesList.every(s => ALLOWED_SERVICES_FOR_OPTIONAL_TECH.includes(s.service));
  const isOptionalByServiceList = ['Laptop', 'PC'].includes(formData.tipoEquipo) && areAllServicesAllowed;

  const isTecnicoInicialRequired = !hasSoftwareOrOtherService && !isOptionalByServiceList && (
    (formData.canTurnOn === 'SI' && !['Impresora', 'Otros', 'All in one'].includes(formData.tipoEquipo)) ||
    (formData.canTurnOn === 'NO' && ['Laptop', 'PC', 'All in one'].includes(formData.tipoEquipo))
  );

  if (isLoading) return <div className="text-center p-8">Cargando informe...</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">
        Recepción y Diagnóstico de Equipos
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <span className="font-bold text-xl text-blue-500">
              Informe Técnico N° {reportNumber}
            </span>
            <button
              type="button"
              onClick={handlePrint}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:bg-green-400"
              disabled={isSaving}
            >
              <FaPrint className="mr-2" /> Imprimir
            </button>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="font-medium">
              <span className="text-gray-900 dark:text-white">
                Fecha de Atención:
              </span>{" "}
              {displayDate}
            </div>
            <div className="font-medium">
              <span className="text-gray-900 dark:text-white">Hora:</span>{" "}
              {displayTime}
            </div>
            <div className="font-medium flex items-center gap-2">
              <span className="text-gray-900 dark:text-white">Casilla:</span>
              <select
                name="ubicacionFisica"
                value={formData.ubicacionFisica}
                onChange={handleInputChange}
                className="p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
                disabled={isFormLocked}
              >
                <option value="">Seleccionar</option>
                {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={`I${num}`}>
                    I{num}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {isFormLocked && (
            <p className="text-red-500 font-bold mt-4">
              El informe ya tiene un área asignada ({formData.area} - Estado: {formData.estado}) y no puede ser modificado.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-500">
            Datos del Cliente
          </h2>
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Seleccionar Cliente <span className="text-red-500">*</span>
              </label>
              <Select
                options={clients.map((c) => ({
                  value: c.id,
                  label: c.display,
                  data: c,
                }))}
                value={selectedClient}
                onChange={handleClientChange}
                placeholder="Buscar o seleccionar cliente..."
                isClearable
                isDisabled={isFormLocked || isEditMode}
                className={`${errors.client ? "ring-2 ring-red-500" : ""}`}
                styles={{
                  control: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: theme === "dark" ? "#374151" : "#fff",
                    borderColor:
                      theme === "dark" ? "#4B5563" : baseStyles.borderColor,
                  }),
                  singleValue: (baseStyles) => ({
                    ...baseStyles,
                    color: theme === "dark" ? "#D1D5DB" : "#000",
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: theme === "dark" ? "#374151" : "#fff",
                  }),
                  option: (baseStyles, state) => ({
                    ...baseStyles,
                    backgroundColor: state.isFocused
                      ? theme === "dark"
                        ? "#4B5563"
                        : "#e5e7eb"
                      : "transparent",
                    color: theme === "dark" ? "#fff" : "#000",
                  }),
                  placeholder: (baseStyles) => ({
                    ...baseStyles,
                    color: theme === "dark" ? "#9CA3AF" : "#9CA3AF",
                  }),
                  input: (baseStyles) => ({
                    ...baseStyles,
                    color: theme === "dark" ? "#D1D5DB" : "#000",
                  })
                }}
              />
              {errors.client && (
                <p className="text-red-500 text-sm mt-1">{errors.client}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsNewClientModalOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center h-10 disabled:bg-green-400"
              disabled={isLoading || isFormLocked || isEditMode}
            >
              <FaUserPlus className="mr-2" /> Nuevo
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-purple-500">
            Descripción del Equipo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <div>
              <label className="block text-sm font-medium mb-1">
                ¿El equipo enciende? <span className="text-red-500">*</span>
              </label>
              <select
                name="canTurnOn"
                value={formData.canTurnOn}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.canTurnOn ? "ring-2 ring-red-500" : ""
                  }`}
                required
                disabled={isFormLocked}
              >
                <option value="">Selecciona una opción</option>
                <option value="SI">SI PRENDE</option>
                <option value="NO">NO PRENDE</option>
              </select>
              {errors.canTurnOn && (
                <p className="text-red-500 text-sm mt-1">{errors.canTurnOn}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo de Equipo <span className="text-red-500">*</span>
              </label>
              <select
                name="tipoEquipo"
                value={formData.tipoEquipo}
                onChange={handleEquipoChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.tipoEquipo ? "ring-2 ring-red-500" : ""
                  }`}
                required
                disabled={isFormLocked}
              >
                <option value="">Selecciona un tipo</option>
                {Object.keys(COMPONENT_OPTIONS).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.tipoEquipo && (
                <p className="text-red-500 text-sm mt-1">{errors.tipoEquipo}</p>
              )}
            </div>

            {formData.tipoEquipo === 'Otros' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Componente Principal <span className="text-red-500">*</span>
                </label>
                <select
                  name="otherComponentType"
                  value={otherComponentType}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.otherComponentType ? "ring-2 ring-red-500" : ""
                    }`}
                  required
                  disabled={isFormLocked}
                >
                  {OTHER_EQUIPMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.otherComponentType && (
                  <p className="text-red-500 text-sm mt-1">{errors.otherComponentType}</p>
                )}
              </div>
            )}

            {formData.tipoEquipo === 'Otros' && otherComponentType === 'OTRO_DESCRIPCION' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción Específica <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="otherDescription"
                  value={otherDescription}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.otherDescription ? "ring-2 ring-red-500" : ""
                    }`}
                  required
                  disabled={isFormLocked}
                />
                {errors.otherDescription && (
                  <p className="text-red-500 text-sm mt-1">{errors.otherDescription}</p>
                )}
              </div>
            )}


            <div>
              <label className="block text-sm font-medium mb-1">Marca <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.marca ? "ring-2 ring-red-500" : ""
                  }`}
                required
                disabled={isFormLocked}
              />
              {errors.marca && (
                <p className="text-red-500 text-sm mt-1">{errors.marca}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modelo
                {(formData.tipoEquipo !== 'Otros' || (formData.tipoEquipo === 'Otros' && ['TARJETA_VIDEO', 'PLACA_MADRE_PC'].includes(otherComponentType))) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.modelo ? "ring-2 ring-red-500" : ""
                  }`}
                required={formData.tipoEquipo !== 'Otros'}
                disabled={isFormLocked}
              />
              {errors.modelo && (
                <p className="text-red-500 text-sm mt-1">{errors.modelo}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Serie
                {!['All in one', 'PC', 'Otros'].includes(formData.tipoEquipo) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <input
                type="text"
                name="serie"
                value={formData.serie}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.serie ? "ring-2 ring-red-500" : ""
                  }`}
                required={!['All in one', 'PC', 'Otros'].includes(formData.tipoEquipo)}
                disabled={isFormLocked}
              />
              {errors.serie && (
                <p className="text-red-500 text-sm mt-1">{errors.serie}</p>
              )}
            </div>
          </div>
        </div>

        {formData.tipoEquipo && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-green-500">
              Componentes y Accesorios
            </h2>
            <div className="flex gap-6 mb-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <span className="text-blue-500 text-lg leading-none mr-1 font-bold">*</span>
                <span>Check Obligatorio</span>
              </div>
              <div className="flex items-center">
                <span className="text-red-500 text-lg leading-none mr-1 font-bold">*</span>
                <span>Detalle Obligatorio</span>
              </div>
            </div>
            {['Impresora'].includes(formData.tipoEquipo) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Para el tipo de equipo "{formData.tipoEquipo}", los campos de componentes son obligatorios (detalles) o para testeo (check).
              </p>
            )}
            <div className="columns-1 md:columns-2 gap-4">
              {COMPONENT_OPTIONS[formData.tipoEquipo]?.filter(item => {
                if (formData.tipoEquipo === 'Otros') {
                  return getComponentStatus(item.id).isAvailable;
                }
                return true;
              }).map((item, index) => {

                const { isAvailable, isCheckDisabled, isDetailDisabled, isCheckRequired, isDetailRequired, isSelectorMode, selectorType } = getComponentStatus(item.id);

                const showDetailError = errors[item.id];
                const showCheckError = errors[item.id + '_check'];
                const hasAnyError = showDetailError || showCheckError;

                return (
                  <div key={item.id} className="flex flex-col mb-2 break-inside-avoid">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name={item.id}
                        id={item.id}
                        checked={
                          formData.items.find((i) => i.id === item.id)?.checked ||
                          false
                        }
                        onChange={handleItemCheck}
                        className={`h-4 w-4 rounded ${showCheckError ? "ring-2 ring-red-500" : ""}`}
                        disabled={isCheckDisabled}
                      />
                      <label htmlFor={item.id} className="flex-1 text-sm flex items-center">
                        <span className="font-bold mr-1">{index + 1}.</span>
                        {item.name}
                        {isCheckRequired && <span className="ml-1 text-blue-500 text-lg leading-none">*</span>}
                        {isDetailRequired && <span className="ml-1 text-red-500 text-lg leading-none">*</span>}
                      </label>
                      {isSelectorMode ? (
                        <select
                          name={item.id}
                          value={formData.items.find((i) => i.id === item.id)?.detalles || ""}
                          onChange={handleItemDetailsChange}
                          className={`flex-1 p-1 text-xs border rounded-md dark:bg-gray-700 dark:border-gray-600 ${showDetailError ? "ring-2 ring-red-500" : ""}`}
                          disabled={isDetailDisabled}
                        >
                          <option value="">Seleccionar...</option>
                          {selectorType === 'TIENE' ? (
                            <>
                              <option value="SI TIENE">SI TIENE</option>
                              <option value="NO TIENE">NO TIENE</option>
                            </>
                          ) : (
                            <>
                              <option value="SI DEJA">SI DEJA</option>
                              <option value="NO DEJA">NO DEJA</option>
                            </>
                          )}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name={item.id}
                          value={formData.items.find((i) => i.id === item.id)?.detalles || ""}
                          onChange={handleItemDetailsChange}
                          className={`flex-1 p-1 text-xs border rounded-md dark:bg-gray-700 dark:border-gray-600 ${showDetailError ? "ring-2 ring-red-500" : ""
                            }`}
                          placeholder="Detalles"
                          disabled={isDetailDisabled}
                        />
                      )}
                    </div>
                    {hasAnyError && (
                      <div className="ml-6 mt-1">
                        {showDetailError && <span className="text-red-500 text-xs block font-semibold">{showDetailError}</span>}
                        {showCheckError && !showDetailError && <span className="text-red-500 text-xs block font-semibold">{showCheckError}</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {errors.disk_check && (
              <p className="text-red-500 text-sm mt-4 font-bold">{errors.disk_check}</p>
            )}
          </div>
        )}

        {(formData.tipoEquipo === "PC" ||
          formData.tipoEquipo === "Laptop" ||
          formData.tipoEquipo === "All in one") && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-orange-500">
                Software y Seguridad
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sistema Operativo {formData.canTurnOn === 'SI' && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    name="sistemaOperativo"
                    value={formData.sistemaOperativo}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.sistemaOperativo ? "ring-2 ring-red-500" : ""
                      }`}
                    required={formData.canTurnOn === 'SI' && ['PC', 'Laptop'].includes(formData.tipoEquipo)}
                    disabled={isFormLocked || formData.canTurnOn === 'NO'}
                  >
                    <option value="">Selecciona un SO</option>
                    {OS_OPTIONS.map((os) => (
                      <option key={os} value={os}>
                        {os}
                      </option>
                    ))}
                  </select>
                  {errors.sistemaOperativo && (
                    <p className="text-red-500 text-sm mt-1">{errors.sistemaOperativo}</p>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="bitlockerKey"
                    id="bitlockerKey"
                    checked={formData.bitlockerKey}
                    onChange={handleInputChange}
                    className="h-4 w-4 mr-2"
                    disabled={isFormLocked || formData.canTurnOn === 'NO'}
                  />
                  <label className="text-sm font-medium" htmlFor="bitlockerKey">Clave de Bitlocker</label>
                </div>
              </div>
            </div>
          )}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-yellow-500">
            Detalles del Servicio
          </h2>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Observaciones <span className="text-red-500">*</span>
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="3"
              className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.observaciones ? "ring-2 ring-red-500" : ""
                }`}
              required
              disabled={isFormLocked}
            ></textarea>
            {errors.observaciones && (
              <p className="text-red-500 text-sm mt-1">{errors.observaciones}</p>
            )}
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Servicios Solicitados <span className="text-red-500">*</span></h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end mb-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1">Servicio</label>
                <div className="flex items-center gap-1">
                  <select
                    name="service"
                    value={newServiceSelection.service}
                    onChange={(e) => setNewServiceSelection(prev => ({ ...prev, service: e.target.value }))}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    disabled={isFormLocked || (hasRepairService && servicesList.length >= 1)}
                  >
                    <option value="">Añadir servicio</option>
                    {SERVICE_OPTIONS.filter(s => s !== 'Reparación' || !hasRepairService).map((service) => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
              </div>



              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1">
                  {newServiceSelection.service === 'Otros' ? 'Especificación (Servicio)' : 'Especificación'}
                </label>
                <input
                  type="text"
                  value={newServiceSelection.specification || ''}
                  onChange={(e) => setNewServiceSelection(prev => ({ ...prev, specification: e.target.value }))}
                  placeholder={newServiceSelection.service === 'Otros' ? "Especifique el servicio..." : "Ej. Marca, Modelo, Capacidad..."}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  disabled={isFormLocked || !newServiceSelection.service}
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1">Monto (S/)</label>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  step="any"
                  onFocus={(e) => e.target.value = ''}
                  onWheel={handleWheel}
                  value={newServiceSelection.amount}
                  onChange={(e) => setNewServiceSelection(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                  placeholder="Costo"
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  disabled={isFormLocked || newServiceSelection.service === ''}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const amount = newServiceSelection.amount;

                  if (newServiceSelection.service && newServiceSelection.service !== 'Reparación' && newServiceSelection.service !== 'Garantía' && (!amount || amount <= 0)) {
                    toast.error("El monto debe ser mayor a 0 para este servicio.");
                    return;
                  }

                  let serviceDesc = newServiceSelection.service;
                  let finalSpec = newServiceSelection.specification;
                  let isOther = false;

                  if (newServiceSelection.service === 'Otros') {
                    if (!newServiceSelection.specification) {
                      toast.error("Debe especificar el nombre del servicio en 'Especificación (Servicio)'.");
                      return;
                    }
                    serviceDesc = newServiceSelection.specification; // The name of the service becomes what they typed
                    finalSpec = "";
                    isOther = true;
                  }

                  setServicesList(prev => {
                    if (servicesList.some(s => s.service === 'Reparación') && serviceDesc !== 'Reparación') return prev;
                    if (servicesList.length >= MAX_SERVICES) return prev;

                    const newEntry = {
                      id: Date.now(),
                      service: serviceDesc,
                      amount: amount,
                      specification: finalSpec || '',
                      isOther: isOther
                    };

                    if (serviceDesc === 'Reparación') {
                      setFormData(p => ({ ...p, diagnostico: 30 }));
                      return [newEntry];
                    } else {
                      return [...prev.filter(s => s.service !== 'Reparación'), newEntry];
                    }
                  });

                  setNewServiceSelection({ service: "", amount: 0, specification: "" });
                  setOtherServiceText("");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-blue-300 h-10"
                disabled={isFormLocked || (hasRepairService && servicesList.length >= 1) || servicesList.length >= MAX_SERVICES || !newServiceSelection.service}
              >
                <FaPlus />
              </button>
            </div>

            <ul className="space-y-2">
              {servicesList.map((s, index) => (
                <li key={s.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                  <span className="flex-1">
                    {index + 1}. {s.service}
                    {s.specification && <span className="text-gray-500 italic ml-1">[{s.specification}]</span>}
                    {s.service === 'Reparación' && <span className="ml-2 text-red-500">(Habilita Diagnóstico)</span>}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    Monto S/ {s.amount.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveServiceItem(s.id)}
                    className="ml-4 text-red-500 hover:text-red-700"
                    disabled={isFormLocked}
                  >
                    <FaTimes />
                  </button>
                </li>
              ))}
            </ul>
            {errors.servicesList && (
              <p className="text-red-500 text-sm mt-1">{errors.servicesList}</p>
            )}
          </div>

          {servicesList.some(s => s.service === 'Reparación') && (
            <div className="mt-4 p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
              <h3 className="text-lg font-semibold text-red-500 mb-2">Costo de Diagnóstico (Reparación)</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">Este monto NO suma al Monto de Servicios (Solo informativo para reparación).</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Costo Diagnóstico (S/)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    name="diagnostico"
                    value={formData.diagnostico}
                    onChange={handleDiagnosisChange}
                    onFocus={handlePaymentFocus}
                    onWheel={handleWheel}
                    className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.diagnostico ? "ring-2 ring-red-500" : ""}`}
                    required
                    disabled={isFormLocked}
                  />
                  {errors.diagnostico && (
                    <p className="text-red-500 text-xs mt-1">{errors.diagnostico}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>


        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-red-500">
            Información de Pago
          </h2>

          {/* Additional Services option removed as per request */}

          <div className="mb-4 mt-6">
            <label className="block text-sm font-medium mb-1">
              Detalles del Pago
            </label>
            <textarea
              name="detallesPago"
              value={formData.detallesPago}
              onChange={handleInputChange}
              rows="2"
              placeholder="Detalles del pago (ej. depósito en cuenta, efectivo, etc.)"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              disabled={isFormLocked}
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

            <div>
              <label className="block text-sm font-medium mb-1">
                Costo Diagnóstico (S/)
              </label>
              <input
                type="number"
                name="diagnostico"
                value={formData.diagnostico.toFixed(2)}
                readOnly
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed"
                disabled={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Monto Servicios (S/)
              </label>
              <input
                type="number"
                name="montoServicio"
                value={formData.montoServicio.toFixed(2)}
                readOnly
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed font-bold"
                disabled={isFormLocked}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Total (S/)
              </label>
              <input
                type="number"
                name="total"
                value={formData.total.toFixed(2)}
                readOnly
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed font-bold"
                disabled={isFormLocked}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                A Cuenta (S/) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                onFocus={handlePaymentFocus}
                onWheel={handleWheel}
                name="aCuenta"
                value={formData.aCuenta}
                onChange={handlePaymentChange}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                required
                disabled={isFormLocked}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Saldo (S/)
              </label>
              <input
                type="number"
                name="saldo"
                value={formData.saldo.toFixed(2)}
                readOnly
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed"
                disabled={isFormLocked}
              />
            </div>
          </div>
        </div >

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-indigo-500">
            Asignación de Personal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div>
              <label className="block text-sm font-medium mb-1">
                Técnico de Recepción
              </label>
              <input
                type="text"
                value={formData.tecnicoRecepcion}
                readOnly
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed"
                disabled={isFormLocked}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Técnico Inicial (Abrio el Equipo) {isTecnicoInicialRequired && <span className="text-red-500">*</span>}
              </label>
              <Select
                options={users}
                value={users.find((u) => u.value === formData.tecnicoInicialId)}
                onChange={(option) => handleUserChange("tecnicoInicial", option)}
                placeholder="Selecciona un técnico..."
                isClearable
                className={`${errors.tecnicoInicialId ? "ring-2 ring-red-500 rounded-lg" : ""}`}
                isDisabled={isFormLocked}
                styles={{
                  control: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: theme === "dark" ? "#374151" : "#fff",
                    borderColor: theme === "dark" ? "#4B5563" : baseStyles.borderColor,
                  }),
                  singleValue: (baseStyles) => ({
                    ...baseStyles,
                    color: theme === "dark" ? "#fff" : "#000",
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: theme === "dark" ? "#374151" : "#fff",
                  }),
                  option: (baseStyles, state) => ({
                    ...baseStyles,
                    backgroundColor: state.isFocused ? (theme === "dark" ? "#4B5563" : "#e5e7eb") : "transparent",
                    color: theme === "dark" ? "#fff" : "#000",
                  }),
                }}
              />
              {errors.tecnicoInicialId && (
                <p className="text-red-500 text-sm mt-1">{errors.tecnicoInicialId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Técnico de Testeo {(formData.canTurnOn === 'SI' && !(formData.tipoEquipo === 'Otros' && otherComponentType === 'OTRO_DESCRIPCION')) && <span className="text-red-500">*</span>}
              </label>
              <Select
                options={users}
                value={users.find((u) => u.value === formData.tecnicoTesteoId)}
                onChange={(option) => handleUserChange("tecnicoTesteo", option)}
                placeholder="Selecciona un técnico..."
                className={`${errors.tecnicoTesteoId ? "ring-2 ring-red-500 rounded-lg" : ""}`}
                isClearable
                isDisabled={isFormLocked}
                styles={{
                  control: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: theme === "dark" ? "#374151" : "#fff",
                    borderColor: theme === "dark" ? "#4B5563" : baseStyles.borderColor,
                  }),
                  singleValue: (baseStyles) => ({
                    ...baseStyles,
                    color: theme === "dark" ? "#fff" : "#000",
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: theme === "dark" ? "#374151" : "#fff",
                  }),
                  option: (baseStyles, state) => ({
                    ...baseStyles,
                    backgroundColor: state.isFocused ? (theme === "dark" ? "#4B5563" : "#e5e7eb") : "transparent",
                    color: theme === "dark" ? "#fff" : "#000",
                  }),
                }}
              />
              {errors.tecnicoTesteoId && (
                <p className="text-red-500 text-sm mt-1">{errors.tecnicoTesteoId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Técnico Responsable
              </label>
              <Select
                options={users}
                value={users.find(
                  (u) => u.value === formData.tecnicoResponsableId
                )}
                onChange={(option) =>
                  handleUserChange("tecnicoResponsable", option)
                }
                placeholder="Selecciona un técnico..."
                isClearable
                isDisabled={isFormLocked}
                styles={{
                  control: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: theme === "dark" ? "#374151" : "#fff",
                    borderColor:
                      theme === "dark" ? "#4B5563" : baseStyles.borderColor,
                  }),
                  singleValue: (baseStyles) => ({
                    ...baseStyles,
                    color: theme === "dark" ? "#fff" : "#000",
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: theme === "dark" ? "#374151" : "#fff",
                  }),
                  option: (baseStyles, state) => ({
                    ...baseStyles,
                    backgroundColor: state.isFocused
                      ? theme === "dark"
                        ? "#4B5563"
                        : "#e5e7eb"
                      : "transparent",
                    color: theme === "dark" ? "#fff" : "#000",
                  }),
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            <>
              <label className="block text-sm font-medium mb-1">
                Área de Destino
              </label>
              <select
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.area ? "ring-2 ring-red-500" : ""
                  }`}
                disabled={isFormLocked || formData.tipoEquipo === 'Impresora'}
              >
                <option value="">Selecciona un área</option>
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              {errors.area && (
                <p className="text-red-500 text-sm mt-1">{errors.area}</p>
              )}
            </>
          </div>
        </div>

        {
          !isFormLocked && (
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:bg-blue-400"
              disabled={isSaving}
            >
              {isSaving ? (
                'Guardando...'
              ) : isEditMode ? (
                <>
                  <FaPen className="mr-2" /> Actualizar Informe Técnico
                </>
              ) : (
                <>
                  <FaSave className="mr-2" /> Guardar Informe Técnico
                </>
              )}
            </button>
          )
        }
      </form >

      {isNewClientModalOpen && (
        <Modal onClose={() => setIsNewClientModalOpen(false)}>
          <NewClientForm
            onSave={handleAddClient}
            onCancel={() => setIsNewClientModalOpen(false)}
          />
        </Modal>
      )
      }
    </div >
  );
}

export default Diagnostico;