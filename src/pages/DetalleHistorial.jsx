import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getDiagnosticReportById, updateDiagnosticReport } from '../services/diagnosticService';
import { FaArrowLeft, FaCheckCircle, FaTrash, FaPlus, FaPrint } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import ReadOnlyAreaHistory from '../components/common/ReadOnlyAreaHistory';
import ReadOnlyReportHeader from '../components/common/ReadOnlyReportHeader';
import logo from '../assets/images/compudoctor-logo.png';

const OTHER_EQUIPMENT_OPTIONS = [
    { value: "", label: "Selecciona el componente principal" },
    { value: "TARJETA_VIDEO", label: "Tarjeta de Video" },
    { value: "PLACA_MADRE_LAPTOP", label: "Placa Madre Laptop" },
    { value: "PLACA_MADRE_PC", label: "Placa Madre PC" },
    { value: "OTRO_DESCRIPCION", label: "Otro (Especificar)" },
];

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
const DOC_TYPES = [
    'Boleta Fisica',
    'Boleta Electronica',
    'Factura de Venta',
    'Factura Compra',
    'Boleta Compra',
    'Guia Interna Compra'
];

function DetalleHistorial() {
    const { reportId } = useParams();
    const { currentUser } = useAuth();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const location = useLocation();
    const backPath = location.pathname.includes('bandeja-tecnico') ? '/bandeja-tecnico' : '/ver-estado';
    const [observacionEntrega, setObservacionEntrega] = useState('');

    // Estados para documentos de venta/compra
    const [deliveryDocuments, setDeliveryDocuments] = useState([]);
    const [newDoc, setNewDoc] = useState({ type: DOC_TYPES[0], description: '', number: '' });

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

    const handleOpenDeliveryModal = () => {
        setDeliveryDocuments([]);
        setNewDoc({ type: DOC_TYPES[0], description: '', number: '' });
        setIsDeliveryModalOpen(true);
    };

    const handleCloseDeliveryModal = () => {
        setIsDeliveryModalOpen(false);
        setObservacionEntrega('');
        setDeliveryDocuments([]);
    };

    const handleAddDocument = () => {
        if (!newDoc.type || !newDoc.description || !newDoc.number) {
            toast.error('Por favor complete todos los campos del documento.');
            return;
        }
        setDeliveryDocuments([...deliveryDocuments, { ...newDoc, id: Date.now() }]);
        setNewDoc({ type: DOC_TYPES[0], description: '', number: '' });
    };

    const handleRemoveDocument = (id) => {
        setDeliveryDocuments(deliveryDocuments.filter(doc => doc.id !== id));
    };

    const handleDeliverEquipment = async (e) => {
        e.preventDefault();
        try {
            const now = new Date();
            const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
            const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            // Validación para Administradores (rol ADMIN)
            if (currentUser?.rol === 'ADMIN' && deliveryDocuments.length === 0) {
                toast.error('Para los administradores es obligatorio registrar al menos un comprobante.');
                return;
            }

            const updatedData = {
                estado: 'ENTREGADO',
                fechaEntrega: formattedDate,
                horaEntrega: formattedTime,
                tecnicoEntrega: currentUser?.nombre || 'N/A',
                observacionEntrega: observacionEntrega || '',
                documentosVentaCompra: deliveryDocuments
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

    const handlePrint = () => {
        if (!report) return;

        const clientDisplay = report.clientName || "Cliente no registrado";
        const clientPhone = report.telefono || "N/A";

        let dia, mes, anio, hora;
        if (report.fecha) {
            [dia, mes, anio] = report.fecha.split("-");
        } else {
            dia = ""; mes = ""; anio = "";
        }
        hora = report.hora || "";

        const getCheckItemData = (id) => {
            const item = (report.items || []).find(i => i.id === id);
            const isChecked = item?.checked || false;
            let detailText = (item?.detalles && item.detalles.trim() !== '') ? item.detalles : '';
            return { isChecked, detailText };
        }

        const getObservaciones = () => {
            let obs = report.observaciones || "";
            const notes = [];
            if (report.sistemaOperativo) notes.push(`S.O: ${report.sistemaOperativo}`);
            if (report.bitlockerKey) notes.push("Bitlocker: SI");

            if (notes.length > 0) {
                obs += " | " + notes.join(". ");
            }
            return obs;
        };

        const servicesList = report.servicesList || [];
        const additionalServices = report.additionalServices || [];

        const motivoText = servicesList.map(s => {
            const specDisplay = s.specification ? ` [${s.specification}]` : '';
            return `${s.service}${specDisplay} (S/${s.amount})`;
        }).join(', ') + (additionalServices.length > 0 ? ', ' + additionalServices.map(s => s.description).join(', ') : '');

        const otherComponentType = report.otherComponentType;
        const otherDescription = report.otherDescription;
        const otherTypeDesc = otherComponentType === 'OTRO_DESCRIPCION' ? otherDescription : (OTHER_EQUIPMENT_OPTIONS.find(o => o.value === otherComponentType)?.label || '');

        const printContent = `
            <html>
                <head>
                    <title>Informe Técnico ${report.reportNumber}</title>
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
                        .text-block { width: 100%; border: 1px solid #000; padding: 6px; font-size: 9pt; min-height: 40px; border-radius: 4px; }

                        .financials { display: flex; justify-content: space-between; margin: 10px 0; padding: 0 20px; }
                        .money-box { display: flex; align-items: center; border: 1px solid #000; padding: 4px 8px; border-radius: 6px; width: 22%; }
                        .money-label { font-weight: 800; margin-right: 5px; font-size: 9pt; white-space: nowrap; }
                        .money-value { font-weight: normal; flex-grow: 1; text-align: right; font-size: 10pt; }

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
                                <div class="report-title">INFORME TÉCNICO <span style="float:right; font-size:10pt; margin-top:2px">N° ${report.reportNumber}</span></div>
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
                                <span>PC <div class="checkbox-box ${report.tipoEquipo === 'PC' ? 'checked' : ''}"></div></span>
                                <span>Laptop <div class="checkbox-box ${report.tipoEquipo === 'Laptop' ? 'checked' : ''}"></div></span>
                                <span>All in one <div class="checkbox-box ${report.tipoEquipo === 'All in one' ? 'checked' : ''}"></div></span>
                                <span>Impresora <div class="checkbox-box ${report.tipoEquipo === 'Impresora' ? 'checked' : ''}"></div></span>
                                <span>Otros <div class="checkbox-box ${report.tipoEquipo === 'Otros' ? 'checked' : ''}"></div>
                                    <span class="other-detail">${report.tipoEquipo === 'Otros' ? otherTypeDesc : ''}</span>
                                </span>
                            </div>
                            <div class="equip-details">
                                 <div class="line-input">
                                    <span class="line-label">MARCA:</span>
                                    <span class="line-value">${report.marca || ''}</span>
                                </div>
                                <div class="line-input">
                                    <span class="line-label">MODELO:</span>
                                    <span class="line-value">${report.modelo || ''}</span>
                                </div>
                                <div class="line-input">
                                    <span class="line-label">SERIE:</span>
                                    <span class="line-value">${report.serie || ''}</span>
                                </div>
                                 <div class="line-input" style="flex-grow: 0; min-width: 100px;">
                                    <span class="line-label">¿Enciende?:</span>
                                    <span class="line-value">${report.canTurnOn || 'N/A'}</span>
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
                             <div class="money-box" style="width: 24%">
                                <span class="money-label" style="font-size: 8pt;">DIAGNOSTICO</span>
                                <span class="money-value">${(parseFloat(report.diagnostico) || 0).toFixed(2)}</span>
                            </div>
                            <div class="money-box" style="width: 24%">
                                <span class="money-label" style="font-size: 8pt;">SERV. ADIC.</span>
                                <span class="money-value">${(parseFloat(report.total) - parseFloat(report.montoServicio) - parseFloat(report.diagnostico)).toFixed(2)}</span>
                            </div>
                            <div class="money-box" style="width: 24%">
                                <span class="money-label" style="font-size: 8pt;">A CUENTA</span>
                                <span class="money-value">${(parseFloat(report.aCuenta) || 0).toFixed(2)}</span>
                            </div>
                            <div class="money-box" style="width: 24%">
                                <span class="money-label" style="font-size: 8pt;">SALDO</span>
                                <span class="money-value">${(parseFloat(report.saldo) || 0).toFixed(2)}</span>
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

                        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px dashed #ccc; font-size: 8pt;">
                           <div style="font-weight: bold; text-decoration: underline; margin-bottom: 6px;">PERSONAL ASIGNADO:</div>
                           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                              <div><strong>Técnico de Recepción:</strong> ${report.tecnicoRecepcion || ''}</div>
                              <div><strong>Técnico Inicial:</strong> ${report.tecnicoInicial || ''}</div>
                              <div><strong>Técnico de Testeo:</strong> ${report.tecnicoTesteo || ''}</div>
                              <div><strong>Técnico Responsable:</strong> ${report.tecnicoResponsable || ''}</div>
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
            newWindow.close();
        }, 500);
    };

    const handlePrintServiceSheet = () => {
        if (!report) return;

        const getLastEntry = (area) => {
            const entries = report.diagnosticoPorArea?.[area];
            if (!entries || entries.length === 0) return null;
            return entries[entries.length - 1]; // Get the last entry
        };

        const hw = getLastEntry('HARDWARE');
        const sw = getLastEntry('SOFTWARE');
        const elec = getLastEntry('ELECTRONICA');
        const testeo = getLastEntry('TESTEO');

        // Styles helpers
        const checkbox = (val) => val ? '☑' : '☐';
        const txt = (val) => val || '';

        // Helper to formatting lines for Hardware/Software/Electronica
        const formatItem = (checked, label, detailLabel, detailValue) => {
            return `
                <div class="item-row">
                    <div class="item-check">${checkbox(checked)}</div>
                    <div class="item-label">${label}</div>
                    ${detailLabel ? `<div class="item-detail"><span class="detail-label">${detailLabel}:</span> <span class="detail-value">${txt(detailValue)}</span></div>` : ''}
                </div>
            `;
        };

        // Helper for Testeo rows
        const formatTestRow = (label, statusValue, obs) => {
            const isSi = statusValue === 'SI';
            const isNo = statusValue === 'NO';
            return `
                <div class="test-row">
                     <div class="test-label">${label}</div>
                     <div class="test-status">
                        Funciona SI <div class="box">${isSi ? 'X' : ''}</div>
                        NO <div class="box">${isNo ? 'X' : ''}</div>
                     </div>
                     <div class="test-obs">Obs: <span>${txt(obs)}</span></div>
                </div>
             `;
        };

        const clientDisplay = report.clientName || "Cliente no registrado";
        const modelDisplay = `${report.tipoEquipo || ''} ${report.marca || ''} ${report.modelo || ''}`;

        const printContent = `
            <html>
            <head>
                <title>Ficha de Servicio - ${report.reportNumber}</title>
                <style>
                     @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap');
                    @page { size: portrait; margin: 0.8cm; }
                    body { font-family: 'Roboto', sans-serif; font-size: 8.5pt; padding: 0; box-sizing: border-box; }
                    
                    .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    .field-box { display: flex; align-items: center; margin-bottom: 2px; }
                    .field-label { font-weight: bold; width: 110px; font-size: 8pt; }
                    .field-input { border-bottom: 1px solid #000; flex-grow: 1; padding: 0 5px; min-height: 16px; font-weight: bold; font-size: 9pt; }
                    
                    /* Main layout grid */
                    .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
                    .col-left { display: flex; flex-direction: column; }
                    .col-right { display: flex; flex-direction: column; gap: 8px; }

                    .area-box { border: 2px solid #000; height: 100%; display: flex; flex-direction: column; }
                    .area-box-fixed { border: 2px solid #000; }
                    
                    .area-header { text-align: center; font-weight: bold; font-size: 9pt; background: #eee; border-bottom: 1px solid #000; padding: 2px; text-transform: uppercase; }
                    .area-content { padding: 4px; flex-grow: 1; }
                    .area-sub { text-align: center; font-size: 7.5pt; font-weight: bold; margin-bottom: 3px; color: #444; }
                    
                    .item-row { display: flex; align-items: center; margin-bottom: 1px; font-size: 8pt; line-height: 1.1; }
                    .item-check { font-size: 11pt; margin-right: 4px; width: 14px; }
                    .item-label { font-weight: bold; margin-right: 4px; white-space: nowrap; font-size: 8pt; }
                    .item-detail { display: flex; align-items: center; flex-grow: 1; overflow: hidden; }
                    .detail-label { margin-right: 2px; font-size: 7pt; color: #555; }
                    .detail-value { border-bottom: 1px solid #999; flex-grow: 1; min-height: 12px; padding-left: 2px; font-size: 8pt; }

                    /* Tech Dates compact */
                    .tech-dates { border-top: 1px dashed #000; margin-top: 4px; padding-top: 2px; display: flex; flex-wrap: wrap; gap: 8px; font-size: 7.5pt; color: #333; }
                    
                    /* Equip type checkboxes */
                    .equip-check { display:flex; justify-content:center; gap:8px; margin-bottom:4px; font-weight:bold; font-size:7.5pt; border-bottom: 1px solid #eee; padding-bottom: 2px; }

                    /* Testeo section */
                    .test-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 2px; }
                    .test-row { display: flex; align-items: center; margin-bottom: 1px; font-size: 7.5pt; }
                    .test-label { width: 65px; font-weight: bold; }
                    .test-status { display: flex; align-items: center; width: 120px; font-size: 7pt; }
                    .test-status .box { border: 1px solid #000; width: 9px; height: 9px; margin: 0 3px; display: flex; align-items: center; justify-content: center; font-size: 7px; line-height: 1; }
                    .test-obs { display: flex; align-items: center; flex-grow: 1; }
                    .test-obs span { border-bottom: 1px solid #ccc; flex-grow: 1; min-height: 11px; margin-left: 2px; color: #000; }
                    
                    /* Specs row in testeo */
                    .spec-row { display: flex; margin-bottom: 2px; font-size: 8pt; align-items: center; }
                    .spec-row label { font-weight: bold; margin-right: 4px; font-size: 7.5pt; }
                    .spec-row span { border-bottom: 1px solid #999; flex-grow: 1; font-weight: normal; }

                    .bottom-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 2px; font-size: 6.5pt; margin-top: 2px; padding: 2px; border-top: 1px solid #eee; }
                    .bottom-item { display: flex; flex-direction: column; }
                    .bottom-sub-row { display: flex; align-items: center; }
                    
                    .warning-bar { background: #fee; border: 1px solid #f00; text-align: center; font-weight: bold; font-size: 7pt; padding: 2px; margin: 5px 0; color: #d00; }
                    
                    .payment-box { border: 1px solid #000; padding: 4px 8px; margin-top: 5px; border-radius: 4px; }
                    .payment-title { font-weight: bold; font-size: 8pt; margin-bottom: 2px; text-decoration: underline; }
                    .payment-method { font-size: 9pt; }
                    
                    .totals-row { display: flex; margin-top: 8px; gap: 15px; justify-content: flex-end; }
                    .total-bubble { border: 2px solid #000; border-radius: 6px; padding: 4px 10px; font-weight: bold; min-width: 90px; display: flex; justify-content: space-between; align-items: center; font-size: 9pt; background: #fff; }

                    /* Repotenciacion box inside hardware */
                    .repoten-box { margin-top:5px; background: #f9f9f9; border: 1px solid #ccc; padding: 3px; border-radius: 4px; }
                    .repoten-title { font-weight:bold; font-size:7.5pt; margin-bottom: 2px; text-decoration: underline; }
                </style>
            </head>
            <body>
                 <div class="header-grid">
                    <div>
                        <div class="field-box"><span class="field-label">CLIENTE:</span> <div class="field-input">${clientDisplay.substring(0, 45)}</div></div>
                        <div class="field-box"><span class="field-label">INFORME N°:</span> <div class="field-input">${report.reportNumber}</div></div>
                    </div>
                    <div>
                        <div class="field-box"><span class="field-label">EQUIPO / MODELO:</span> <div class="field-input">${modelDisplay}</div></div>
                        <div class="field-box"><span class="field-label">SERIE:</span> <div class="field-input">${report.serie || ''}</div></div>
                    </div>
                 </div>

                 <div class="main-grid">
                    <!-- LEFT COL: HARDWARE -->
                    <div class="col-left">
                        <div class="area-box">
                            <div class="area-header">HARDWARE</div>
                            
                            <div class="area-content">
                                ${hw ? `
                                    <div class="equip-check">
                                        <span>PC ${checkbox(report.tipoEquipo === 'PC')}</span>
                                        <span>LAPTOP ${checkbox(report.tipoEquipo === 'Laptop')}</span>
                                        <span>OTRO ${checkbox(!['PC', 'Laptop'].includes(report.tipoEquipo))}</span>
                                    </div>

                                    ${formatItem(hw.mant_hardware, 'Mant. Hardware')}
                                    ${formatItem(hw.reconstruccion, 'Reconstrucción')}
                                    ${formatItem(hw.adapt_parlantes, 'Adapt. Parlantes')}
                                    ${formatItem(hw.cambio_teclado, 'Cambio Teclado', 'Cód', hw.cambio_teclado_codigo)}
                                    ${formatItem(hw.cambio_pantalla, 'Cambio Pantalla', 'Det', `${txt(hw.cambio_pantalla_codigo)} ${txt(hw.cambio_pantalla_resolucion)}`)}
                                    ${formatItem(hw.cambio_carcasa, 'Cambio Carcasa', 'Obs', hw.cambio_carcasa_obs)}
                                    ${formatItem(hw.cambio_placa, 'Cambio Placa', 'Det', `${txt(hw.cambio_placa_codigo)} ${txt(hw.cambio_placa_especif)}`)}
                                    ${formatItem(hw.cambio_fuente, 'Cambio Fuente', 'Det', `${txt(hw.cambio_fuente_codigo)} ${txt(hw.cambio_fuente_especif)}`)}
                                    ${formatItem(hw.cambio_video, 'Cambio T. Video', 'Det', `${txt(hw.cambio_video_codigo)} ${txt(hw.cambio_video_especif)}`)}
                                    ${formatItem(hw.otros, 'Otros', 'Esp', hw.otros_especif)}
                                    
                                    <div class="repoten-box">
                                        <div class="repoten-title">Repotenciación / Upgrade</div>
                                        ${formatItem(hw.repoten_ssd, 'SSD', 'GB/Serie', `${txt(hw.repoten_ssd_gb)} ${txt(hw.repoten_ssd_serie)}`)}
                                        ${formatItem(hw.repoten_nvme, 'NVME', 'GB/Serie', `${txt(hw.repoten_nvme_gb)} ${txt(hw.repoten_nvme_serie)}`)}
                                        ${formatItem(hw.repoten_m2, 'M2 SATA', 'GB/Serie', `${txt(hw.repoten_m2_gb)} ${txt(hw.repoten_m2_serie)}`)}
                                        ${formatItem(hw.repoten_ram, 'RAM', 'Cap/Cod', `${txt(hw.repoten_ram_cap)} ${txt(hw.repoten_ram_cod)}`)}
                                    </div>
                                    
                                    <div class="tech-dates">
                                        <div><strong>Tec:</strong> ${txt(hw.tecnico)}</div>
                                        <div><strong>Fin:</strong> ${txt(hw.fecha_fin)}</div>
                                    </div>
                                ` : '<div style="text-align:center; padding:20px; color:#777;">Sin intervención registrada</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT COL: SOFTWARE + ELECTRONICA -->
                    <div class="col-right">
                        <!-- SOFTWARE SECTION -->
                        <div class="area-box" style="height: auto;">
                            <div class="area-header">SOFTWARE</div>
                            <div class="area-content">
                                ${sw ? `
                                    <div class="equip-check">
                                        <span style="font-weight:normal">Sistema Operativo: <strong>${report.sistemaOperativo || 'N/A'}</strong></span>
                                    </div>
                                    ${formatItem(sw.backup, 'Backup Info', 'Obs', sw.backup_obs)}
                                    ${formatItem(sw.clonacion, 'Clonación Disco', 'Obs', sw.clonacion_obs)}
                                    ${formatItem(sw.formateo, 'Formateo + Progs', 'Obs', sw.formateo_obs)}
                                    ${formatItem(sw.drivers, 'Inst. Drivers', 'Obs', sw.drivers_obs)}
                                    ${formatItem(sw.diseno, 'Progs. Diseño', 'Esp', sw.diseno_spec)}
                                    ${formatItem(sw.ingenieria, 'Progs. Ingeniería', 'Esp', sw.ingenieria_spec)}
                                    ${formatItem(sw.act_win, 'Act. Windows', 'Obs', sw.act_win_obs)}
                                    ${formatItem(sw.act_office, 'Act. Office', 'Obs', sw.act_office_obs)}
                                    ${formatItem(sw.optimizacion, 'Optimización', 'Obs', sw.optimizacion_obs)}
                                    ${formatItem(sw.sw_otros, 'Otros', 'Esp', sw.sw_otros_spec)}

                                    <div class="tech-dates">
                                        <div><strong>Tec:</strong> ${txt(sw.tecnico)}</div>
                                        <div><strong>Fin:</strong> ${txt(sw.fecha_fin)}</div>
                                    </div>
                                ` : '<div style="text-align:center; padding:20px; color:#777;">Sin intervención registrada</div>'}
                            </div>
                        </div>

                        <!-- ELECTRONICA SECTION (Stacked below Software) -->
                        <div class="area-box" style="flex-grow: 1;">
                            <div class="area-header">ELECTRÓNICA</div>
                            <div class="area-content">
                                ${elec ? `
                                    ${formatItem(elec.elec_video, 'TARJETA VIDEO', 'Reparable', elec.elec_video_reparable)}
                                    ${formatItem(elec.elec_placa, 'PLACA MADRE', 'Reparable', elec.elec_placa_reparable)}
                                    ${formatItem(elec.elec_otro, 'OTRO COMPONENTE', 'Esp', `${txt(elec.elec_otro_especif || '-')}`)}
                                    
                                    <div style="margin-top:8px; font-size:8pt; border:1px solid #ddd; padding:3px; background:#fcfcfc;">
                                         <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                                            <span><strong>Reparable:</strong> ${elec.elec_otro_reparable || '-'}</span>
                                            <span><strong>Etapa:</strong> ${txt(elec.elec_etapa)}</span>
                                         </div>
                                         <div style="border-top:1px solid #eee; padding-top:2px;"><strong>Obs:</strong> ${txt(elec.elec_obs)}</div>
                                    </div>
                                    <div class="tech-dates">
                                        <div><strong>Tec:</strong> ${txt(elec.tecnico)}</div>
                                        <div><strong>Fin:</strong> ${txt(elec.fecha_fin)}</div>
                                    </div>
                                ` : '<div style="text-align:center; padding:15px; color:#777; font-size:8pt;">Sin intervención registrada</div>'}
                            </div>
                        </div>
                    </div>
                 </div>

                 <!-- WARNING BAR -->
                 <div class="warning-bar">
                    OBSERVACIONES: SI AL REALIZAR EL TESTEO TIENE ALGUN DETALLE ESPECIFICAR "OJO"
                 </div>

                 <!-- TESTEO (Bottom Full Width) -->
                 <div class="area-box-fixed">
                    <div class="area-header">CONTROL DE CALIDAD (TESTEO FINAL)</div>
                    <div class="area-content">
                    ${testeo ? `
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom:5px; border-bottom:1px solid #ccc; padding-bottom:5px;">
                            <div class="spec-row"><label>Proc:</label><span>${txt(testeo.testeo_procesador)}</span></div>
                            <div class="spec-row"><label>Vid. Ded:</label><span>${txt(testeo.testeo_video_dedicado)}</span></div>
                            <div class="spec-row"><label>RAM:</label><span>${txt(testeo.testeo_memoria_ram)}</span></div>
                        </div>
                        <div class="test-grid">
                            <div>
                                ${formatTestRow('Disco', testeo.testeo_disco, testeo.testeo_disco_obs)}
                                ${formatTestRow('Pantalla', testeo.testeo_pantalla, testeo.testeo_pantalla_obs)}
                                ${formatTestRow('Bateria', testeo.testeo_bateria, testeo.testeo_bateria_obs)}
                                ${formatTestRow('Cargador', testeo.testeo_cargador, testeo.testeo_cargador_obs)}
                                ${formatTestRow('Camara', testeo.testeo_camara, testeo.testeo_camara_obs)}
                                ${formatTestRow('Microfono', testeo.testeo_microfono, testeo.testeo_microfono_obs)}
                            </div>
                            <div>
                                ${formatTestRow('Auricular', testeo.testeo_auricular, testeo.testeo_auricular_obs)}
                                ${formatTestRow('Parlantes', testeo.testeo_parlantes, testeo.testeo_parlantes_obs)}
                                ${formatTestRow('Teclado', testeo.testeo_teclado, testeo.testeo_teclado_obs)}
                                ${formatTestRow('Lectora', testeo.testeo_lectora, testeo.testeo_lectora_obs)}
                                ${formatTestRow('Touchpad', testeo.testeo_touchpad, testeo.testeo_touchpad_obs)}
                            </div>
                        </div>
                        <div class="bottom-grid">
                            <div class="bottom-sub-row"><strong>WIFI: </strong> ${formatTestRow('', testeo.testeo_wifi, testeo.testeo_wifi_obs)}</div>
                            <div class="bottom-sub-row"><strong>USB: </strong> ${formatTestRow('', testeo.testeo_usb, testeo.testeo_usb_obs)}</div>
                            <div class="bottom-sub-row"><strong>HDMI: </strong> ${formatTestRow('', testeo.testeo_hdmi, testeo.testeo_hdmi_obs)}</div>
                             <div class="bottom-sub-row"><strong>OTRO: </strong> ${formatTestRow('', testeo.testeo_otros, testeo.testeo_otros_obs)}</div>
                        </div>
                        <div style="padding:4px; border-top:1px solid #000; display:flex; justify-content:space-between; align-items:center; font-size:8pt; background:#f0f0f0;">
                            <div><strong>TECNICO TESTEO:</strong> ${txt(testeo.tecnico)}</div>
                            <div><strong>TRABAJO FINAL:</strong> ${txt(testeo.testeo_servicio_final)}</div>
                        </div>
                    ` : '<div style="padding:10px; text-align:center;">No realizado</div>'}
                    </div>
                </div>
                
                <div style="display: flex; gap: 20px; align-items: flex-start;">
                    <div style="flex-grow: 1;">
                        <div class="payment-box">
                            <div class="payment-title">MÉTODOS DE PAGO / NOTAS</div>
                            <div class="payment-method">
                                ${report.detallesPago || 'No especificado'}
                            </div>
                        </div>
                    </div>
                    <div class="totals-row">
                        <div class="total-bubble">
                            <span>TOTAL</span>
                            <span>S/ ${(parseFloat(report.total) || 0).toFixed(2)}</span>
                        </div>
                         <div class="total-bubble">
                            <span>A CUENTA</span>
                            <span>S/ ${(parseFloat(report.aCuenta) || 0).toFixed(2)}</span>
                        </div>
                        <div class="total-bubble" style="border-color: #ec008c; color: #ec008c;">
                            <span>SALDO</span>
                            <span>S/ ${(parseFloat(report.saldo) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

            </body>
            </html>
        `;

        const newWindow = window.open("", "", "width=950,height=1200");
        newWindow.document.write(printContent);
        newWindow.document.close();
        newWindow.focus();

        setTimeout(() => {
            newWindow.print();
            newWindow.close();
        }, 500);
    };

    const flatHistory = useMemo(() => {
        if (!report) return [];
        return report.diagnosticoPorArea
            ? Object.entries(report.diagnosticoPorArea)
                .flatMap(([areaName, entries]) =>
                    (Array.isArray(entries) ? entries : [entries]).map(entry => ({ ...entry, areaName }))
                )
                .filter(entry => entry.estado === 'TERMINADO')
                .sort((a, b) => {
                    const dateA = new Date(`${a.fecha_fin.split('-').reverse().join('-')}T${a.hora_fin}`);
                    const dateB = new Date(`${b.fecha_fin.split('-').reverse().join('-')}T${b.hora_fin}`);
                    return dateB - dateA;
                })
            : [];
    }, [report]);

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (isLoading) return <div className="text-center p-8">Cargando historial...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;

    // La acción de entrega solo está disponible si el estado es TERMINADO y no ENTREGADO
    const canDeliver = report.estado === 'TERMINADO';

    const diagnostico = parseFloat(report.diagnostico) || 0;
    const montoServicio = parseFloat(report.montoServicio) || 0;
    const total = parseFloat(report.total) || 0;
    const saldo = parseFloat(report.saldo) || 0;



    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Link to={backPath} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mr-4" title="Volver">
                        <FaArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold">Informe Tecnico N° {report.reportNumber}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                        title="Imprimir Informe Técnico"
                    >
                        <FaPrint className="mr-2" /> Imprimir
                    </button>

                    <button
                        onClick={handlePrintServiceSheet}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                        title="Imprimir Ficha de Servicio"
                    >
                        <FaPrint className="mr-2" /> Ficha
                    </button>

                    {canDeliver && currentUser && (currentUser.rol === 'ADMIN' || currentUser.rol === 'SUPERADMIN' || currentUser.rol === 'SUPERUSER') && (
                        <button
                            onClick={handleOpenDeliveryModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                        >
                            <FaCheckCircle className="mr-2" /> Marcar como Entregado
                        </button>
                    )}
                </div>
            </div>

            <ReadOnlyReportHeader
                report={report}
                diagnostico={diagnostico}
                montoServicio={montoServicio}
                total={total}
                saldo={saldo}
                componentItems={report.items || []}
            />

            {(report.hasAdditionalServices || report.additionalServices?.length > 0) && (
                <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-pink-500 mb-2">Servicios Adicionales</h3>
                    <ul className="list-disc list-inside text-sm">
                        {report.additionalServices.map((service, index) => (
                            <li key={index}>{service.description} (S/ {parseFloat(service.amount).toFixed(2)})</li>
                        ))}
                    </ul>
                </div>
            )}

            {(report.documentosVentaCompra && report.documentosVentaCompra.length > 0) && (
                <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-green-600 mb-3">Comprobantes Registrados</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-2">Tipo</th>
                                    <th className="px-4 py-2">Descripción</th>
                                    <th className="px-4 py-2">N° Comprobante</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {report.documentosVentaCompra.map((doc, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2">{doc.type}</td>
                                        <td className="px-4 py-2">{doc.description}</td>
                                        <td className="px-4 py-2">{doc.number}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                <h2 className="text-xl font-semibold text-red-500 mb-3">Historial Completo de Intervenciones</h2>
                {flatHistory.length > 0 ? (
                    <div className="space-y-4">
                        {flatHistory.map((entry, index) => (
                            <ReadOnlyAreaHistory key={index} entry={entry} areaName={entry.areaName} report={report} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No hay historial de intervenciones para este informe.</p>
                )}
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

                        {/* Sección de Documentos */}
                        <div className="border-t pt-4 dark:border-gray-600">
                            <h3 className="text-sm font-bold mb-2">Comprobantes de Venta/Compra {currentUser?.rol === 'ADMIN' && <span className="text-red-500">*</span>}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                                <select
                                    className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    value={newDoc.type}
                                    onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                                >
                                    {DOC_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <input
                                    type="text"
                                    className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    placeholder="Descripción"
                                    value={newDoc.description}
                                    onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                                />
                                <input
                                    type="text"
                                    className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    placeholder="N° Comprobante"
                                    value={newDoc.number}
                                    onChange={(e) => setNewDoc({ ...newDoc, number: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddDocument}
                                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md flex items-center justify-center"
                                >
                                    <FaPlus />
                                </button>
                            </div>

                            {deliveryDocuments.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-800 border rounded-md max-h-40 overflow-y-auto mt-2">
                                    <table className="min-w-full text-xs text-left">
                                        <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-1">Tipo</th>
                                                <th className="px-2 py-1">Desc.</th>
                                                <th className="px-2 py-1">N°</th>
                                                <th className="px-2 py-1"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                            {deliveryDocuments.map(doc => (
                                                <tr key={doc.id}>
                                                    <td className="px-2 py-1">{doc.type}</td>
                                                    <td className="px-2 py-1">{doc.description}</td>
                                                    <td className="px-2 py-1">{doc.number}</td>
                                                    <td className="px-2 py-1 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveDocument(doc.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
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