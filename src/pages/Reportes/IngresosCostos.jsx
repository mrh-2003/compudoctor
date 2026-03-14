import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFilePdf, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';

const OTHER_EQUIPMENT_OPTIONS = {
    "TARJETA_VIDEO": "Tarjeta de Video",
    "PLACA_MADRE_LAPTOP": "Placa Madre Laptop",
    "PLACA_MADRE_PC": "Placa Madre PC",
    "OTRO_DESCRIPCION": "Otro"
};

function IngresosCostos() {
    const { theme } = useContext(ThemeContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [isExporting, setIsExporting] = useState(false);
    const [diagFilter, setDiagFilter] = useState('ALL'); // ALL, CON_DIAG, SIN_DIAG
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAllDiagnosticReports();
                setReports(data);
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { data: chartData, tableReports, summaryTotals } = useMemo(() => {
        if (!selectedMonth) return { data: [], tableReports: [], summaryTotals: { totalPagado: 0 } };

        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyStats = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            ingresoTotal: 0,
            ingresoDiagnostico: 0
        }));

        const tableReportsData = [];
        let globalTotalPagado = 0;

        const analyzeReport = (report) => {
            let shouldChargeRevision = true;
            let shouldChargeReparacion = true;

            if (report.diagnosticoPorArea) {
                const areasToCheck = ['IMPRESORA', 'HARDWARE', 'SOFTWARE', 'ELECTRONICA', 'TESTEO'];
                for (const area of areasToCheck) {
                    if (report.diagnosticoPorArea[area]) {
                        const history = report.diagnosticoPorArea[area];
                        const entryWithDecision = [...history].reverse().find(h => h.printer_cobra_revision || h.cobra_revision);
                        if (entryWithDecision) {
                            const decision = entryWithDecision.printer_cobra_revision || entryWithDecision.cobra_revision;
                            if (decision === 'NO') shouldChargeRevision = false;
                        }
                    }
                }
                if (report.diagnosticoPorArea['TESTEO']) {
                    const testeoHistory = report.diagnosticoPorArea['TESTEO'];
                    const repairEntry = [...testeoHistory].reverse().find(h => h.cobra_reparacion);
                    if (repairEntry && repairEntry.cobra_reparacion === 'NO') {
                        shouldChargeReparacion = false;
                    }
                }
            }

            const hasReparacionServiceInList = report.servicesList?.some(s => s.service && s.service.toUpperCase().includes('REPARACIÓN'));
            const hasRevisionServiceInList = report.servicesList?.some(s => s.service && s.service.toUpperCase().includes('REVISIÓN'));
            
            let initialDiagnosticCost = parseFloat(report.diagnostico) || 0;

            if (hasReparacionServiceInList && shouldChargeReparacion) {
                initialDiagnosticCost = 0;
            }

            const igvMap = {};
            if (report.igvApplicableIds) {
                report.igvApplicableIds.forEach(id => igvMap[id] = true);
            }

            const getAmountWithIgv = (id, amount) => {
                const base = parseFloat(amount) || 0;
                const hasIgv = !!igvMap[id];
                return base + (hasIgv ? base * 0.18 : 0);
            };

            let diagCharged = 0;
            if (shouldChargeRevision && initialDiagnosticCost > 0) {
                diagCharged = getAmountWithIgv('diag-1', initialDiagnosticCost);
            }

            let servicesDetails = [];
            let totalServices = 0;

            if (report.servicesList) {
                report.servicesList.forEach((s, idx) => {
                    let amount = parseFloat(s.amount) || 0;
                    const isRevision = s.service && s.service.toUpperCase().includes('REVISIÓN');
                    const isReparacion = s.service && s.service.toUpperCase().includes('REPARACIÓN');

                    if ((!shouldChargeRevision && isRevision) || (!shouldChargeReparacion && isReparacion)) {
                        amount = 0;
                    } else {
                        const finalAmount = getAmountWithIgv(`main-${idx}`, amount);
                        totalServices += finalAmount;
                        if (finalAmount > 0) {
                            const descName = (s.service === 'Otros' || s.service === 'OTROS') ? (s.specification || 'Otros') : s.service;
                            servicesDetails.push({ 
                                type: 'Servicio Base', 
                                isLegacy: true,
                                area: 'INFORME TECNICO', 
                                description: descName + (s.specification && s.service !== 'Otros' && s.service !== 'OTROS' ? ` - ${s.specification}` : ''), 
                                amount: finalAmount 
                            });
                        }
                    }
                });
            }

            if (report.additionalServices) {
                report.additionalServices.forEach((s, idx) => {
                    const finalAmount = getAmountWithIgv(s.id || `legacy-${idx}`, s.amount);
                    totalServices += finalAmount;
                    if (finalAmount > 0) {
                        const descName = (s.description === 'Otros' || s.description === 'OTROS') ? (s.specification || 'Otros') : (s.description || s.service || 'Extra');
                        servicesDetails.push({ 
                            type: 'Adicional', 
                            isLegacy: true, 
                            area: 'INFORME TECNICO', 
                            description: descName + (s.specification && descName !== s.specification ? ` - ${s.specification}` : ''), 
                            amount: finalAmount 
                        });
                    }
                });
            }

            if (report.diagnosticoPorArea) {
                const seenServiceIds = new Set();
                Object.entries(report.diagnosticoPorArea).forEach(([area, entries]) => {
                    entries.forEach((entry, entryIdx) => {
                        const processServiceList = (list, listName) => {
                            if (list) {
                                list.forEach((s, sIdx) => {
                                    if (s.id && seenServiceIds.has(s.id)) return;
                                    if (s.id) seenServiceIds.add(s.id);
                                    const id = s.id || `area-${area}-${entryIdx}-${listName}-${sIdx}`;
                                    const finalAmount = getAmountWithIgv(id, s.amount);
                                    totalServices += finalAmount;
                                    if (finalAmount > 0) {
                                        let descName = s.description || s.service || 'Extra';
                                        if (descName === 'Otros' || descName === 'OTROS') descName = s.specification || 'Otros';
                                        const finalDesc = descName + (s.specification && descName !== s.specification ? ` - ${s.specification}` : '');

                                        servicesDetails.push({ 
                                            type: 'Adicional', 
                                            isLegacy: false,
                                            area: area, 
                                            description: finalDesc, 
                                            amount: finalAmount 
                                        });
                                    }
                                });
                            }
                        };
                        processServiceList(entry.addedServices, 'added');
                        processServiceList(entry.printer_services_additional, 'printer-add');
                        processServiceList(entry.printer_services_realized, 'printer-realized');
                    });
                });
            }

            const discount = parseFloat(report.descuento) || 0;
            const totalFinal = diagCharged + totalServices - discount;

            return {
                totalFinal: totalFinal > 0 ? totalFinal : 0,
                diagCharged,
                servicesDetails,
                reportNumber: report.reportNumber,
                discount,
                hasRevision: hasRevisionServiceInList,
                hasReparacion: hasReparacionServiceInList,
                shouldChargeRevision,
                shouldChargeReparacion
            };
        };

        const parseDateHelper = (dateInfo) => {
            if (!dateInfo) return null;
            let parsedDate = null;
            if (dateInfo.seconds) {
                parsedDate = new Date(dateInfo.seconds * 1000);
            } else if (typeof dateInfo === 'string') {
                if (dateInfo.includes('T')) {
                    parsedDate = new Date(dateInfo);
                } else if (dateInfo.includes('-')) {
                    const parts = dateInfo.split('-');
                    if (parts.length === 3) {
                        if (parts[0].length === 4) {
                            parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                        } else {
                            parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
                        }
                    }
                } else {
                    parsedDate = new Date(dateInfo);
                }
            } else if (dateInfo instanceof Date) {
                parsedDate = dateInfo;
            }
            if (!parsedDate || isNaN(parsedDate.getTime())) return null;
            return parsedDate;
        };

        reports.forEach(report => {
            const analysis = analyzeReport(report);

            let pagos = [];
            if (report.pagosRealizado && report.pagosRealizado.length > 0) {
                pagos = [...report.pagosRealizado];
            } else {
                const aCuenta = parseFloat(report.aCuenta) || 0;
                const total = parseFloat(report.total) || analysis.totalFinal;
                const isPaid = report.isPaid || report.estado === 'ENTREGADO';
                const minPagoDetectado = isPaid ? (total > 0 ? total : aCuenta) : aCuenta;

                if (minPagoDetectado > 0) {
                    const fallbackDate = report.fechaPago || report.fechaEntrega || report.updatedAt || report.createdAt || report.fecha;
                    pagos = [{ monto: minPagoDetectado, fecha: fallbackDate }];
                }
            }

            let pagosEnEsteMesTotal = 0;
            let pagosEnEsteMesData = [];

            pagos.forEach(pago => {
                const parseDate = parseDateHelper(pago.fecha);
                if (parseDate && parseDate.getFullYear() === year && parseDate.getMonth() === month - 1) {
                    const monto = parseFloat(pago.monto) || 0;
                    if (monto > 0) {
                        pagosEnEsteMesTotal += monto;
                        pagosEnEsteMesData.push(pago);
                    }
                }
            });

            if (pagosEnEsteMesTotal > 0) {
                globalTotalPagado += pagosEnEsteMesTotal;
                const isDiagnosticoCobrado = (analysis.diagCharged > 0);

                // Agregar datos a los gráficos
                pagosEnEsteMesData.forEach(pago => {
                    const pDate = parseDateHelper(pago.fecha);
                    const day = pDate.getDate();
                    const monto = parseFloat(pago.monto) || 0;
                    
                    dailyStats[day - 1].ingresoTotal += monto;

                    if (analysis.diagCharged > 0 && analysis.totalFinal > 0) {
                         const diagProp = analysis.diagCharged * (monto / analysis.totalFinal);
                         dailyStats[day - 1].ingresoDiagnostico += diagProp;
                    } else if (analysis.diagCharged > 0 && analysis.totalFinal === 0) {
                         dailyStats[day - 1].ingresoDiagnostico += monto;
                    }
                });

                // Preparar filas de tabla
                let obsParts = [];
                if (analysis.discount > 0) {
                    obsParts.push(`SE REALIZÓ S/ ${analysis.discount.toFixed(2)} DE DSCTO`);
                }
                if (analysis.hasRevision && !analysis.shouldChargeRevision) {
                    obsParts.push("NO SE COBRA REVISIÓN");
                }
                if (analysis.hasReparacion && !analysis.shouldChargeReparacion) {
                    obsParts.push("SE COBRA DIAGNOSTICO");
                }

                const reportRows = [];
                
                analysis.servicesDetails.forEach(s => {
                    reportRows.push({
                        area: s.area,
                        description: s.description,
                    });
                });

                if (analysis.diagCharged > 0) {
                    reportRows.push({
                        area: 'INFORME TECNICO',
                        description: 'Cobro de Diagnóstico',
                    });
                }
                
                if (reportRows.length === 0) {
                     reportRows.push({
                        area: 'INFORME TECNICO',
                        description: 'Servicio / Abono Genérico',
                    });
                }

                let tipoEquipoDisplay = report.tipoEquipo;
                if (tipoEquipoDisplay === 'Otros') {
                    if (report.otherComponentType === 'OTRO_DESCRIPCION') {
                        tipoEquipoDisplay = report.otherDescription || 'Otros';
                    } else if (report.otherComponentType) {
                        tipoEquipoDisplay = OTHER_EQUIPMENT_OPTIONS[report.otherComponentType] || 'Otros';
                    }
                }

                tableReportsData.push({
                    reportNumber: analysis.reportNumber,
                    tipoEquipo: tipoEquipoDisplay,
                    marcaModelo: `${report.marca || ''} ${report.modelo || ''}`.trim() || '-',
                    observacion: obsParts.length > 0 ? obsParts.join(' | ') : '',
                    totalCobradoMes: pagosEnEsteMesTotal,
                    rows: reportRows,
                    isDiagnosticoCobrado
                });
            }
        });

        const processedChartData = dailyStats.map(d => ({
            ...d,
            ingresoTotal: d.ingresoTotal > 0 ? d.ingresoTotal : undefined,
            ingresoDiagnostico: d.ingresoDiagnostico > 0 ? d.ingresoDiagnostico : undefined,
            _rawTotal: d.ingresoTotal,
            _rawDiag: d.ingresoDiagnostico
        }));

        const filteredTable = tableReportsData.filter(r => {
            if (diagFilter === 'CON_DIAG') return r.isDiagnosticoCobrado;
            if (diagFilter === 'SIN_DIAG') return !r.isDiagnosticoCobrado;
            return true;
        }).sort((a, b) => {
            // Manejar reportNumbers que puedan ser string (con P o G) o numéricos
            const aStr = String(a.reportNumber);
            const bStr = String(b.reportNumber);
            
            const matchA = aStr.match(/([a-zA-Z]*)(\d+)/) || [null, '', aStr];
            const matchB = bStr.match(/([a-zA-Z]*)(\d+)/) || [null, '', bStr];

            const prefixA = matchA[1] || '';
            const prefixB = matchB[1] || '';
            const numA = parseInt(matchA[2], 10) || 0;
            const numB = parseInt(matchB[2], 10) || 0;

            if (prefixA !== prefixB) return prefixB.localeCompare(prefixA);
            return numB - numA;
        });

        return { data: processedChartData, tableReports: filteredTable, summaryTotals: { totalPagado: globalTotalPagado } };
    }, [reports, selectedMonth, diagFilter]);

    const exportToPDF = async () => {
        if (chartRef.current === null) return;
        setIsExporting(true);

        setTimeout(async () => {
            try {
                const element = chartRef.current;
                const originalBg = element.style.backgroundColor;
                element.style.backgroundColor = '#ffffff';

                const canvas = await toPng(element, {
                    cacheBust: true,
                    backgroundColor: '#ffffff',
                    width: element.offsetWidth,
                    pixelRatio: 2
                });

                element.style.backgroundColor = originalBg;

                const imgData = canvas;
                const pdf = new jsPDF('l', 'mm', 'a4'); 
                const pdfWidth = pdf.internal.pageSize.getWidth();
                let cursorY = 15;

                pdf.setFontSize(16);
                pdf.setTextColor(0, 0, 0);
                pdf.text(`Ingresos y Costos - ${selectedMonth}`, pdfWidth / 2, cursorY, { align: 'center' });
                cursorY += 10;

                const margin = 14;
                const contentWidth = pdfWidth - (margin * 2);
                const img = new Image();
                img.src = imgData;
                await new Promise((resolve) => { img.onload = resolve; });

                const imgHeight = (img.height * contentWidth) / img.width;
                pdf.addImage(imgData, 'PNG', margin, cursorY, contentWidth, imgHeight);
                cursorY += imgHeight + 10;

                pdf.setFontSize(12);
                pdf.text("RESUMEN POR SERVICIOS (BASE Y ADICIONALES)", margin, cursorY);
                cursorY += 5;

                const tableBody = [];
                tableReports.forEach(report => {
                    report.rows.forEach((row, rowIndex) => {
                        const isFirstRow = rowIndex === 0;
                        const rowData = [
                            isFirstRow ? { content: report.reportNumber, rowSpan: report.rows.length, styles: { fontStyle: 'bold', valign: 'middle', halign: 'center' } } : '',
                            row.area,
                            isFirstRow ? { content: report.tipoEquipo, rowSpan: report.rows.length, styles: { valign: 'middle' } } : '',
                            isFirstRow ? { content: report.marcaModelo, rowSpan: report.rows.length, styles: { valign: 'middle' } } : '',
                            row.description,
                            isFirstRow ? { content: `S/ ${report.totalCobradoMes.toFixed(2)}`, rowSpan: report.rows.length, styles: { fontStyle: 'bold', valign: 'middle', halign: 'right' } } : '',
                            isFirstRow ? { content: report.observacion, rowSpan: report.rows.length, styles: { fontSize: 8, valign: 'middle' } } : ''
                        ];
                        tableBody.push(rowData);
                    });
                });

                autoTable(pdf, {
                    startY: cursorY,
                    head: [['Informe', 'Área / Registro', 'Tipo Equipo', 'Marca/Modelo', 'Descripción', 'Total Cobrado (Mes)', 'Observación']],
                    body: tableBody.length > 0 ? tableBody : [['-', '-', '-', '-', 'Ningún servicio registrado', '-', '-']],
                    theme: 'grid',
                    headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
                    styles: { textColor: [17, 24, 39], fontSize: 9 },
                    margin: { left: margin, right: margin }
                });

                pdf.save(`IngresosCostos_${selectedMonth}.pdf`);
            } catch (err) {
                console.error('PDF Export Error:', err);
            } finally {
                setIsExporting(false);
            }
        }, 150);
    };

    if (loading) return <div className="p-8 text-center">Cargando datos...</div>;

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/reportes" className="text-gray-500 hover:text-gray-700 dark:text-gray-400"><FaArrowLeft /></Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ingresos (Por Mes de Cobro)</h1>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 border p-2 rounded-lg dark:border-gray-700">
                    <div className="flex flex-col items-center gap-1 md:items-start md:mr-2">
                         <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Filtro Diagnóstico:</label>
                         <select
                            value={diagFilter}
                            onChange={(e) => setDiagFilter(e.target.value)}
                            className="p-1.5 text-sm border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                         >
                            <option value="ALL">Todos los Informes</option>
                            <option value="CON_DIAG">Con Cobro de Diagnóstico</option>
                            <option value="SIN_DIAG">Sin Cobro de Diagnóstico</option>
                         </select>
                    </div>
                    <div className="flex flex-col items-center gap-1 md:items-start">
                         <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Mes a Evaluar:</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="p-1.5 text-sm border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                    </div>
                    
                    <button
                        onClick={exportToPDF}
                        disabled={isExporting}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 mt-4 md:mt-0 rounded flex items-center gap-2 h-10"
                    >
                        <FaFilePdf /> {isExporting ? 'Exportando...' : 'Exportar PDF'}
                    </button>
                </div>
            </div>

            <div className={`p-8 rounded-xl shadow-lg border transition-colors duration-300 ${isExporting ? 'bg-white !important border-gray-100' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>

                <div ref={chartRef} className={`${isExporting ? 'bg-white' : ''} p-2 rounded-lg`}>
                    <h2 className={`text-xl font-bold mb-6 text-center uppercase tracking-wide transition-colors`} style={{ color: isExporting ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937') }}>
                        Evolución Diaria de Cobros (Logarítmico)
                    </h2>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" label={{ value: 'Día del Mes', position: 'insideBottomRight', offset: -10 }} />
                                <YAxis
                                    scale="log"
                                    domain={['auto', 'auto']}
                                    label={{ value: 'Soles (S/)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    formatter={(value, name, props) => {
                                        const rawVal = name === 'Ingreso Total' ? props.payload._rawTotal : props.payload._rawDiag;
                                        return [`S/ ${(rawVal || value || 0).toFixed(2)}`, name];
                                    }}
                                    contentStyle={{
                                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                                        color: theme === 'dark' ? '#f3f4f6' : '#111827'
                                    }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="ingresoTotal" name="Ingreso Total" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} connectNulls={true} isAnimationActive={!isExporting} />
                                <Line type="monotone" dataKey="ingresoDiagnostico" name="Ingreso Diagnóstico" stroke="#82ca9d" strokeWidth={2} connectNulls={true} isAnimationActive={!isExporting} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="mt-12 border-t pt-8 dark:border-gray-700" style={{ borderColor: isExporting ? '#e5e7eb' : undefined }}>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                         <h3
                            className={`text-lg font-bold border-b pb-2 transition-colors inline-block`}
                            style={{
                                color: isExporting ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'),
                                borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                            }}
                         >
                            RESUMEN POR SERVICIOS (BASE Y ADICIONALES)
                         </h3>
                         <div className="text-xl font-black text-green-600 bg-green-50 dark:bg-green-900/30 px-6 py-2 rounded-lg border border-green-200 dark:border-green-800">
                             Total Pagado a la Fecha: S/ {summaryTotals.totalPagado.toFixed(2)}
                         </div>
                    </div>
                    
                    <div className={`${isExporting ? 'overflow-hidden' : 'overflow-x-auto'} border rounded-lg`} style={{ borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead style={{ backgroundColor: isExporting ? '#f3f4f6' : (theme === 'dark' ? '#374151' : '#f3f4f6') }}>
                                <tr>
                                    <th className="px-5 py-4 text-center text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>Informe Técnico</th>
                                    <th className="px-5 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>Área / Registro</th>
                                    <th className="px-5 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>Tipo de Equipo</th>
                                    <th className="px-5 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>Marca/Modelo</th>
                                    <th className="px-5 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>Descripción de Servicio</th>
                                    <th className="px-5 py-4 text-right text-xs font-extra-bold uppercase tracking-wider border-r min-w-[120px]"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>Total Cobrado</th>
                                    <th className="px-5 py-4 text-left text-xs font-extra-bold uppercase tracking-wider max-w-[200px]"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Observación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y"
                                style={{
                                    backgroundColor: isExporting ? '#ffffff' : (theme === 'dark' ? '#1f2937' : '#ffffff'),
                                    divideColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                                }}>
                                {tableReports.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-bold">Ningún informe cumple con los criterios de pago o filtros este mes.</td></tr>
                                ) : (
                                    tableReports.map((report, rIdx) => {
                                        const isEven = rIdx % 2 === 0;
                                        const rowBgColor = isExporting 
                                            ? (isEven ? '#ffffff' : '#f9fafb') 
                                            : (theme === 'dark' 
                                                ? (isEven ? '#1f2937' : '#111827') 
                                                : (isEven ? '#ffffff' : '#f9fafb'));

                                        return (
                                        <React.Fragment key={rIdx}>
                                            {report.rows.map((row, rowIdx) => (
                                                <tr key={`${rIdx}-${rowIdx}`} className="transition-colors border-b dark:border-gray-700" style={{ backgroundColor: rowBgColor }}>
                                                    {rowIdx === 0 && (
                                                        <td rowSpan={report.rows.length} className="px-5 py-3 whitespace-nowrap text-lg font-black border-r text-center align-middle"
                                                            style={{ color: isExporting ? '#111827' : (theme === 'dark' ? '#ffffff' : '#111827'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                                                            {report.reportNumber}
                                                        </td>
                                                    )}
                                                    <td className="px-5 py-3 text-sm border-r font-medium"
                                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#d1d5db' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                                                        {row.area}
                                                    </td>
                                                    {rowIdx === 0 && (
                                                        <td rowSpan={report.rows.length} className="px-5 py-3 whitespace-nowrap text-sm border-r align-middle"
                                                            style={{ color: isExporting ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                                                            {report.tipoEquipo}
                                                        </td>
                                                    )}
                                                    {rowIdx === 0 && (
                                                        <td rowSpan={report.rows.length} className="px-5 py-3 whitespace-nowrap text-sm border-r align-middle"
                                                            style={{ color: isExporting ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                                                            {report.marcaModelo}
                                                        </td>
                                                    )}
                                                    <td className="px-5 py-3 text-sm border-r"
                                                        style={{ color: isExporting ? '#111827' : (theme === 'dark' ? '#f3f4f6' : '#111827'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                                                        {row.description}
                                                    </td>
                                                    {rowIdx === 0 && (
                                                        <td rowSpan={report.rows.length} className="px-5 py-3 whitespace-nowrap text-base font-bold text-right border-r align-middle"
                                                            style={{ color: isExporting ? '#059669' : (theme === 'dark' ? '#34d399' : '#059669'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                                                            S/ {report.totalCobradoMes.toFixed(2)}
                                                        </td>
                                                    )}
                                                    {rowIdx === 0 && (
                                                        <td rowSpan={report.rows.length} className="px-5 py-3 text-xs align-middle italic text-rose-500 dark:text-rose-400 font-bold max-w-[200px]"
                                                            style={{ borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                                                            {report.observacion}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    )})
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default IngresosCostos;
