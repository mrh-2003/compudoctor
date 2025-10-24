import { useState, useEffect, useMemo, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import { FaPlus, FaSave, FaPrint, FaTrash, FaPen, FaCheckCircle, FaTimesCircle, FaCheck } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  createDiagnosticReport,
  getNextReportNumber,
  getAllClientsForSelection,
  getClientById,
  getDiagnosticReportById,
  updateDiagnosticReport,
} from "../services/diagnosticService";
import { getAllUsersDetailed } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from '../assets/images/compudoctor-logo.png';

const REQUIRED_COMPONENT_INPUTS = [
    "procesador", "placaMadre", "memoriaRam", "hdd", "ssd", "m2Nvme", "tarjetaVideo", "wifi", "bateria", "teclado", "camara"
];

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
  const [newService, setNewService] = useState({ description: "", amount: "" });
  const [showAdditionalServices, setShowAdditionalServices] = useState(false);
  const [reportNumber, setReportNumber] = useState("");
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
    diagnostico: 30,
    montoServicio: 0,
    total: 30,
    aCuenta: 0,
    saldo: 30,
    tecnicoRecepcion: currentUser?.nombre || "",
    tecnicoRecepcionId: currentUser?.uid || "",
    tecnicoTesteo: "",
    tecnicoTesteoId: "",
    tecnicoResponsable: "",
    tecnicoResponsableId: "",
    area: "",
    fecha: "",
    hora: "",
    estado: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const isEditMode = !!diagnosticoId;
  const isReportFinalized = isEditMode && ['ENTREGADO', 'TERMINADO'].includes(formData.estado);

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
        { id: "rodillos", name: "Rodillos" }, { id: "cabezal", name: "Cabezal" }, { id: "tinta", name: "Cartuchos/Tinta" }, { id: "bandejas", name: "Bandejas" }
  ];

  const getComponentDisplayName = (id) => {
    const component = ALL_COMPONENTS.find(c => c.id === id);
    return component ? component.name : id;
  };

  const getComponentOptions = (type) => {
    switch (type) {
        case 'PC':
            return ALL_COMPONENTS.filter(c => c.id !== 'bateria' && c.id !== 'cargador' && c.id !== 'pantalla' && c.id !== 'teclado' && c.id !== 'camara' && c.id !== 'microfono' && c.id !== 'parlantes' && c.id !== 'auriculares' && c.id !== 'hdmi' && c.id !== 'tipoC' && c.id !== 'touchpad' && c.id !== 'rodillos' && c.id !== 'cabezal' && c.id !== 'tinta' && c.id !== 'bandejas');
        case 'Laptop':
            return ALL_COMPONENTS.filter(c => c.id !== 'vga' && c.id !== 'lector' && c.id !== 'rodillos' && c.id !== 'cabezal' && c.id !== 'tinta' && c.id !== 'bandejas');
        case 'Allinone':
            return ALL_COMPONENTS.filter(c => c.id !== 'bateria' && c.id !== 'cargador' && c.id !== 'microfono' && c.id !== 'parlantes' && c.id !== 'auriculares' && c.id !== 'hdmi' && c.id !== 'tipoC' && c.id !== 'touchpad' && c.id !== 'lector' && c.id !== 'vga' && c.id !== 'teclado' && c.id !== 'pantalla' && c.id !== 'camara' && c.id !== 'rodillos' && c.id !== 'cabezal' && c.id !== 'tinta' && c.id !== 'bandejas');
        case 'Impresora':
            return ALL_COMPONENTS.filter(c => ['rodillos', 'cabezal', 'tinta', 'bandejas', 'otros'].includes(c.id));
        case 'Otros':
            return ALL_COMPONENTS.filter(c => !['rodillos', 'cabezal', 'tinta', 'bandejas'].includes(c.id));
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

  useEffect(() => {
    const query = new URLSearchParams(search);
    const clientIdFromUrl = query.get('clientId');

    const fetchData = async () => {
      try {
        const allClients = await getAllClientsForSelection();
        setClients(allClients);
        
        const allUsersData = await getAllUsersDetailed();
        const userOptions = allUsersData.map((u) => ({ value: u.id, label: u.nombre }));
        setUsers(userOptions);

        if (diagnosticoId) {
          const report = await getDiagnosticReportById(diagnosticoId);
          if (report) {
            const client = await getClientById(report.clientId);
            setSelectedClient({
              value: client.id,
              label: client.nombre,
              data: client,
            });
            setReportNumber(report.reportNumber.toString().padStart(6, "0"));
            
            const tecnicoTesteoOption = userOptions.find(u => u.label === report.tecnicoTesteo);
            const tecnicoResponsableOption = userOptions.find(u => u.label === report.tecnicoResponsable);

            setFormData({
              ...report,
              bitlockerKey: report.bitlockerKey || false,
              detallesPago: report.detallesPago || "",
              diagnostico: parseFloat(report.diagnostico),
              montoServicio: parseFloat(report.montoServicio),
              aCuenta: parseFloat(report.aCuenta),
              saldo: parseFloat(report.saldo),
              total: parseFloat(report.total),
              tecnicoRecepcionId: report.tecnicoRecepcionId || currentUser?.uid,
              tecnicoTesteoId: tecnicoTesteoOption?.value || report.tecnicoTesteoId || "",
              tecnicoResponsableId: tecnicoResponsableOption?.value || report.tecnicoResponsableId || "",
            });
            if (report.additionalServices) {
              setAdditionalServices(report.additionalServices);
              setShowAdditionalServices(report.hasAdditionalServices);
            }
          } else {
            toast.error("Informe no encontrado.");
          }
        } else {
          const nextReportNumber = await getNextReportNumber();
          setReportNumber(nextReportNumber.toString().padStart(6, "0"));

          if (clientIdFromUrl) {
            const client = await getClientById(clientIdFromUrl);
            if (client) {
                setSelectedClient({
                    value: client.id,
                    label: `${client.nombre} (${client.telefono})`,
                    data: client,
                });
            }
          }
        }
      } catch (error) {
        toast.error("Error al cargar datos.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [diagnosticoId, search, currentUser?.uid, currentUser?.nombre]);

  useEffect(() => {
    const totalAdicionales = additionalServices.reduce(
      (sum, service) => sum + parseFloat(service.amount),
      0
    );
    const newTotal = (parseFloat(formData.montoServicio) || 0) + totalAdicionales;
    setFormData((prev) => ({
      ...prev,
      total: newTotal,
      saldo: newTotal - (parseFloat(prev.aCuenta) || 0),
    }));
  }, [
    additionalServices,
    formData.diagnostico,
    formData.montoServicio,
    formData.aCuenta,
  ]);

  const handleInputChange = (e) => {
    if (isReportFinalized) return;
    const { name, value, type, checked } = e.target;

    if (name === "bitlockerKey" && type === "checkbox") {
        setFormData((prev) => ({
            ...prev,
            [name]: checked,
        }));
        return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentFocus = (e) => {
    if (isReportFinalized) return;
    e.target.value = '';
  };

  const handlePaymentChange = (e) => {
    if (isReportFinalized) return;
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
    if (isReportFinalized) return;

    setSelectedClient(selectedOption);
    if (isEditMode) {
      toast.error("No se puede cambiar el cliente en modo de edición.");
    }
  };

  const handleUserChange = (name, selectedOption) => {
    if (isReportFinalized) return;
    const nameKey = name;
    const idKey = `${name}Id`;
    
    setFormData((prev) => ({
      ...prev,
      [nameKey]: selectedOption ? selectedOption.label : "",
      [idKey]: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleEquipoChange = (e) => {
    if (isReportFinalized) return;
    const { value } = e.target;
    const newItems = getComponentOptions(value)?.map((item) => ({
          id: item.id,
          checked: false,
          detalles: "",
    })) || [];
    
    setFormData((prev) => ({
      ...prev,
      tipoEquipo: value,
      items: newItems,
      sistemaOperativo: "",
      bitlockerKey: false,
    }));
  };

  const handleItemCheck = (e) => {
    if (isReportFinalized) return;
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === name ? { ...item, checked } : item
      ),
    }));
  };

  const handleItemDetailsChange = (e) => {
    if (isReportFinalized) return;
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === name ? { ...item, detalles: value } : item
      ),
    }));
  };

  const handleAddService = (e) => {
    e.preventDefault();
    if (isReportFinalized) return;
    const amount = parseFloat(newService.amount);
    
    if (!newService.description || !amount || amount <= 0) {
      toast.error("Debe ingresar la descripción y un monto mayor a 0 antes de agregar un servicio adicional.");
      return;
    }

    setAdditionalServices((prev) => [
        ...prev,
        { ...newService, amount: amount.toFixed(2), id: Date.now() },
    ]);
    setNewService({ description: "", amount: "" });
  };

  const handleDeleteService = (id) => {
    if (isReportFinalized) return;
    setAdditionalServices((prev) =>
      prev.filter((service) => service.id !== id)
    );
  };


  const validateForm = () => {
    const newErrors = {};
    
    const requiredGeneralFields = [
      { field: "tipoEquipo", message: "El Tipo de Equipo es obligatorio." },
      { field: "marca", message: "La Marca es obligatoria." },
      { field: "modelo", message: "El Modelo es obligatorio." },
      { field: "serie", message: "La Serie es obligatoria." },
      { field: "motivoIngreso", message: "El Motivo de Ingreso es obligatorio." },
      { field: "observaciones", message: "Las Observaciones son obligatorias." },
      { field: "area", message: "El Área de Destino es obligatoria." },
    ];

    if (!selectedClient) {
      newErrors.client = "Seleccionar un cliente es obligatorio.";
    }

    requiredGeneralFields.forEach(({ field, message }) => {
      if (!formData[field]) {
        newErrors[field] = message;
      }
    });

    if (!formData.tecnicoTesteoId) {
        newErrors.tecnicoTesteoId = "El Técnico de Testeo es obligatorio.";
    }
    
    if (['PC', 'Laptop'].includes(formData.tipoEquipo) && !formData.sistemaOperativo) {
        newErrors.sistemaOperativo = "El Sistema Operativo es obligatorio para PC/Laptop.";
    }

    const componentValidationEnabled = !['Allinone', 'Otros', 'Impresora'].includes(formData.tipoEquipo);
    
    if (componentValidationEnabled && formData.tipoEquipo && COMPONENT_OPTIONS[formData.tipoEquipo]) {
        const availableComponentIds = COMPONENT_OPTIONS[formData.tipoEquipo].map(c => c.id);

        REQUIRED_COMPONENT_INPUTS.forEach(requiredId => {
            if (availableComponentIds.includes(requiredId)) {
                const item = formData.items.find(i => i.id === requiredId);
                
                if (item && !item.detalles) { 
                    newErrors[requiredId] = `Detalle de ${getComponentDisplayName(requiredId)} es obligatorio.`;
                }
            }
        });
    }
    
    if (!formData.montoServicio || formData.montoServicio <= 0) {
        newErrors.montoServicio = "El Monto del Servicio es obligatorio y debe ser mayor a 0.";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReportFinalized) return;
    if (!validateForm()) {
      toast.error("Por favor, completa todos los campos obligatorios.");
      return;
    }

    const finalResponsible = formData.tecnicoResponsable || formData.tecnicoTesteo;
    const finalResponsibleId = formData.tecnicoResponsableId || formData.tecnicoTesteoId;
    
    try {
      const baseData = {
        ...formData,
        tecnicoResponsable: finalResponsible,
        tecnicoResponsableId: finalResponsibleId,
        clientId: selectedClient.value,
        clientName: selectedClient.label.split('(')[0].trim(),
        telefono: selectedClient.data?.telefono,
        additionalServices: showAdditionalServices ? additionalServices : [],
        hasAdditionalServices: showAdditionalServices && additionalServices.length > 0,
        diagnostico: parseFloat(formData.diagnostico),
        montoServicio: parseFloat(formData.montoServicio),
        aCuenta: parseFloat(formData.aCuenta),
        saldo: parseFloat(formData.saldo),
        total: parseFloat(formData.total),
      };

      if(!baseData.tecnicoActual || !baseData.tecnicoActualId) {
        baseData.tecnicoActual = finalResponsible;
        baseData.tecnicoActualId = finalResponsibleId;
      }

      if (isEditMode) {
        await updateDiagnosticReport(diagnosticoId, baseData);
        toast.success(`Informe #${reportNumber} actualizado con éxito.`);
      } else {
        await createDiagnosticReport({
          ...baseData,
          reportNumber: parseInt(reportNumber),
          fecha: `${getToday.day}-${getToday.month}-${getToday.year}`,
          hora: getToday.time,
          estado: "PENDIENTE", 
        });
        toast.success(`Informe #${reportNumber} creado con éxito.`);
      }
      navigate("/ver-estado");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const isNewReport = !diagnosticoId;

  let dia, mes, anio, hora;

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

  const showTecnicoResponsable = currentUser && (currentUser.rol === 'ADMIN' || currentUser.rol === 'SUPERADMIN');

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
    
    // Simplificamos la validación para la impresión en modo de edición o si es un informe nuevo y se quiere imprimir
    if (!isEditMode && !validateForm()) {
      toast.error(
        "Por favor, completa todos los campos obligatorios antes de imprimir (sólo para nuevos informes)."
      );
      return;
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
                  <span class="font-bold">Cliente:</span> ${selectedClient?.label.split('(')[0].trim()}
                </div>
                <div>
                  <span class="font-bold">Celular:</span> ${
                    selectedClient?.data?.telefono || "N/A"
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
                    formData.modelo
                  }</div>
                  <div><span class="font-bold">Serie:</span> ${
                    formData.serie
                  }</div>
              </div>

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
                  <span class="font-bold">Motivo de Ingreso:</span> ${
                    formData.motivoIngreso
                  }
              </div>
              <div class="field">
                  <span class="font-bold">Observaciones:</span> ${
                    formData.observaciones || "Sin observaciones adicionales."
                  }
              </div>

              ${
                showAdditionalServices
                  ? `
                <div class="section-title">SERVICIOS ADICIONALES</div>
                <ul class="mb-2" style="list-style-type: disc; padding-left: 20px;">
                    ${additionalServices
                      .map((s) => `<li>${s.description} - S/ ${s.amount}</li>`)
                      .join("")}
                </ul>
              `
                  : ""
              }

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
    newWindow.print();
  };


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
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
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
          {isReportFinalized && (
            <p className="text-red-500 font-bold mt-4">
                El informe se encuentra en estado "{formData.estado}" y no puede ser modificado.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-500">
            Datos del Cliente
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Seleccionar Cliente
            </label>
            <Select
              options={clients.map((c) => ({
                value: c.id,
                label: `${c.nombre} (${c.telefono})`,
                data: c,
              }))}
              value={selectedClient}
              onChange={handleClientChange}
              placeholder="Buscar o seleccionar cliente..."
              isClearable
              isDisabled={isLoading || isEditMode || isReportFinalized}
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
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-purple-500">
            Descripción del Equipo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                disabled={isReportFinalized}
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
                disabled={isReportFinalized}
              />
              {errors.marca && (
                <p className="text-red-500 text-sm mt-1">{errors.marca}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modelo</label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                  errors.modelo ? "ring-2 ring-red-500" : ""
                }`}
                required
                disabled={isReportFinalized}
              />
              {errors.modelo && (
                <p className="text-red-500 text-sm mt-1">{errors.modelo}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Serie</label>
              <input
                type="text"
                name="serie"
                value={formData.serie}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                  errors.serie ? "ring-2 ring-red-500" : ""
                }`}
                required
                disabled={isReportFinalized}
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
            {['Allinone', 'Otros', 'Impresora'].includes(formData.tipoEquipo) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Para el tipo de equipo "{formData.tipoEquipo}", los campos de componentes son opcionales.
                </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {COMPONENT_OPTIONS[formData.tipoEquipo]?.map((item) => {
                const isRequired = REQUIRED_COMPONENT_INPUTS.includes(item.id) && !['Allinone', 'Otros', 'Impresora'].includes(formData.tipoEquipo);
                const itemDetails = formData.items.find((i) => i.id === item.id)?.detalles || "";
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
                    className={`h-4 w-4 rounded`}
                    disabled={isReportFinalized}
                  />
                  <label htmlFor={item.id} className="flex-1 text-sm flex items-center">
                    {item.name}
                    {isRequired && <FaCheckCircle className="ml-1 text-xs text-blue-500" title="Detalle obligatorio"/>}
                  </label>
                  <input
                    type="text"
                    name={item.id}
                    value={itemDetails}
                    onChange={handleItemDetailsChange}
                    className={`flex-1 p-1 text-xs border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                       isRequired && errors[item.id] ? "ring-2 ring-red-500" : ""
                    }`}
                    placeholder="Detalles"
                    disabled={isReportFinalized}
                  />
                   {isRequired && errors[item.id] && (
                        <FaTimesCircle className="text-red-500" title={errors[item.id]}/>
                   )}
                </div>
              )})}
            </div>
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
                  required={['PC', 'Laptop'].includes(formData.tipoEquipo)}
                  disabled={isReportFinalized}
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
                    disabled={isReportFinalized}
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
              disabled={isReportFinalized}
            ></textarea>
            {errors.observaciones && (
              <p className="text-red-500 text-sm mt-1">{errors.observaciones}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Motivo por el que ingresa
            </label>
            <textarea
              name="motivoIngreso"
              value={formData.motivoIngreso}
              onChange={handleInputChange}
              rows="3"
              className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                errors.motivoIngreso ? "ring-2 ring-red-500" : ""
              }`}
              required
              disabled={isReportFinalized}
            ></textarea>
            {errors.motivoIngreso && (
              <p className="text-red-500 text-sm mt-1">
                {errors.motivoIngreso}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={showAdditionalServices}
              onChange={() => setShowAdditionalServices((prev) => !prev)}
              className="h-4 w-4"
              disabled={isReportFinalized}
            />
            <label className="ml-2 text-xl font-semibold text-pink-500">
              Agregar Servicios Adicionales
            </label>
          </div>
          {showAdditionalServices && (
            <div className="mt-4">
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
                  disabled={isReportFinalized}
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
                      amount: e.target.value,
                    }))
                  }
                  className="w-full md:w-32 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                  disabled={isReportFinalized}
                />
                <button
                  type="button"
                  onClick={handleAddService}
                  className="bg-blue-500 text-white font-bold px-4 rounded-lg"
                  disabled={isReportFinalized}
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
                      {service.description} - S/ {service.amount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(service.id)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isReportFinalized}
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-red-500">
            Información de Pago
          </h2>
          
          <div className="mb-4">
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
                disabled={isReportFinalized}
              ></textarea>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Monto Servicio (S/)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                onFocus={handlePaymentFocus}
                onWheel={handleWheel}
                name="montoServicio"
                value={formData.montoServicio}
                onChange={handlePaymentChange}
                className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                  errors.montoServicio ? "ring-2 ring-red-500" : ""
                }`}
                style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                required
                disabled={isReportFinalized}
              />
              {errors.montoServicio && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.montoServicio}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Diagnóstico (S/)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                onFocus={handlePaymentFocus}
                onWheel={handleWheel}
                name="diagnostico"
                value={formData.diagnostico}
                onChange={handlePaymentChange}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                required
                disabled={isReportFinalized}
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
                disabled={isReportFinalized}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Total (S/)
              </label>
              <input
                type="number"
                name="total"
                value={formData.total}
                readOnly
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed"
                disabled={isReportFinalized}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Saldo (S/)
              </label>
              <input
                type="number"
                name="saldo"
                value={formData.saldo}
                readOnly
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed"
                disabled={isReportFinalized}
              />
            </div>
          </div>
        </div>

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
                disabled={isReportFinalized}
              />
            </div>
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
                isDisabled={isReportFinalized}
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
              {errors.tecnicoTesteoId && (
                  <p className="text-red-500 text-sm mt-1">{errors.tecnicoTesteoId}</p>
              )}
            </div>
            {showTecnicoResponsable && (
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
                    isDisabled={isReportFinalized}
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
          <div className="mt-4">
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
              disabled={isReportFinalized}
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
          </div>
        </div>

        {!isReportFinalized && (
            <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center"
            >
            {isEditMode ? (
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
    </div>
  );
}

export default Diagnostico;