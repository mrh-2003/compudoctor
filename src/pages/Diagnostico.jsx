import { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { FaPlus, FaSave, FaPrint, FaTrash, FaPen } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { createDiagnosticReport, getNextReportNumber, getAllClientsForSelection, getClientById, getDiagnosticReportById, updateDiagnosticReport } from '../services/diagnosticService';
import { getAllUsersDetailed } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function Diagnostico() {
  const { diagnosticoId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme } = useContext(ThemeContext);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [errors, setErrors] = useState({});
  const [additionalServices, setAdditionalServices] = useState([]);
  const [newService, setNewService] = useState({ description: '', amount: '' });
  const [showAdditionalServices, setShowAdditionalServices] = useState(false);
  const [reportNumber, setReportNumber] = useState('');
  const [formData, setFormData] = useState({
    tipoEquipo: '',
    marca: '',
    modelo: '',
    serie: '',
    items: [],
    sistemaOperativo: '',
    bitlockerKey: '',
    observaciones: '',
    motivoIngreso: '',
    diagnostico: 30,
    montoServicio: 0, 
    total: 30, 
    aCuenta: 0,
    saldo: 30,
    tecnicoRecepcion: currentUser?.nombre || '',
    tecnicoTesteo: '',
    tecnicoResponsable: '',
    area: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const isEditMode = !!diagnosticoId;

  const getToday = useMemo(() => {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return {
      day,
      month,
      year,
      time: `${hours}:${minutes}`,
    };
  }, []);

  const COMPONENT_OPTIONS = {
    PC: [
      { id: 'procesador', name: 'Procesador' },
      { id: 'placaMadre', name: 'Placa Madre' },
      { id: 'memoriaRam', name: 'Memoria RAM' },
      { id: 'hdd', name: 'HDD' },
      { id: 'ssd', name: 'SSD' },
      { id: 'm2Nvme', name: 'M2 Nvme' },
      { id: 'tarjetaVideo', name: 'Tarjeta de video' },
      { id: 'wifi', name: 'Wi-Fi' },
      { id: 'rj45', name: 'RJ 45' },
      { id: 'vga', name: 'VGA' },
      { id: 'usb', name: 'USB' },
      { id: 'lectora', name: 'Lectora' },
      { id: 'otros', name: 'Otros' },
    ],
    Laptop: [
      { id: 'procesador', name: 'Procesador' },
      { id: 'placaMadre', name: 'Placa Madre' },
      { id: 'memoriaRam', name: 'Memoria RAM' },
      { id: 'hdd', name: 'HDD' },
      { id: 'ssd', name: 'SSD' },
      { id: 'm2Nvme', name: 'M2 Nvme' },
      { id: 'tarjetaVideo', name: 'Tarjeta de video' },
      { id: 'wifi', name: 'Wi-Fi' },
      { id: 'bateria', name: 'Batería' },
      { id: 'cargador', name: 'Cargador' },
      { id: 'pantalla', name: 'Pantalla' },
      { id: 'teclado', name: 'Teclado' },
      { id: 'camara', name: 'Cámara' },
      { id: 'microfono', name: 'Micrófono' },
      { id: 'parlantes', name: 'Parlantes' },
      { id: 'auriculares', name: 'Auriculares' },
      { id: 'rj45', name: 'RJ 45' },
      { id: 'hdmi', name: 'HDMI' },
      { id: 'vga', name: 'VGA' },
      { id: 'usb', name: 'USB' },
      { id: 'tipoC', name: 'Tipo C' },
      { id: 'lectora', name: 'Lectora' },
      { id: 'touchpad', name: 'Touchpad' },
      { id: 'otros', name: 'Otros' },
    ],
    Allinone: [
      { id: 'procesador', name: 'Procesador' },
      { id: 'placaMadre', name: 'Placa Madre' },
      { id: 'memoriaRam', name: 'Memoria RAM' },
      { id: 'hdd', name: 'HDD' },
      { id: 'ssd', name: 'SSD' },
      { id: 'm2Nvme', name: 'M2 Nvme' },
      { id: 'tarjetaVideo', name: 'Tarjeta de video' },
      { id: 'wifi', name: 'Wi-Fi' },
      { id: 'rj45', name: 'RJ 45' },
      { id: 'usb', name: 'USB' },
      { id: 'lector', name: 'Lectora' },
      { id: 'otros', name: 'Otros' },
    ],
    Impresora: [
      { id: 'rodillos', name: 'Rodillos' },
      { id: 'cabezal', name: 'Cabezal' },
      { id: 'tinta', name: 'Cartuchos/Tinta' },
      { id: 'bandejas', name: 'Bandejas' },
      { id: 'otros', name: 'Otros' },
    ],
    Otros: [{ id: 'otros', name: 'Otros' }],
  };

  const OS_OPTIONS = ['Windows 11', 'Windows 10', 'Windows 8', 'Windows 7', 'macOS', 'Linux', 'Otro'];
  const AREA_OPTIONS = ['SOFTWARE', 'HARDWARE', 'ELECTRONICA'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allClients, allUsers] = await Promise.all([
          getAllClientsForSelection(),
          getAllUsersDetailed(),
        ]);
        setClients(allClients);
        setUsers(allUsers.map(u => ({ value: u.id, label: u.nombre })));

        if (diagnosticoId) {
          const report = await getDiagnosticReportById(diagnosticoId);
          if (report) {
            const client = await getClientById(report.clientId);
            setSelectedClient({ value: client.id, label: client.nombre, data: client });
            setReportNumber(report.reportNumber.toString().padStart(6, '0'));
            setFormData({
                ...report,
                diagnostico: parseFloat(report.diagnostico),
                montoServicio: parseFloat(report.montoServicio),
                aCuenta: parseFloat(report.aCuenta),
                saldo: parseFloat(report.saldo),
                total: parseFloat(report.total),
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
          setReportNumber(nextReportNumber.toString().padStart(6, '0'));
        }
      } catch (error) {
        toast.error("Error al cargar datos.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [diagnosticoId]);

  useEffect(() => {
    const totalAdicionales = additionalServices.reduce((sum, service) => sum + parseFloat(service.amount), 0);
    const newTotal = parseFloat(formData.montoServicio) + parseFloat(formData.diagnostico) + totalAdicionales;
    setFormData(prev => ({
      ...prev,
      total: newTotal,
      saldo: newTotal - parseFloat(prev.aCuenta),
    }));
  }, [additionalServices, formData.diagnostico, formData.montoServicio, formData.aCuenta]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [name]: numericValue,
    }));
  };

  const handleClientChange = (selectedOption) => {
    setSelectedClient(selectedOption);
    // Para modo de edición, no se puede cambiar el cliente
    if (isEditMode) {
      toast.error('No se puede cambiar el cliente en modo de edición.');
    }
  };
  
  const handleUserChange = (name, selectedOption) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedOption ? selectedOption.label : '',
    }));
  };

  const handleEquipoChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      tipoEquipo: value,
      items: COMPONENT_OPTIONS[value]?.map(item => ({ id: item.id, checked: false, detalles: '' })) || [],
      sistemaOperativo: '',
      bitlockerKey: '',
    }));
  };

  const handleItemCheck = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === name ? { ...item, checked } : item
      )
    }));
  };
  
  const handleItemDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === name ? { ...item, detalles: value } : item
      )
    }));
  };
  
  const handleAddService = (e) => {
    e.preventDefault();
    if (newService.description && newService.amount > 0) {
      setAdditionalServices(prev => [...prev, { ...newService, id: Date.now() }]);
      setNewService({ description: '', amount: '' });
    }
  };

  const handleDeleteService = (id) => {
    setAdditionalServices(prev => prev.filter(service => service.id !== id));
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['marca', 'modelo', 'motivoIngreso', 'tecnicoTesteo', 'tecnicoResponsable', 'area', 'montoServicio'];
    
    if (!selectedClient) {
        newErrors.client = 'Seleccionar un cliente es obligatorio.';
    }
    
    requiredFields.forEach(field => {
        if (!formData[field]) {
            newErrors[field] = `El campo ${field} es obligatorio.`;
        }
    });

    if (showAdditionalServices && additionalServices.length > 0) {
        if (additionalServices.some(service => !service.description || !service.amount)) {
            newErrors.additionalServices = 'Todos los servicios adicionales deben tener una descripción y un monto.';
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Por favor, completa todos los campos obligatorios.');
      return;
    }
    try {
      if (isEditMode) {
        await updateDiagnosticReport(diagnosticoId, {
            ...formData,
            clientId: selectedClient.value,
            clientName: selectedClient.label,
            telefono: selectedClient.data?.telefono,
            additionalServices: showAdditionalServices ? additionalServices : [],
            hasAdditionalServices: showAdditionalServices && additionalServices.length > 0,
        });
        toast.success(`Informe #${reportNumber} actualizado con éxito.`);
      } else {
        await createDiagnosticReport({
          ...formData,
          reportNumber: parseInt(reportNumber),
          clientId: selectedClient.value,
          clientName: selectedClient.label,
          telefono: selectedClient.data?.telefono,
          fecha: `${getToday.day}-${getToday.month}-${getToday.year}`,
          hora: getToday.time,
          additionalServices: showAdditionalServices ? additionalServices : [],
          hasAdditionalServices: showAdditionalServices && additionalServices.length > 0,
          estado: 'PENDIENTE',
        });
        toast.success(`Informe #${reportNumber} creado con éxito.`);
      }
      navigate('/ver-estado');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePrint = () => {
    if (!validateForm()) {
        toast.error('Por favor, completa todos los campos obligatorios antes de imprimir.');
        return;
    }

    const printContent = `
      <div class="p-8 font-sans">
        <style>
          .pdf-container { width: 210mm; margin: auto; padding: 20mm; font-size: 10pt; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { height: 60px; width: auto; }
          .company-info { text-align: right; font-size: 8pt; }
          .report-info { margin-top: 20px; border: 1px solid #000; padding: 10px; }
          .section-title { font-weight: bold; text-decoration: underline; margin-top: 15px; margin-bottom: 5px; }
          .field { margin-bottom: 5px; }
          .flex-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .footer { margin-top: 50px; }
          .clausula { margin-top: 10px; font-size: 8pt; }
          .firma { margin-top: 40px; text-align: center; }
          .firma-line { border-top: 1px solid #000; width: 200px; margin: 5px auto 0; }
        </style>
        <div class="pdf-container">
          <div class="header">
            <img src="/src/assets/images/compudoctor-logo.png" class="logo" />
            <div class="company-info">
              <div>Jr. Camaná 1190 - 2do piso - Ofi 203, Cercado de Lima</div>
              <div>Cel. 998 371 086 / 960 350 483</div>
              <div>Tel. 014242142</div>
              <div>compudoctor_@hotmail.com</div>
              <div>www.compudoctor.pe</div>
            </div>
          </div>
          <h1 class="text-center text-xl font-bold mt-4">INFORME TÉCNICO N° ${reportNumber}</h1>

          <div class="report-info">
            <div class="flex-row">
              <div>
                <span class="font-bold">Cliente:</span> ${selectedClient?.label}
              </div>
              <div>
                <span class="font-bold">Celular:</span> ${selectedClient?.data?.telefono || 'N/A'}
              </div>
              <div class="flex">
                <div><span class="font-bold">Día:</span> ${getToday.day}</div>
                <div class="ml-4"><span class="font-bold">Mes:</span> ${getToday.month}</div>
                <div class="ml-4"><span class="font-bold">Año:</span> ${getToday.year}</div>
                <div class="ml-4"><span class="font-bold">Hora:</span> ${getToday.time}</div>
              </div>
            </div>
            
            <div class="section-title">DESCRIPCIÓN DEL EQUIPO</div>
            <div class="flex-row">
                <div><span class="font-bold">Tipo:</span> ${formData.tipoEquipo}</div>
                <div><span class="font-bold">Marca:</span> ${formData.marca}</div>
                <div><span class="font-bold">Modelo:</span> ${formData.modelo}</div>
                <div><span class="font-bold">Serie:</span> ${formData.serie}</div>
            </div>

            <div class="section-title">COMPONENTES Y ACCESORIOS</div>
            <div class="grid grid-cols-2">
                ${formData.items.filter(item => item.checked || item.detalles).map(item => `
                    <div class="field">
                        <span class="font-bold">${item.name}:</span> ${item.detalles || 'OK'}
                    </div>
                `).join('')}
                ${formData.sistemaOperativo ? `<div class="field"><span class="font-bold">S.O.:</span> ${formData.sistemaOperativo}</div>` : ''}
                ${formData.bitlockerKey ? `<div class="field"><span class="font-bold">Bitlocker:</span> ${formData.bitlockerKey}</div>` : ''}
            </div>
            
            <div class="section-title">DETALLES DEL SERVICIO</div>
            <div class="field">
                <span class="font-bold">Motivo de Ingreso:</span> ${formData.motivoIngreso}
            </div>
            <div class="field">
                <span class="font-bold">Observaciones:</span> ${formData.observaciones || 'N/A'}
            </div>

            <div class="section-title">INFORMACIÓN DE PAGO</div>
            <div class="flex-row">
                <div><span class="font-bold">Diagnóstico:</span> S/ ${formData.diagnostico.toFixed(2)}</div>
                <div><span class="font-bold">Monto Servicio:</span> S/ ${formData.montoServicio.toFixed(2)}</div>
                <div><span class="font-bold">Total:</span> S/ ${formData.total.toFixed(2)}</div>
                <div><span class="font-bold">A Cuenta:</span> S/ ${formData.aCuenta.toFixed(2)}</div>
                <div><span class="font-bold">Saldo:</span> S/ ${formData.saldo.toFixed(2)}</div>
            </div>

            ${showAdditionalServices ? `
              <div class="section-title">SERVICIOS ADICIONALES</div>
              <ul>
                  ${additionalServices.map(s => `<li>${s.description}: S/ ${s.amount}</li>`).join('')}
              </ul>
            ` : ''}

            <div class="section-title">TÉCNICOS</div>
            <div class="flex-row">
                <div><span class="font-bold">Técnico Recepción:</span> ${formData.tecnicoRecepcion}</div>
                <div><span class="font-bold">Técnico Testeo:</span> ${formData.tecnicoTesteo}</div>
                <div><span class="font-bold">Técnico Responsable:</span> ${formData.tecnicoResponsable}</div>
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
      </div>
    `;

    const newWindow = window.open('', '', 'width=800,height=600');
    newWindow.document.write(printContent);
    newWindow.document.close();
    newWindow.focus();
    newWindow.print();
  };
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Recepción y Diagnóstico de Equipos</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700">
          <span className="font-bold text-lg">Informe Técnico N° {reportNumber}</span>
          <button type="button" onClick={handlePrint} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center">
            <FaPrint className="mr-2" /> Imprimir
          </button>
        </div>

        {/* Datos del Cliente */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-500">Datos del Cliente</h2>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Seleccionar Cliente</label>
            <Select
              options={clients.map(c => ({ value: c.id, label: `${c.nombre} (${c.telefono})`, data: c }))}
              value={selectedClient}
              onChange={handleClientChange}
              placeholder="Buscar o seleccionar cliente..."
              isClearable
              isDisabled={isLoading || isEditMode}
              className={`${errors.client ? 'ring-2 ring-red-500' : ''}`}
              styles={{
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
              }}
            />
            {errors.client && <p className="text-red-500 text-sm mt-1">{errors.client}</p>}
          </div>
        </div>

        {/* Descripción del Equipo */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-purple-500">Descripción del Equipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Equipo</label>
              <select name="tipoEquipo" value={formData.tipoEquipo} onChange={handleEquipoChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                <option value="">Selecciona un tipo</option>
                {Object.keys(COMPONENT_OPTIONS).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Marca</label>
              <input type="text" name="marca" value={formData.marca} onChange={handleInputChange} className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.marca ? 'ring-2 ring-red-500' : ''}`} required />
              {errors.marca && <p className="text-red-500 text-sm mt-1">{errors.marca}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modelo</label>
              <input type="text" name="modelo" value={formData.modelo} onChange={handleInputChange} className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.modelo ? 'ring-2 ring-red-500' : ''}`} required />
              {errors.modelo && <p className="text-red-500 text-sm mt-1">{errors.modelo}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Serie</label>
              <input type="text" name="serie" value={formData.serie} onChange={handleInputChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
          </div>
        </div>

        {/* Componentes del equipo */}
        {formData.tipoEquipo && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-green-500">Componentes y Accesorios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMPONENT_OPTIONS[formData.tipoEquipo]?.map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name={item.id}
                    id={item.id}
                    checked={formData.items.find(i => i.id === item.id)?.checked || false}
                    onChange={handleItemCheck}
                    className={`h-4 w-4 rounded ${errors[item.id] ? 'ring-2 ring-red-500' : ''}`}
                  />
                  <label htmlFor={item.id} className="flex-1 text-sm">{item.name}</label>
                  <input
                    type="text"
                    name={item.id}
                    value={formData.items.find(i => i.id === item.id)?.detalles || ''}
                    onChange={handleItemDetailsChange}
                    className="flex-1 p-1 text-xs border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Detalles"
                  />
                  {errors[item.id] && <p className="text-red-500 text-sm mt-1">{errors[item.id]}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Software y Seguridad */}
        {(formData.tipoEquipo === 'PC' || formData.tipoEquipo === 'Laptop' || formData.tipoEquipo === 'Allinone') && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-orange-500">Software y Seguridad</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sistema Operativo</label>
                <select name="sistemaOperativo" value={formData.sistemaOperativo} onChange={handleInputChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                  <option value="">Selecciona un SO</option>
                  {OS_OPTIONS.map(os => (
                    <option key={os} value={os}>{os}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Clave de Bitlocker</label>
                <input type="text" name="bitlockerKey" value={formData.bitlockerKey} onChange={handleInputChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>
          </div>
        )}

        {/* Observaciones y Motivo */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-yellow-500">Detalles del Servicio</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Motivo por el que ingresa</label>
            <textarea name="motivoIngreso" value={formData.motivoIngreso} onChange={handleInputChange} rows="3" className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.motivoIngreso ? 'ring-2 ring-red-500' : ''}`} required></textarea>
            {errors.motivoIngreso && <p className="text-red-500 text-sm mt-1">{errors.motivoIngreso}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} rows="3" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
          </div>
        </div>

        {/* Información de Pagos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-red-500">Información de Pago</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monto Servicio (S/)</label>
              <input type="number" name="montoServicio" value={formData.montoServicio} onChange={handlePaymentChange} className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.montoServicio ? 'ring-2 ring-red-500' : ''}`} required />
              {errors.montoServicio && <p className="text-red-500 text-sm mt-1">{errors.montoServicio}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Diagnóstico (S/)</label>
              <input type="number" name="diagnostico" value={formData.diagnostico} onChange={handlePaymentChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">A Cuenta (S/)</label>
              <input type="number" name="aCuenta" value={formData.aCuenta} onChange={handlePaymentChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total (S/)</label>
              <input type="number" name="total" value={formData.total} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Saldo (S/)</label>
              <input type="number" name="saldo" value={formData.saldo} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Servicios Adicionales */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <div className="flex items-center mb-4">
            <input type="checkbox" checked={showAdditionalServices} onChange={() => setShowAdditionalServices(prev => !prev)} className="h-4 w-4" />
            <label className="ml-2 text-xl font-semibold text-pink-500">Agregar Servicios Adicionales</label>
          </div>
          {showAdditionalServices && (
            <div className="mt-4">
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Descripción del servicio"
                  value={newService.description}
                  onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="number"
                  placeholder="Monto (S/)"
                  value={newService.amount}
                  onChange={(e) => setNewService(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full md:w-32 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                <button type="button" onClick={handleAddService} className="bg-blue-500 text-white font-bold px-4 rounded-lg">
                  <FaPlus />
                </button>
              </div>
              {errors.additionalServices && <p className="text-red-500 text-sm mt-1">{errors.additionalServices}</p>}
              <ul className="space-y-1">
                {additionalServices.map(service => (
                  <li key={service.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                    <span>{service.description} - S/ {service.amount}</span>
                    <button type="button" onClick={() => handleDeleteService(service.id)} className="text-red-500 hover:text-red-700">
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Técnicos y Área */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-indigo-500">Asignación de Personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Técnico de Recepción</label>
              <input type="text" value={formData.tecnicoRecepcion} readOnly className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Técnico de Testeo</label>
              <Select
                options={users}
                value={users.find(u => u.label === formData.tecnicoTesteo)}
                onChange={(option) => handleUserChange('tecnicoTesteo', option)}
                placeholder="Selecciona un técnico..."
                className={`${errors.tecnicoTesteo ? 'ring-2 ring-red-500' : ''}`}
                styles={{
                    control: (baseStyles) => ({ ...baseStyles, backgroundColor: theme === 'dark' ? '#374151' : '#fff', borderColor: theme === 'dark' ? '#4B5563' : baseStyles.borderColor }),
                    singleValue: (baseStyles) => ({ ...baseStyles, color: theme === 'dark' ? '#fff' : '#000' }),
                    menu: (baseStyles) => ({ ...baseStyles, backgroundColor: theme === 'dark' ? '#374151' : '#fff' }),
                    option: (baseStyles, state) => ({ ...baseStyles, backgroundColor: state.isFocused ? (theme === 'dark' ? '#4B5563' : '#e5e7eb') : 'transparent', color: theme === 'dark' ? '#fff' : '#000' }),
                }}
              />
              {errors.tecnicoTesteo && <p className="text-red-500 text-sm mt-1">{errors.tecnicoTesteo}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Técnico Responsable</label>
              <Select
                options={users}
                value={users.find(u => u.label === formData.tecnicoResponsable)}
                onChange={(option) => handleUserChange('tecnicoResponsable', option)}
                placeholder="Selecciona un técnico..."
                className={`${errors.tecnicoResponsable ? 'ring-2 ring-red-500' : ''}`}
                styles={{
                    control: (baseStyles) => ({ ...baseStyles, backgroundColor: theme === 'dark' ? '#374151' : '#fff', borderColor: theme === 'dark' ? '#4B5563' : baseStyles.borderColor }),
                    singleValue: (baseStyles) => ({ ...baseStyles, color: theme === 'dark' ? '#fff' : '#000' }),
                    menu: (baseStyles) => ({ ...baseStyles, backgroundColor: theme === 'dark' ? '#374151' : '#fff' }),
                    option: (baseStyles, state) => ({ ...baseStyles, backgroundColor: state.isFocused ? (theme === 'dark' ? '#4B5563' : '#e5e7eb') : 'transparent', color: theme === 'dark' ? '#fff' : '#000' }),
                }}
              />
              {errors.tecnicoResponsable && <p className="text-red-500 text-sm mt-1">{errors.tecnicoResponsable}</p>}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Área de Destino</label>
            <select name="area" value={formData.area} onChange={handleInputChange} className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${errors.area ? 'ring-2 ring-red-500' : ''}`}>
              <option value="">Selecciona un área</option>
              {AREA_OPTIONS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
          </div>
        </div>
        
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
          {isEditMode ? <><FaPen className="mr-2" /> Actualizar Informe Técnico</> : <><FaSave className="mr-2" /> Guardar Informe Técnico</>}
        </button>
      </form>
    </div>
  );
}

export default Diagnostico;