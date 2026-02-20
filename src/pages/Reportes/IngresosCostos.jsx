import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFilePdf, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';

function IngresosCostos() {
    const { theme } = useContext(ThemeContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [isExporting, setIsExporting] = useState(false);
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAllDiagnosticReports();
                // Se pasa la data tal cual; el parseo se hará por pago
                setReports(data);
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { data: chartData, servicesSummary, diagReports } = useMemo(() => {
        if (!selectedMonth) return { data: [], servicesSummary: {}, diagReports: [] };

        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyStats = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            ingresoTotal: 0,
            ingresoDiagnostico: 0
        }));

        const servicesSummary = {};
        const diagReports = [];

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
                            servicesDetails.push({ type: 'Servicio Base', area: report.area || 'GENERAL', description: descName, amount: finalAmount });
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
                        servicesDetails.push({ type: 'Adicional', area: report.area || 'GENERAL', description: descName, amount: finalAmount });
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
                                        servicesDetails.push({ type: 'Adicional', area: area, description: descName, amount: finalAmount });
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
            // Subtract discount from the total (we can do it broadly)
            const totalFinal = diagCharged + totalServices - discount;

            return {
                totalFinal: totalFinal > 0 ? totalFinal : 0,
                diagCharged,
                servicesDetails,
                reportNumber: report.reportNumber
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

            // Si tiene el array de pagos nuevo desde el modal de CostosModal
            if (report.pagosRealizado && report.pagosRealizado.length > 0) {
                pagos = [...report.pagosRealizado];
            } else {
                // Inferir cobros legacy (aCuenta) o por marcaje Pagado
                const aCuenta = parseFloat(report.aCuenta) || 0;
                const total = parseFloat(report.total) || analysis.totalFinal;
                const isPaid = report.isPaid || report.estado === 'ENTREGADO';

                const minPagoDetectado = isPaid ? (total > 0 ? total : aCuenta) : aCuenta;

                if (minPagoDetectado > 0) {
                    const fallbackDate = report.fechaPago || report.fechaEntrega || report.updatedAt || report.createdAt || report.fecha;
                    pagos = [{ monto: minPagoDetectado, fecha: fallbackDate }];
                }
            }

            let reportServicesSummaryAdded = false;

            pagos.forEach(pago => {
                const parseDate = parseDateHelper(pago.fecha);
                if (parseDate && parseDate.getFullYear() === year && parseDate.getMonth() === month - 1) {
                    const day = parseDate.getDate();
                    const stats = dailyStats[day - 1];
                    const monto = parseFloat(pago.monto) || 0;

                    if (monto > 0) {
                        stats.ingresoTotal += monto;

                        // Solo sumar diagnóstico y listas de servicios la primera vez que choca un pago en este mes de este reporte
                        if (!reportServicesSummaryAdded) {
                            if (analysis.diagCharged > 0) {
                                stats.ingresoDiagnostico += analysis.diagCharged;
                                diagReports.push({ reportNumber: analysis.reportNumber, diagCharged: analysis.diagCharged, date: parseDate });
                            }

                            analysis.servicesDetails.forEach(s => {
                                const key = `${s.area}|${s.type}|${s.description}`;
                                if (!servicesSummary[key]) {
                                    servicesSummary[key] = { area: s.area, type: s.type, description: s.description, amount: 0 };
                                }
                                servicesSummary[key].amount += s.amount;
                            });

                            reportServicesSummaryAdded = true;
                        }
                    }
                }
            });
        });

        // Parse nulls for log chart
        const processedChartData = dailyStats.map(d => ({
            ...d,
            // Use undefined for zeroes so Recharts LogAxis correctly skips them and doesn't crash
            ingresoTotal: d.ingresoTotal > 0 ? d.ingresoTotal : undefined,
            ingresoDiagnostico: d.ingresoDiagnostico > 0 ? d.ingresoDiagnostico : undefined,
            // Fallbacks for tooltip
            _rawTotal: d.ingresoTotal,
            _rawDiag: d.ingresoDiagnostico
        }));

        return { data: processedChartData, servicesSummary: Object.values(servicesSummary), diagReports };
    }, [reports, selectedMonth]);

    const exportToPDF = async () => {
        if (chartRef.current === null) return;
        setIsExporting(true);

        setTimeout(async () => {
            try {
                const element = chartRef.current;

                // Forzamos fondo blanco estricto en el contenedor del gráfico durante la captura
                const originalBg = element.style.backgroundColor;
                element.style.backgroundColor = '#ffffff';

                const canvas = await toPng(element, {
                    cacheBust: true,
                    backgroundColor: '#ffffff',
                    width: element.offsetWidth,
                    pixelRatio: 2 // Alta calidad
                });

                element.style.backgroundColor = originalBg;

                const imgData = canvas;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                let cursorY = 15;

                // Título Reporte
                pdf.setFontSize(16);
                pdf.setTextColor(0, 0, 0);
                pdf.text(`Ingresos y Costos - ${selectedMonth}`, pdfWidth / 2, cursorY, { align: 'center' });
                cursorY += 10;

                // Gráfico
                const margin = 14;
                const contentWidth = pdfWidth - (margin * 2);
                const img = new Image();
                img.src = imgData;
                await new Promise((resolve) => { img.onload = resolve; });

                const imgHeight = (img.height * contentWidth) / img.width;
                pdf.addImage(imgData, 'PNG', margin, cursorY, contentWidth, imgHeight);
                cursorY += imgHeight + 10;

                // Tabla 1: Resumen por Servicios
                pdf.setFontSize(12);
                pdf.text("Resumen por Servicios (Base y Adicionales)", margin, cursorY);
                cursorY += 5;

                const table1Body = servicesSummary
                    .sort((a, b) => a.area.localeCompare(b.area))
                    .map(s => [
                        s.area,
                        s.type,
                        s.description,
                        `S/ ${s.amount.toFixed(2)}`
                    ]);

                autoTable(pdf, {
                    startY: cursorY,
                    head: [['Área', 'Tipo', 'Descripción', 'Total Cobrado (S/)']],
                    body: table1Body.length > 0 ? table1Body : [['-', '-', 'Ningún servicio registrado este mes', '-']],
                    theme: 'grid',
                    headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
                    styles: { textColor: [17, 24, 39], fontSize: 9 },
                    margin: { left: margin, right: margin },
                    didDrawPage: (data) => {
                        // En caso de salto de página manual de la tabla, ajustamos
                        cursorY = data.cursor.y;
                    }
                });

                cursorY = (pdf.lastAutoTable ? pdf.lastAutoTable.finalY : cursorY + 20) + 15;

                // Tabla 2: Informes con Cobro de Diagnóstico
                // Chequear si cabe el titulo en la página, sino saltamos
                if (cursorY + 15 > pdf.internal.pageSize.getHeight()) {
                    pdf.addPage();
                    cursorY = 20;
                }

                pdf.setFontSize(12);
                pdf.text("Informes con Cobro de Diagnóstico", margin, cursorY);
                cursorY += 5;

                const table2Body = diagReports.map(d => [
                    d.reportNumber,
                    d.date.toLocaleDateString(),
                    `S/ ${d.diagCharged.toFixed(2)}`
                ]);

                autoTable(pdf, {
                    startY: cursorY,
                    head: [['N° Informe', 'Fecha', 'Diagnóstico Cobrado (S/)']],
                    body: table2Body.length > 0 ? table2Body : [['-', '-', 'Ningún cobro de diagnóstico']],
                    theme: 'grid',
                    headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
                    styles: { textColor: [17, 24, 39], fontSize: 9, halign: 'center' },
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
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/reportes" className="text-gray-500 hover:text-gray-700"><FaArrowLeft /></Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ingresos</h1>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    <button
                        onClick={exportToPDF}
                        disabled={isExporting}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                        <FaFilePdf /> {isExporting ? 'Exportando...' : 'Exportar PDF'}
                    </button>
                </div>
            </div>

            <div className={`p-8 rounded-xl shadow-lg border transition-colors duration-300 ${isExporting ? 'bg-white !important border-gray-100' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>

                {/* Zona estricta del gráfico para la foto */}
                <div ref={chartRef} className={`${isExporting ? 'bg-white' : ''} p-2 rounded-lg`}>
                    <h2 className={`text-xl font-bold mb-6 text-center uppercase tracking-wide transition-colors`} style={{ color: isExporting ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937') }}>
                        Evolución Diaria de Ingresos (Logarítmico)
                    </h2>
                    {/* Reduced height from 500px to 350px */}
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
                                        // Use exact 0 value from raw instead of undefined
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
                    <h3
                        className={`text-lg font-bold mb-4 border-b pb-2 transition-colors`}
                        style={{
                            color: isExporting ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'),
                            borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                        }}
                    >
                        Resumen por Servicios (Base y Adicionales)
                    </h3>
                    <div className={`${isExporting ? 'overflow-hidden' : 'overflow-x-auto'} border rounded-lg`} style={{ borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead style={{ backgroundColor: isExporting ? '#f3f4f6' : (theme === 'dark' ? '#374151' : '#f3f4f6') }}>
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>Área</th>
                                    <th className="px-6 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>Tipo</th>
                                    <th className="px-6 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>Descripción</th>
                                    <th className="px-6 py-4 text-right text-xs font-extra-bold uppercase tracking-wider"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Total Cobrado (S/)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y"
                                style={{
                                    backgroundColor: isExporting ? '#ffffff' : (theme === 'dark' ? '#1f2937' : '#ffffff'),
                                    divideColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                                }}>
                                {servicesSummary.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Ningún servicio con costo registrado este mes.</td></tr>
                                ) : (
                                    servicesSummary.sort((a, b) => a.area.localeCompare(b.area)).map((s, idx) => (
                                        <tr key={idx} className="transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r"
                                                style={{ color: isExporting ? '#111827' : (theme === 'dark' ? '#ffffff' : '#111827'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>{s.area}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center border-r"
                                                style={{ color: isExporting ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>{s.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center border-r"
                                                style={{ color: isExporting ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>{s.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold"
                                                style={{ color: isExporting ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}>S/ {s.amount.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 border-t pt-8 dark:border-gray-700" style={{ borderColor: isExporting ? '#e5e7eb' : undefined }}>
                    <h3
                        className={`text-lg font-bold mb-4 border-b pb-2 transition-colors`}
                        style={{
                            color: isExporting ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'),
                            borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                        }}
                    >
                        Informes con Cobro de Diagnóstico
                    </h3>
                    <div className={`${isExporting ? 'overflow-hidden' : 'overflow-x-auto'} border rounded-lg`} style={{ borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead style={{ backgroundColor: isExporting ? '#f3f4f6' : (theme === 'dark' ? '#374151' : '#f3f4f6') }}>
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>N° Informe</th>
                                    <th className="px-6 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb') }}>Fecha</th>
                                    <th className="px-6 py-4 text-right text-xs font-extra-bold uppercase tracking-wider"
                                        style={{ color: isExporting ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Diagnóstico Cobrado (S/)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y"
                                style={{
                                    backgroundColor: isExporting ? '#ffffff' : (theme === 'dark' ? '#1f2937' : '#ffffff'),
                                    divideColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                                }}>
                                {diagReports.length === 0 ? (
                                    <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">Ningún informe cobró diagnóstico este mes.</td></tr>
                                ) : (
                                    diagReports.map((d, idx) => (
                                        <tr key={idx} className="transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r"
                                                style={{ color: isExporting ? '#111827' : (theme === 'dark' ? '#ffffff' : '#111827'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>{d.reportNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center border-r"
                                                style={{ color: isExporting ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151'), borderColor: isExporting ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>{d.date.toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold"
                                                style={{ color: isExporting ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}>S/ {d.diagCharged.toFixed(2)}</td>
                                        </tr>
                                    ))
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
