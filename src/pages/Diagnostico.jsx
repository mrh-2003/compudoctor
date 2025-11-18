import { useState, useEffect, useMemo, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import { FaPlus, FaSave, FaPrint, FaTrash, FaPen, FaCheckCircle, FaTimesCircle, FaCheck, FaUserPlus, FaTimes } from "react-icons/fa";
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
import jsPDF from "jspdf";
import "jspdf-autotable";
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
    "Mantenimiento de Software", 
    "Mantenimiento de Hardware", 
    "Reparación", 
    "Cambio de Teclado", 
    "Cambio de Pantalla", 
    "Cambio de Disco", 
    "Memoria RAM", 
    "Mantenimiento de Hardware con Reconstrucción", 
    "Mantenimiento de Hardware con Teclado", 
    "Solo Reconstrucción", 
    "Limpieza de Cabezal de Impresora", 
    "Cambio de Placa", 
    "Otros"
];

const MAX_SERVICES = 6;
const USER_TECHNICIAN_ROLES = ['USER', 'SUPERUSER'];


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
            
        }
        setIsSaving(false);
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold p-4 border-b dark:border-gray-600">Agregar Nuevo Cliente</h2>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                
                <div>
                    <label className="block text-sm font-medium mb-1">Tipo de Persona</label>
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
                            <label className="block text-sm font-medium mb-1">RUC</label>
                            <input type="text" name="ruc" value={formData.ruc} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Razón Social</label>
                            <input type="text" name="razonSocial" value={formData.razonSocial} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                        </div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mt-4 border-t pt-4">Datos de Contacto</h3>
                    </>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{formData.tipoPersona === 'NATURAL' ? 'Nombre' : 'Nombre de Contacto'}</label>
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{formData.tipoPersona === 'NATURAL' ? 'Apellido' : 'Apellido de Contacto'}</label>
                        <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{formData.tipoPersona === 'NATURAL' ? 'Teléfono' : 'Teléfono de Contacto'}</label>
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
  const [newServiceSelection, setNewServiceSelection] = useState({ service: "", amount: 0 }); 
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
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const isEditMode = !!diagnosticoId;
  const isReportFinalized = isEditMode && ['ENTREGADO', 'TERMINADO'].includes(formData.estado);
  const isFormLocked = isReportFinalized || initialAreaAssignedStatus; 
  
  const hasRepairService = servicesList.some(s => s.service === 'Reparación');
  
  const isAdminOrSuperadmin = currentUser && (currentUser.rol === 'ADMIN' || currentUser.rol === 'SUPERADMIN');
  const showAreaInput = isAdminOrSuperadmin;
  const isAreaRequired = !isEditMode && isAdminOrSuperadmin; 


  const getToday = useMemo(() => {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return {
      day,
      month,
      year,
      time: `${hours}:${minutes}`,
    };
  }, []);
  
  const ALL_COMPONENTS = useMemo(() => {
    const standardComponents = [
        { id: "procesador", name: "Procesador" }, { id: "placaMadre", name: "Placa Madre" },
        { id: "memoriaRam", name: "Memoria RAM" }, { id: "hdd", name: "HDD" }, { id: "ssd", name: "SSD" },
        { id: "m2Nvme", name: "M2 Nvme." }, { id: "tarjetaVideo", name: "Tarj. de video" }, { id: "wifi", name: "Wi-Fi" }, 
        { id: "bateria", name: "Batería" }, { id: "cargador", name: "Cargador" }, { id: "pantalla", name: "Pantalla" }, 
        { id: "teclado", name: "Teclado" }, { id: "camara", name: "Cámara" }, { id: "microfono", name: "Micrófono" }, 
        { id: "parlantes", name: "Parlantes" }, { id: "auriculares", name: "Auriculares" }, { id: "rj45", name: "RJ 45" }, 
        { id: "hdmi", name: "HDMI" }, { id: "vga", name: "VGA" }, { id: "usb", name: "USB" }, 
        { id: "tipoC", name: "Tipo C" }, { id: "lectora", name: "Lectora" }, { id: "touchpad", name: "Touchpad" },
        { id: "rodillos", name: "Rodillos" }, { id: "cabezal", name: "Cabezal" }, { id: "tinta", name: "Cartuchos/Tinta" }, 
        { id: "bandejas", name: "Bandejas" }, { id: "cables", name: "cables" } 
    ];
    return [...standardComponents.filter(c => c.id !== 'otros'), { id: "otros", name: "Otros" }];
  }, []);


  const getComponentDisplayName = (id) => {
    const component = ALL_COMPONENTS.find(c => c.id === id);
    return component ? component.name : id;
  };

  const getComponentOptions = (type) => {
    const all = ALL_COMPONENTS;
    const printerExclusive = ['rodillos', 'cabezal', 'tinta', 'bandejas'];
    
    switch (type) {
        case 'PC':
            return all.filter(c => 
                !['bateria', 'cargador', 'pantalla', 'teclado', 'camara', 'microfono', 'parlantes', 'auriculares', 'tipoC', 'touchpad', 'vga', 'lectora', 'cables', ...printerExclusive].includes(c.id) 
            ); 
        case 'Laptop':
            return all.filter(c => 
                !['lectora', 'cables', ...printerExclusive].includes(c.id)
            ); 
        case 'Allinone':
            return all.filter(c => 
                !['lectora', 'cables', ...printerExclusive].includes(c.id)
            );
        case 'Impresora':
            return all.filter(c => [...printerExclusive, 'cables', 'otros'].includes(c.id));
        case 'Otros':
            return all.filter(c => !printerExclusive.includes(c.id) && c.id !== 'cables');
        default:
            return [];
    }
  };

  const COMPONENT_OPTIONS = {
    PC: getComponentOptions('PC'),
    Laptop: getComponentOptions('Laptop'),
    Allinone: getComponentOptions('Allinone'),
    Impresora: getComponentOptions('Impresora'),
    Otros: getComponentOptions('Otros'),
  };

  const OS_OPTIONS = [
    "Windows 11", "Windows 10", "Windows 8", "Windows 7", "macOS", "Linux", "Otro",
  ];
  const AREA_OPTIONS = ["SOFTWARE", "HARDWARE", "ELECTRONICA"];
  
  const generateComponentHtml = (item) => {
    const componentName = getComponentDisplayName(item.id);
    const hasCheck = item.checked;
    const hasDetails = item.detalles && item.detalles.trim() !== "";

    if (!hasCheck && !hasDetails) return "";

    let content = `<div class="field">`;
    
    if (hasCheck) {
        content += `<span class="text-green-600 mr-1" style="color: #10b981;">&#x2713;</span>`; 
    }

    content += `<span class="font-bold">${componentName}:</span>`;
    
    if (hasDetails) {
        content += ` ${item.detalles}`;
    } else if (hasCheck) {
        content += ` OK`;
    }
    
    content += `</div>`;
    return content;
  };
  
  const handlePrint = () => {
    if (isEditMode && !formData.reportNumber) {
        toast.error("El informe debe estar cargado para imprimir.");
        return;
    }
    
    if (!isEditMode && !validateForm()) {
      toast.error(
        "Por favor, completa todos los campos obligatorios antes de imprimir (sólo para nuevos informes)."
      );
      return;
    }

    const clientDisplay = selectedClient?.data?.tipoPersona === 'JURIDICA' 
        ? selectedClient.data.razonSocial 
        : `${selectedClient.data.nombre} ${selectedClient.data.apellido}`;

    const clientPhone = selectedClient?.data?.telefono || "N/A";
    
    const motivoIngresoText = servicesList.map(s => {
        const amountDisplay = s.service === 'Revisión' ? `(Diagnóstico: S/ ${s.amount.toFixed(2)})` : `(S/ ${s.amount.toFixed(2)})`;
        return `${s.service.charAt(0).toUpperCase() + s.service.slice(1)} ${amountDisplay}`;
    }).join(', ');
        
    const additionalServiceHtml = additionalServices.map(s => `<li>${s.description} (Adicional) - S/ ${s.amount.toFixed(2)}</li>`).join('');
    
    const allServicesList = servicesList.length > 0 || additionalServices.length > 0 ? `
        <div class="section-title">SERVICIOS SOLICITADOS</div>
        <div class="field">
            <span class="font-bold">Motivo:</span> ${motivoIngresoText}
        </div>
        ${additionalServiceHtml ? `
        <div class="section-title">SERVICIOS ADICIONALES</div>
        <ul style="list-style-type: disc; padding-left: 20px;">
            ${additionalServiceHtml}
        </ul>` : ''}
    ` : '';

    let dia, mes, anio, hora;
    const isNewReport = !diagnosticoId;

    if (isNewReport) {
        dia = getToday.day;
        mes = getToday.month;
        anio = getToday.year;
        hora = getToday.time;
    } else {
        [dia, mes, anio] = formData.fecha
        ? formData.fecha.split("-")
        : ["N/A", "N/A", "N/A"];
        hora = formData.hora || "N/A";
    }

    const printContent = `
      <html>
        <head>
            <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');  
    .pdf-container { 
        width: 94%; 
        padding: 2%; 
        margin: auto; 
        font-size: 9pt; 
        color: #1f2937; 
        font-family: 'Roboto', sans-serif; 
        letter-spacing: -0.2px; 
        line-height: 1.2; 
    }
    .header { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        border-bottom: 3px solid #e11d48; 
        padding-bottom: 8px; 
        margin-bottom: 12px; 
    }
    .logo { height: 55px; width: auto; max-width: 140px; }
    .company-info { 
        text-align: right; 
        font-size: 7.5pt; 
        color: #4b5563; 
        letter-spacing: -0.2px; 
        line-height: 1.2; 
    }
    .report-info { 
        margin-top: 10px; 
        border: 2px solid #039be5; 
        padding: 12px; 
        border-radius: 8px; 
    }
    .section-title { 
        font-weight: bold; 
        color: #1e40af; 
        border-bottom: 1px dashed #bfdbfe; 
        padding-bottom: 2px; 
        margin-top: 12px; 
        margin-bottom: 6px; 
        font-size: 10pt; 
        letter-spacing: -0.3px; 
    }
    .field { margin-bottom: 2px; display: flex; align-items: center; letter-spacing: -0.2px; }
    .flex-row { display: flex; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; }
    .flex-row > div { flex-basis: 48%; }
    .footer { text-align: center; }
    .clausula { 
        margin-top: 8px; 
        font-size: 7pt; 
        color: #6b7280; 
        text-align: justify; 
        line-height: 1.05; 
        letter-spacing: -0.2px; 
    }
    .firma { margin-top: 35px; text-align: center; }
    .firma-line { border-top: 1px solid #000; width: 230px; margin: 4px auto 0; }
    .grid-cols-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .text-center { text-align: center; }
    .text-xl { font-size: 1.3rem; letter-spacing: -0.3px; }
    .font-bold { font-weight: 700; }
    .mt-4 { margin-top: 0.8rem; }
    .mb-2 { margin-bottom: 0.4rem; }
    .text-green-600 { color: #10b981; }
</style>

        </head>
        <body>
          <div class="pdf-container">
            <div class="header">
              <img src="${logo}" class="logo" />
              <div class="company-info">
                <div style="font-size: 10pt; font-weight: bold; color: #e11d48;">COMPUDOCTOR</div>
                <div>Jr. Camaná 1190 - 2do piso - Ofi 203, Cercado de Lima</div>
                <div>Cel. 998 371 086 / 960 350 483 | Tel. 014242142</div>
                <div>compudoctor_@hotmail.com | www.compudoctor.pe</div>
              </div>
            </div>
            <h1 class="text-center text-xl font-bold mt-4" style="color: #e11d48;">INFORME TÉCNICO N° ${reportNumber}</h1>

            <div class="report-info">
              <div class="flex-row" style="margin-bottom: 15px;">
                <div>
                  <span class="font-bold">Cliente:</span> ${clientDisplay}
                </div>
                <div>
                  <span class="font-bold">Celular:</span> ${
                    clientPhone
                  }
                </div>
                <div>
                  <span class="font-bold">Fecha:</span> ${dia}/${mes}/${anio}
                </div>
                <div>
                  <span class="font-bold">Hora:</span> ${hora}
                </div>
              </div>
              
              <div class="section-title">DESCRIPCIÓN DEL EQUIPO</div>
              <div class="flex-row">
                  <div><span class="font-bold">Tipo:</span> ${
                    formData.tipoEquipo
                  }</div>
                  <div><span class="font-bold">Marca:</span> ${
                    formData.marca
                  }</div>
                  <div><span class="font-bold">Modelo:</span> ${
                    formData.modelo || 'N/A'
                  }</div>
                  <div><span class="font-bold">Serie:</span> ${
                    formData.serie || 'N/A'
                  }</div>
                  <div><span class="font-bold">¿Enciende?:</span> ${
                    formData.canTurnOn || 'N/A'
                  }</div>
              </div>
              
              ${allServicesList}

              <div class="section-title">COMPONENTES Y ACCESORIOS</div>
              <div class="grid-cols-2">
                  ${formData.items
                    .filter((item) => item.checked || (item.detalles && item.detalles.trim() !== ""))
                    .map(generateComponentHtml)
                    .join("")}
                  ${
                    formData.sistemaOperativo
                      ? `<div class="field"><span class="font-bold">S.O.:</span> ${formData.sistemaOperativo}</div>`
                      : ""
                  }
                  ${
                    formData.bitlockerKey
                      ? `<div class="field"><span class="font-bold">Bitlocker:</span> Activado</div>`
                      : ""
                  }
              </div>
              
              <div class="section-title">DETALLES DEL SERVICIO</div>
              <div class="field">
                  <span class="font-bold">Observaciones:</span> ${
                    formData.observaciones || "Sin observaciones adicionales."
                  }
              </div>

              <div class="section-title">INFORMACIÓN DE PAGO</div>
              <div class="field mb-2">
                  <span class="font-bold">Detalles de Pago:</span> ${formData.detallesPago || 'N/A'}
              </div>
              <div class="flex-row" style="font-weight: bold; color: #e11d48;">
                  <div><span class="font-bold">Diagnóstico:</span> S/ ${formData.diagnostico.toFixed(
                    2
                  )}</div>
                  <div><span class="font-bold">Monto Servicio:</span> S/ ${formData.montoServicio.toFixed(
                    2
                  )}</div>
                  <div><span class="font-bold">Total:</span> S/ ${formData.total.toFixed(
                    2
                  )}</div>
                  <div><span class="font-bold">A Cuenta:</span> S/ ${formData.aCuenta.toFixed(
                    2
                  )}</div>
                  <div><span class="font-bold">Saldo:</span> S/ ${formData.saldo.toFixed(
                    2
                  )}</div>
              </div> 

              <div class="section-title">TÉCNICOS</div>
              <div class="flex-row">
                  <div><span class="font-bold">Técnico Recepción:</span> ${
                    formData.tecnicoRecepcion
                  }</div>
                  <div><span class="font-bold">Técnico Inicial:</span> ${
                    formData.tecnicoInicial || 'N/A'
                  }</div>
                  <div><span class="font-bold">Técnico Testeo:</span> ${
                    formData.tecnicoTesteo || 'N/A'
                  }</div>
                  <div><span class="font-bold">Técnico Responsable:</span> ${
                    formData.tecnicoResponsable || 'N/A'
                  }</div>
                  <div><span class="font-bold">Área Destino:</span> ${
                    formData.area
                  }</div>
              </div>
            </div>
            
            <div class="footer">
              <p class="clausula"><b>CLAUSULA N° 01</b><br>
              Se dará PRIORIDAD al servicio según el motivo por el cual ingresa el equipo, especialmente si es por una reparación de placa. Si se encuentra algún OTRO PROBLEMA durante el proceso, se informará como observación. En caso de que el cliente solicite la revisión o solución de este problema adicional, se considerará como un servicio aparte, lo que implicará un costo adicional.</p>
              <p class="clausula"><b>CLAUSULA N° 02</b><br>
              La garantía cubrirá únicamente el servicio realizado. Si, después de algunos días, se presenta OTRO PROBLEMA, no se aplicaría dicho garantia al equipo.</p>
              <p class="clausula"><b>CLAUSULA N° 03</b><br>
              Todo SERVICIO que no incluya un producto NO INCLUYE EL IGV (18%), en caso de que el cliente solicite un comprobante electrónico. Los pagos con tarjeta de CRÉDITO Y DÉBITO tendrán un recargo adicional del 5%.</p>
              <div class="firma">
                  <div class="firma-line"></div>
                  <div>FIRMA CLIENTE</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const newWindow = window.open("", "", "width=800,height=600");
    newWindow.document.write(printContent);
    newWindow.document.close();
    newWindow.focus();
    
    setTimeout(() => {
  newWindow.print();
}, 300);
  };
  
  // Helper interno para la lógica de "Otros"
  const getOtherComponentAvailabilityInternal = (itemId, otherType, canTurnOn, isFormLocked) => {
    const isCheckOptional = canTurnOn === 'SI';
    let isAvailable = false;
    let isCheckDisabled = true; 
    let isDetailRequired = false;
    let isDetailDisabled = isFormLocked; 

    switch (otherType) {
        case 'TARJETA_VIDEO':
            if (itemId === 'otros') { 
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
            if (['procesador', 'tarjetaVideo', 'memoriaRam', 'otros'].includes(itemId)) {
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
    const isAIO = tipoEquipo === 'Allinone';
    const isPrinter = tipoEquipo === 'Impresora';

    let isAvailable = true;
    let isCheckDisabled = isFormLocked || canTurnOn === 'NO'; 
    let isDetailDisabled = isFormLocked;
    
    // --- Validation Requirements (For Display and Validation) ---
    let isDetailRequired = false;
    let isCheckRequired = false;
    
    const mandatoryDetailSiPrende = ['procesador', 'placaMadre', 'memoriaRam', 'tarjetaVideo'];
    const mandatoryCheckSiPrende = ['procesador', 'placaMadre', 'memoriaRam', 'wifi', 'camara', 'microfono', 'parlantes'];
    const mandatoryPrinterIds = ['rodillos', 'cabezal', 'tinta', 'bandejas'];
    const diskIds = ['hdd', 'ssd', 'm2Nvme'];

    // Requisito 3: Impresora
    if (isPrinter) {
        if (mandatoryPrinterIds.includes(itemId)) {
            isDetailRequired = true;
        }
    }
    
    // Requisito 1 & 2: AIO and SI PRENDE checks/details
    if (['PC', 'Laptop', 'Allinone'].includes(tipoEquipo)) {
        
        // Requisito 1: AIO - todos los componentes básicos requieren detalles
        if (isAIO && MANDATORY_COMPONENT_IDS.includes(itemId)) {
             isDetailRequired = true;
        }
        
        if (isSiPrende) {
            // 2.2 Mandatory Details (Sobrescribe AIO si aplica)
            if (mandatoryDetailSiPrende.includes(itemId)) {
                isDetailRequired = true;
            } else if (diskIds.includes(itemId)) {
                // Detalle de disco es requerido si está marcado (se valida en validateForm)
                const isDiskChecked = formData.items.find(i => i.id === itemId)?.checked;
                if (isDiskChecked) isDetailRequired = true;
            }
            
            // 2.1 & 2.4 Mandatory Checks
            if (mandatoryCheckSiPrende.includes(itemId) || diskIds.includes(itemId)) {
                isCheckRequired = true;
                isCheckDisabled = isFormLocked;
            }
        }
    }

    // Lógica específica para "Otros" (Mantenida)
    if (tipoEquipo === 'Otros') {
        const otherStatus = getOtherComponentAvailabilityInternal(itemId, otherComponentType, canTurnOn, isFormLocked);
        isAvailable = otherStatus.isAvailable;
        isCheckDisabled = otherStatus.isCheckDisabled;
        isDetailDisabled = otherStatus.isDetailDisabled;
        if (otherStatus.isDetailRequired) isDetailRequired = true;
    }
    
    // Lógica para deshabilitar el check si NO enciende
    if (canTurnOn === 'NO' && !isFormLocked) {
        isCheckDisabled = true;
    }

    return { 
        isAvailable, 
        isCheckDisabled, 
        isDetailDisabled, 
        isDetailRequired,
        isCheckRequired 
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
        const userOptions = allUsersData.map((u) => ({ value: u.id, label: u.nombre })); 

        const technicianOptions = allUsersData
            .filter(u => USER_TECHNICIAN_ROLES.includes(u.rol))
            .map((u) => ({ value: u.id, label: u.nombre }));

        setUsers(technicianOptions);

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
            
            const tecnicoInicialOption = userOptions.find(u => u.value === report.tecnicoInicialId); 
            const tecnicoTesteoOption = userOptions.find(u => u.value === report.tecnicoTesteoId);
            const tecnicoResponsableOption = userOptions.find(u => u.value === report.tecnicoResponsableId);

            if (report.tipoEquipo === 'Otros') {
                setOtherComponentType(report.otherComponentType || "");
                setOtherDescription(report.otherDescription || "");
            }
            
            let diagnosisCost = parseFloat(report.diagnostico) || 0;

            if (report.servicesList && Array.isArray(report.servicesList)) {
                const loadedServices = report.servicesList.map(s => {
                    const amount = parseFloat(s.amount) || 0;
                    return {...s, amount: amount};
                });
                setServicesList(loadedServices);
            } else {
                 setServicesList([]);
            }
            
            if (report.additionalServices) {
              setAdditionalServices(report.additionalServices.map(s => ({...s, amount: parseFloat(s.amount)})));
              setShowAdditionalServices(report.hasAdditionalServices || report.additionalServices.length > 0);
            }
            
            const isReportLockedOnLoad = ['ENTREGADO', 'TERMINADO'].includes(report.estado) || (!!report.area && report.area !== 'N/A');
            setInitialAreaAssignedStatus(isReportLockedOnLoad);
            
            setFormData({
              ...report,
              diagnostico: diagnosisCost,
              montoServicio: parseFloat(report.montoServicio) || 0,
              total: parseFloat(report.total) || 0,
              aCuenta: parseFloat(report.aCuenta) || 0,
              saldo: parseFloat(report.saldo) || 0,
              canTurnOn: report.canTurnOn || "",
              bitlockerKey: report.bitlockerKey || false,
              detallesPago: report.detallesPago || "",
              observaciones: report.observaciones || "",
              
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
        
        if (item.service === 'Revisión') {
            diagnosisCost = amount; 
            diagnosisServiceFound = true;
        } else if (item.service === 'Reparación') {
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
         setFormData(prev => ({...prev, diagnostico: 0}));
    }
  };

  const handleServiceChange = (id, field, value) => {
    if (isFormLocked) return;
    const numericValue = (field === 'amount') ? parseFloat(value) || 0 : value;
    
    setServicesList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: numericValue };
          
          if (field === 'service') {
              if (value === 'Reparación') {
                   setFormData(prev => ({ ...prev, diagnostico: 0 })); 
              } else if (value === 'Revisión') {
                   setFormData(prev => ({ ...prev, diagnostico: numericValue }));
              }
              if (value !== 'Otros') {
                  newItem.description = ''; 
              }
              if (value === 'Reparación') {
                  toast.success("Servicio 'Reparación' detectado. Se eliminaron otros servicios.");
                  return newItem;
              }
          }
          
          if (field === 'amount') {
               if (item.service === 'Revisión') {
                   setFormData(prev => ({ ...prev, diagnostico: numericValue }));
               }
          }
          
          return newItem;
        }
        return item;
      }).filter(item => item.service !== 'Reparación' || item.id === id) 
    );
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
          newState.tecnicoInicial = '';
          newState.tecnicoInicialId = '';
          newState.area = ''; 
          
          newState.items = formData.items.map(item => ({
              ...item,
              checked: false, 
          }));
          
          toast('Campos de Testeo (checks), Software, Técnicos Inicial/Testeo/Responsable y Área de Destino se han deshabilitado.'); 
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
    }));
  };

  const handleItemCheck = (e) => {
    if (isFormLocked || formData.canTurnOn === 'NO') return; 
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
      items: prev.items.map((item) =>
        item.id === name ? { ...item, detalles: value } : item
      ),
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
          if (field === 'modelo' && formData.tipoEquipo === 'Otros') return;
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
             if (item.service !== 'Revisión' && item.service !== 'Reparación' && (!item.amount || parseFloat(item.amount) <= 0)) {
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

    const isSerieRequired = !['Allinone', 'PC', 'Otros'].includes(formData.tipoEquipo);

    if (isSerieRequired && !formData.serie) {
        newErrors.serie = "La Serie es obligatoria.";
    } 
    
    // -----------------------------------------------------------
    // REQUISITO 1: AIO - todos los campos relevantes requieren detalles.
    if (formData.tipoEquipo === 'Allinone') { 
        COMPONENT_OPTIONS[formData.tipoEquipo]?.forEach(item => {
            const currentItem = formData.items.find(i => i.id === item.id);
            if (MANDATORY_COMPONENT_IDS.includes(item.id) && (!currentItem || !currentItem.detalles)) {
                 newErrors[item.id] = `Detalle de ${getComponentDisplayName(item.id)} es obligatorio para All in One.`;
            }
        });
    }

    // REQUISITO 3: Impresora - campos de impresión obligatorios
    if (formData.tipoEquipo === 'Impresora') { 
        const printerMandatoryIds = ['rodillos', 'cabezal', 'tinta', 'bandejas'];
        printerMandatoryIds.forEach(mandatoryId => {
            const item = formData.items.find(i => i.id === mandatoryId);
            if (!item || !item.detalles) {
                 newErrors[mandatoryId] = `Detalle de ${getComponentDisplayName(mandatoryId)} es obligatorio para Impresora.`;
            }
        });
    }
    // -----------------------------------------------------------
    
    if (formData.tipoEquipo === 'Otros') {
        if (!otherComponentType) {
            newErrors.otherComponentType = "Debe seleccionar el tipo de componente principal.";
        }
        if (otherComponentType === 'OTRO_DESCRIPCION' && !otherDescription) {
            newErrors.otherDescription = "Debe especificar la descripción.";
        }
    }
    
    if (formData.canTurnOn === 'SI') {
        
        if (showAreaInput && isAreaRequired && !formData.area) { 
            newErrors.area = "El Área de Destino es obligatoria.";
        }
        
        if (!formData.tecnicoInicialId) { 
            newErrors.tecnicoInicialId = "El Técnico Inicial es obligatorio si el equipo enciende.";
        }
        
        if (!formData.tecnicoTesteoId) {
            newErrors.tecnicoTesteoId = "El Técnico de Testeo es obligatorio si el equipo enciende.";
        }
        
        const isOSRequired = ['PC', 'Laptop'].includes(formData.tipoEquipo);
        if (isOSRequired && !formData.sistemaOperativo) {
            newErrors.sistemaOperativo = "El Sistema Operativo es obligatorio para PC/Laptop si el equipo enciende.";
        }
        
        // REQUISITO 2: VALIDACIONES SI ENCIENDE
        const items = formData.items;
        
        // 2.2 OBLIGATORIO LLENADO DE DETALLES
        const mandatoryDetailIds = ['procesador', 'placaMadre', 'memoriaRam', 'tarjetaVideo'];
        mandatoryDetailIds.forEach(mandatoryId => {
            const item = items.find(i => i.id === mandatoryId);
            const isAvailable = COMPONENT_OPTIONS[formData.tipoEquipo]?.some(c => c.id === mandatoryId);

            if (isAvailable && (!item || !item.detalles)) {
                 newErrors[mandatoryId] = `Detalle de ${getComponentDisplayName(mandatoryId)} es obligatorio si enciende.`;
            }
        });

        // 2.1 OBLIGATORIO MARCAR LA CASILLA
        const mandatoryCheckIds = ['procesador', 'placaMadre', 'memoriaRam', 'wifi'];
        mandatoryCheckIds.forEach(mandatoryId => {
            const item = items.find(i => i.id === mandatoryId);
            const isAvailable = COMPONENT_OPTIONS[formData.tipoEquipo]?.some(c => c.id === mandatoryId);

            if (isAvailable && item && !item.checked) {
                 newErrors[mandatoryId + '_check'] = `La casilla de ${getComponentDisplayName(mandatoryId)} es obligatoria si enciende.`;
            }
        });
        
        // 2.1 DISCO CHECK OBLIGATORIO (at least one of HDD/SSD/NVME must be checked)
        const diskIds = ['hdd', 'ssd', 'm2Nvme'];
        const diskItems = items.filter(i => diskIds.includes(i.id));
        const anyDiskChecked = diskItems.some(i => i.checked);
        
        if (diskItems.length > 0 && !anyDiskChecked && ['PC', 'Laptop', 'Allinone'].includes(formData.tipoEquipo)) {
             newErrors.disk_check = "Debe marcar al menos un tipo de disco (HDD, SSD o M2 NVME) si enciende.";
        }
        
        // 2.1/2.2 DISCO DETAIL OBLIGATORIO: Detalle del disco es OBLIGATORIO si está marcado
        diskItems.forEach(item => {
            if (item.checked && !item.detalles) {
                newErrors[item.id] = `Detalle de ${getComponentDisplayName(item.id)} es obligatorio si está marcado.`;
            }
        });
        
        // 2.4 MARCAR OBLIGATORIO PARA TESTEO BASICO: CÁMARA / MICRÓFONO / PARLANTE
        const basicTestCheckIds = ['camara', 'microfono', 'parlantes'];
        basicTestCheckIds.forEach(testId => {
            const item = items.find(i => i.id === testId);
            const isAvailable = COMPONENT_OPTIONS[formData.tipoEquipo]?.some(c => c.id === testId);
            
            if (isAvailable && item && !item.checked) {
                newErrors[testId + '_check'] = `La casilla de ${getComponentDisplayName(testId)} es obligatoria para testeo si enciende.`;
            }
        });

        // Other component validation logic for "Otros"
        if (formData.tipoEquipo === 'Otros' && otherComponentType) {
             const itemsToCheck = [];
             if (otherComponentType === 'TARJETA_VIDEO') {
                 itemsToCheck.push('otros');
             } else if (otherComponentType.startsWith('PLACA_MADRE')) {
                 itemsToCheck.push('procesador', 'tarjetaVideo', 'memoriaRam', 'otros');
             }
             
             itemsToCheck.forEach(itemId => {
                const item = formData.items.find(i => i.id === itemId);
                const isDetailRequired = (otherComponentType.startsWith('PLACA_MADRE') || otherComponentType === 'TARJETA_VIDEO');

                if (isDetailRequired && (!item || !item.detalles)) {
                    if (otherComponentType === 'OTRO_DESCRIPCION') {
                    } else {
                        newErrors[itemId] = `Detalle de ${getComponentDisplayName(itemId)} es obligatorio.`;
                    }
                }
             });
        }
    }
    
    if (formData.montoServicio <= 0 && !hasRepairService && !servicesList.some(s => s.service === 'Revisión')) {
        newErrors.montoServicio = "Debe haber un monto válido para el servicio o para la revisión.";
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
      toast.error("Por favor, completa todos los campos obligatorios.");
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
        const amountDisplay = s.service === 'Revisión' ? `(Diagnóstico: S/ ${s.amount.toFixed(2)})` : `(S/ ${s.amount.toFixed(2)})`;
        return `${s.service.charAt(0).toUpperCase() + s.service.slice(1)} ${amountDisplay}`;
    }).join(', ');

    try {
      const baseData = {
        ...formData,
        tecnicoResponsable: finalResponsible,
        tecnicoResponsableId: finalResponsibleId,
        clientId: selectedClient.value,
        clientName: clientReportName, 
        telefono: clientData.telefono, 
        
        diagnostico: parseFloat(formData.diagnostico) || 0,
        montoServicio: parseFloat(formData.montoServicio) || 0,
        total: parseFloat(formData.total) || 0,
        aCuenta: parseFloat(formData.aCuenta) || 0,
        saldo: parseFloat(formData.saldo) || 0,
        
        servicesList: servicesList.map(s => ({...s, amount: s.amount.toFixed(2)})),
        motivoIngreso: motivoIngresoText, 
        additionalServices: additionalServices.map(s => ({...s, amount: s.amount.toFixed(2)})),
        hasAdditionalServices: additionalServices.length > 0,
        canTurnOn: formData.canTurnOn, 
      };
      
      if (formData.tipoEquipo === 'Otros') {
          baseData.otherComponentType = otherComponentType;
          baseData.otherDescription = otherDescription;
      }
      
      if (isEditMode) {
          if (isAdminOrSuperadmin && baseData.area && baseData.area !== 'N/A') {
              // Si se asigna un área, el técnico actual es el responsable.
              baseData.tecnicoActual = baseData.tecnicoResponsable;
              baseData.tecnicoActualId = baseData.tecnicoResponsableId;
          }
          
          await updateDiagnosticReport(diagnosticoId, baseData);
          toast.success(`Informe #${reportNumber} actualizado con éxito.`);
      } else {
          // En modo creación:
          // El Técnico Responsable es el primer Técnico Asignado (tecnicoActual).
          baseData.tecnicoActual = finalResponsible; 
          baseData.tecnicoActualId = finalResponsibleId; 
          
          // Si no es Admin/Superadmin, no debe tener área de destino.
          if (!isAdminOrSuperadmin) {
              baseData.area = 'N/A';
          }

          await createDiagnosticReport({
            ...baseData,
            reportNumber: parseInt(reportNumber),
            fecha: `${getToday.day}-${getToday.month}-${getToday.year}`,
            hora: getToday.time,
            estado: "ASIGNADO", 
          });
          toast.success(`Informe #${reportNumber} creado con éxito.`);
      }
      
      navigate("/ver-estado");
    } catch (error) {
      toast.error(error.message);
    } finally {
        setIsSaving(false); 
    }
  };

  const showTecnicoResponsable = isAdminOrSuperadmin;

  let dia, mes, anio, hora;
  const isNewReport = !diagnosticoId;

  if (isNewReport) {
    dia = getToday.day;
    mes = getToday.month;
    anio = getToday.year;
    hora = getToday.time;
  } else {
    [dia, mes, anio] = formData.fecha
      ? formData.fecha.split("-")
      : ["N/A", "N/A", "N/A"];
    hora = formData.hora || "N/A";
  }
  const displayDate = isNewReport
    ? `${getToday.day}/${getToday.month}/${getToday.year}`
    : formData.fecha;
  const displayTime = isNewReport ? getToday.time : formData.hora;
  
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
                Seleccionar Cliente
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
                ¿El equipo enciende?
              </label>
              <select
                name="canTurnOn"
                value={formData.canTurnOn}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                  errors.canTurnOn ? "ring-2 ring-red-500" : ""
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
                Tipo de Equipo
              </label>
              <select
                name="tipoEquipo"
                value={formData.tipoEquipo}
                onChange={handleEquipoChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                  errors.tipoEquipo ? "ring-2 ring-red-500" : ""
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
                    Componente Principal
                  </label>
                  <select
                    name="otherComponentType"
                    value={otherComponentType}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      errors.otherComponentType ? "ring-2 ring-red-500" : ""
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
                    Descripción Específica
                  </label>
                  <input
                    type="text"
                    name="otherDescription"
                    value={otherDescription}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      errors.otherDescription ? "ring-2 ring-red-500" : ""
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
              <label className="block text-sm font-medium mb-1">Marca</label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                  errors.marca ? "ring-2 ring-red-500" : ""
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
                 {formData.tipoEquipo !== 'Otros' && (
                     <span className="text-red-500 text-xs ml-1">(Obligatorio)</span>
                 )}
              </label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                  errors.modelo ? "ring-2 ring-red-500" : ""
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
                {!['Allinone', 'PC', 'Otros'].includes(formData.tipoEquipo) && (
                    <span className="text-red-500 text-xs ml-1">(Obligatoria)</span>
                )}
              </label>
              <input
                type="text"
                name="serie"
                value={formData.serie}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                  errors.serie ? "ring-2 ring-red-500" : ""
                }`}
                required={!['Allinone', 'PC', 'Otros'].includes(formData.tipoEquipo)}
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
            {['Impresora'].includes(formData.tipoEquipo) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Para el tipo de equipo "{formData.tipoEquipo}", los campos de componentes son obligatorios (detalles) o para testeo (check).
                </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {COMPONENT_OPTIONS[formData.tipoEquipo]?.filter(item => {
                  if (formData.tipoEquipo === 'Otros') {
                      return getComponentStatus(item.id).isAvailable;
                  }
                  return true;
              }).map((item, index) => {
                
                const { isAvailable, isCheckDisabled, isDetailDisabled, isDetailRequired, isCheckRequired } = getComponentStatus(item.id);
                
                const showDetailError = isDetailRequired && errors[item.id];
                const showCheckError = isCheckRequired && errors[item.id + '_check'];
                const showMandatoryIndicator = isDetailRequired;


                return (
                <div key={item.id} className="flex items-center space-x-2">
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
                    {showMandatoryIndicator && <FaCheckCircle className="ml-1 text-xs text-blue-500" title="Detalle obligatorio"/>}
                    {isCheckRequired && !isDetailRequired && <FaCheck className="ml-1 text-xs text-green-500" title="Check Obligatorio"/>}
                  </label>
                  <input
                    type="text"
                    name={item.id}
                    value={formData.items.find((i) => i.id === item.id)?.detalles || ""}
                    onChange={handleItemDetailsChange}
                    className={`flex-1 p-1 text-xs border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                       showDetailError ? "ring-2 ring-red-500" : ""
                    }`}
                    placeholder="Detalles"
                    disabled={isDetailDisabled}
                  />
                   {showDetailError && (
                        <FaTimesCircle className="text-red-500" title={errors[item.id]}/>
                   )}
                   {showCheckError && !showDetailError && (
                        <FaTimesCircle className="text-red-500" title={errors[item.id + '_check']}/>
                   )}
                </div>
              )})}
            </div>
            
            {errors.disk_check && (
              <p className="text-red-500 text-sm mt-4">{errors.disk_check}</p>
            )}
          </div>
        )}

        {(formData.tipoEquipo === "PC" ||
          formData.tipoEquipo === "Laptop" ||
          formData.tipoEquipo === "Allinone") && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-orange-500">
              Software y Seguridad
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
                <label className="block text-sm font-medium mb-1">
                    Sistema Operativo
                </label>
                <select
                  name="sistemaOperativo"
                  value={formData.sistemaOperativo}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      errors.sistemaOperativo ? "ring-2 ring-red-500" : ""
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
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="3"
              className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                errors.observaciones ? "ring-2 ring-red-500" : ""
              }`}
              required
              disabled={isFormLocked} 
            ></textarea>
            {errors.observaciones && (
              <p className="text-red-500 text-sm mt-1">{errors.observaciones}</p>
            )}
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Servicios Solicitados</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end mb-4">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1">Servicio</label>
                    <div className="flex items-center gap-1">
                        <select
                            name="service"
                            value={newServiceSelection.service}
                            onChange={(e) => setNewServiceSelection(prev => ({...prev, service: e.target.value}))}
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
                
                {newServiceSelection.service === 'Otros' ? (
                    <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Detalle (Otros)</label>
                            <input
                                type="text"
                                name="otherServiceText"
                                value={otherServiceText}
                                onChange={(e) => setOtherServiceText(e.target.value)}
                                placeholder="Especifique el servicio"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                disabled={isFormLocked} 
                            />
                    </div>
                ) : (
                    <div className="md:col-span-2"></div>
                )}
                
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1">Monto (S/)</label>
                    <input
                        type="number"
                        name="amount"
                        min="0"
                        step="any"
                        value={newServiceSelection.amount}
                        onChange={(e) => setNewServiceSelection(prev => ({...prev, amount: parseFloat(e.target.value)}))}
                        placeholder="Costo"
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        disabled={isFormLocked || newServiceSelection.service === 'Revisión' || newServiceSelection.service === ''} 
                    />
                </div>
                
                <button
                    type="button"
                    onClick={() => {
                        const amount = newServiceSelection.service === 'Revisión' ? (newServiceSelection.amount || 0) : newServiceSelection.amount;
                        
                        if (newServiceSelection.service && newServiceSelection.service !== 'Revisión' && newServiceSelection.service !== 'Reparación' && (!amount || amount <= 0)) {
                             toast.error("El monto debe ser mayor a 0 para este servicio.");
                             return;
                        }
                        
                        let serviceDesc = newServiceSelection.service === 'Otros' ? otherServiceText : newServiceSelection.service;
                        if (newServiceSelection.service === 'Otros' && !otherServiceText) {
                            toast.error("Debe especificar la descripción del servicio 'Otros'.");
                            return;
                        }
                        
                        setServicesList(prev => {
                            if (servicesList.some(s => s.service === 'Reparación') && serviceDesc !== 'Reparación') return prev;
                            if (servicesList.length >= MAX_SERVICES) return prev;
                            
                            const newEntry = {
                                id: Date.now(),
                                service: serviceDesc,
                                amount: amount,
                            };
                            
                            if (serviceDesc === 'Reparación') {
                                setFormData(p => ({ ...p, diagnostico: amount }));
                                return [newEntry];
                            } else if (serviceDesc === 'Revisión') {
                                setFormData(p => ({ ...p, diagnostico: amount }));
                                return [...prev.filter(s => s.service !== 'Reparación'), newEntry];
                            } else {
                                return [...prev.filter(s => s.service !== 'Reparación'), newEntry];
                            }
                        });

                        setNewServiceSelection({ service: "", amount: 0 });
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
                            {s.service === 'Reparación' && <span className="ml-2 text-red-500">(Habilita Diagnóstico)</span>}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {s.service === 'Revisión' ? 'Diagnóstico' : 'Monto'} S/ {s.amount.toFixed(2)}
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
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={showAdditionalServices}
              onChange={() => setShowAdditionalServices((prev) => !prev)}
              className="h-4 w-4"
              disabled={isFormLocked} 
            />
            <label className="ml-2 text-xl font-semibold text-pink-500">
              Agregar Servicios Adicionales
            </label>
          </div>
          
          {showAdditionalServices && (
            <div className="mt-4 border p-4 rounded-lg dark:border-gray-600">
              <h3 className="text-lg font-semibold mb-2">Detalle Servicios Adicionales</h3>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Descripción del servicio"
                  value={newService.description}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  disabled={isFormLocked} 
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  onFocus={handlePaymentFocus}
                  onWheel={handleWheel}
                  placeholder="Monto (S/)"
                  value={newService.amount}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full md:w-32 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                  disabled={isFormLocked} 
                />
                <button
                  type="button"
                  onClick={handleAddAdditionalService}
                  className="bg-blue-500 text-white font-bold px-4 rounded-lg disabled:bg-blue-300"
                  disabled={isFormLocked} 
                >
                  <FaPlus />
                </button>
              </div>
              
              <ul className="space-y-1">
                {additionalServices.map((service) => (
                  <li
                    key={service.id}
                    className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md"
                  >
                    <span>
                      {service.description} - S/ {service.amount.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAdditionalService(service.id)}
                      className="ml-4 text-red-500 hover:text-red-700"
                      disabled={isFormLocked} 
                    >
                      <FaTimes />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
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
                A Cuenta (S/)
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
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-indigo-500">
            Asignación de Personal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Técnico de Recepción (currentUser) - Requerimiento: Mostrar primero */}
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
            
            {/* 2. Técnico Inicial (Nuevo campo) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Técnico Inicial
              </label>
              <Select
                options={users}
                value={users.find((u) => u.value === formData.tecnicoInicialId)}
                onChange={(option) => handleUserChange("tecnicoInicial", option)}
                placeholder="Selecciona un técnico..."
                isClearable
                className={`${errors.tecnicoInicialId ? "ring-2 ring-red-500 rounded-lg" : ""}`}
                isDisabled={isFormLocked || formData.canTurnOn === 'NO'}
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
            
            {/* 3. Técnico de Testeo */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Técnico de Testeo
              </label>
              <Select
                options={users}
                value={users.find((u) => u.value === formData.tecnicoTesteoId)}
                onChange={(option) => handleUserChange("tecnicoTesteo", option)}
                placeholder="Selecciona un técnico..."
                className={`${errors.tecnicoTesteoId ? "ring-2 ring-red-500 rounded-lg" : ""}`}
                isClearable
                isDisabled={isFormLocked || formData.canTurnOn === 'NO'} 
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
            
            {/* 4. Técnico Responsable (Solo visible si es Admin/Superadmin) */}
            {isAdminOrSuperadmin && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Técnico Responsable (Opcional)
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
                    isDisabled={isFormLocked || formData.canTurnOn === 'NO'} 
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
            )}
            
          </div>
          
          {/* Área de Destino (Solo visible si es Admin/Superadmin) */}
          <div className="mt-4">
            {showAreaInput && (
              <>
                <label className="block text-sm font-medium mb-1">
                  Área de Destino
                </label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                    errors.area ? "ring-2 ring-red-500" : ""
                  }`}
                  required={isAreaRequired}
                  disabled={isFormLocked || formData.canTurnOn === 'NO'}
                >
                  <option value="">Selecciona un área</option>
                  {AREA_OPTIONS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                {errors.area && (
                  <p className="text-red-500 text-sm mt-1">{errors.area}</p>
                )}
              </>
            )}
          </div>
        </div>

        {!isFormLocked && ( 
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
        )}
      </form>
      
      {isNewClientModalOpen && (
        <Modal onClose={() => setIsNewClientModalOpen(false)}>
            <NewClientForm
                onSave={handleAddClient}
                onCancel={() => setIsNewClientModalOpen(false)}
            />
        </Modal>
    )}
    </div>
  );
}

export default Diagnostico;