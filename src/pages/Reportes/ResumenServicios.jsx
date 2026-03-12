import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { getAllUsersDetailed } from '../../services/userService';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { FaFilePdf, FaArrowLeft, FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import Modal from '../../components/common/Modal';
import ReadOnlyAreaHistory from '../../components/common/ReadOnlyAreaHistory';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1', '#84cc16'];

const parseInterventionDate = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const [d, m, y] = dateStr.split('-');
    const [h, min] = timeStr.split(':');
    return new Date(y, m - 1, d, h, min);
};

const formatDuration = (value, unit) => {
    if (isNaN(value) || value === null) return unit === 'hours' ? '0.00H' : '0M';
    if (unit === 'hours') {
        return `${value.toFixed(2)}H`;
    } else {
        return `${Math.round(value)}M`;
    }
};

const ResumenServicios = () => {
    const { theme } = useContext(ThemeContext);
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);

    // Filters
    const [selectedReport, setSelectedReport] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedTech, setSelectedTech] = useState('');

    // Config
    const timeUnit = 'hours'; // The example shows hours

    const [isLoading, setIsLoading] = useState(true);
    const [isExportingProcess, setIsExportingProcess] = useState(false);

    // Modal state
    const [modalData, setModalData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const reportRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const fetchedReports = await getAllDiagnosticReports();
                const fetchedUsers = await getAllUsersDetailed();
                setReports(fetchedReports || []);
                setUsers(fetchedUsers.filter(u => u.rol === 'USER' || u.rol === 'SUPERUSER' || u.rol === 'ADMIN' || u.rol === 'SUPERADMIN'));
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const exportToPDF = async () => {
        if (reportRef.current === null) return;
        setIsExportingProcess(true);

        setTimeout(async () => {
            try {
                const element = reportRef.current;
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
                const pdfWidth = 297; // A4 Landscape
                const margin = 10;
                const contentWidth = pdfWidth - (margin * 2);

                const img = new Image();
                img.src = imgData;
                await new Promise(resolve => img.onload = resolve);

                const imgHeight = (img.height * contentWidth) / img.width;
                const pdfHeight = 210; // A4 Landscape height in mm

                const pdf = new jsPDF({
                    orientation: 'l',
                    unit: 'mm',
                    format: 'a4'
                });

                pdf.setFontSize(18);
                pdf.setTextColor(0, 0, 0);
                pdf.text("Resumen Promedio por Horas de Servicios Realizados", pdfWidth / 2, 15, { align: 'center' });

                let heightLeft = imgHeight;
                let position = 25;

                pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
                heightLeft -= (pdfHeight - position);

                while (heightLeft > 0) {
                    position = position - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
                    heightLeft -= pdfHeight;
                }

                pdf.save(`Resumen_Servicios_Horas.pdf`);

            } catch (err) {
                console.error("Export Error:", err);
            } finally {
                setIsExportingProcess(false);
            }
        }, 100);
    };

    const interventions = useMemo(() => {
        const data = [];
        reports.forEach(report => {
            if (!report.diagnosticoPorArea) return;
            Object.entries(report.diagnosticoPorArea).forEach(([areaName, entries]) => {
                const areaEntries = Array.isArray(entries) ? entries : [entries];
                areaEntries.forEach(entry => {
                    if (entry.estado === 'TERMINADO' && entry.fecha_inicio && entry.hora_inicio && entry.fecha_fin && entry.hora_fin) {
                        const start = parseInterventionDate(entry.fecha_inicio, entry.hora_inicio);
                        const end = parseInterventionDate(entry.fecha_fin, entry.hora_fin);
                        if (start && end && end >= start) {
                            const durationMs = end - start;
                            const durationValue = timeUnit === 'hours' ? durationMs / (1000 * 60 * 60) : durationMs / (1000 * 60);

                            // Get services
                            let servicesList = [];
                            if (areaName === 'IMPRESORA') {
                                if (entry.printer_services_realized) servicesList = [...entry.printer_services_realized];
                            } else {
                                if (entry.addedServices) servicesList = [...entry.addedServices];
                                if (entry.reparacion && entry.reparacion !== 'No se registraron servicios.') {
                                    servicesList.push({ description: entry.reparacion });
                                }
                            }
                            // Also gather other specific interventions like Hardware (reconstruccion, mant_hardware, etc.) based on report structure
                            if (areaName === 'HARDWARE') {
                                if (entry.mant_hardware) servicesList.push({ description: 'Mantenimiento de Hardware' });
                                if (entry.reconstruccion) servicesList.push({ description: 'Reconstruccion' });
                                if (entry.cambio_teclado) servicesList.push({ description: 'Cambio de teclado' });
                                if (entry.repoten_ram) servicesList.push({ description: 'Memoria RAM' });
                                // the user just wants the ones we can extract easily, usuallyreparacion covers it or addedServices
                            }
                            if (areaName === 'SOFTWARE') {
                                if (entry.formateo) servicesList.push({ description: 'Formateo + Inst. Programas' });
                                if (entry.backup) servicesList.push({ description: 'Backup de info' });
                            }

                            // Sólo mostrar técnico responsable
                            let techName = entry.tecnico || 'Desconocido';

                            data.push({
                                reportId: report.id,
                                reportNumber: String(report.reportNumber), // store as string for searching
                                area: areaName,
                                techId: entry.tecnicoId,
                                techName: techName,
                                start,
                                end,
                                startDateStr: `${entry.fecha_inicio} ${entry.hora_inicio}`,
                                endDateStr: `${entry.fecha_fin} ${entry.hora_fin}`,
                                duration: durationValue,
                                equipo: report.tipoEquipo || 'N/A',
                                modeloMarca: `${report.marca || ''} ${report.modelo || ''}`.trim() || 'N/A',
                                servicesList,
                                entry: entry,
                                report: report
                            });
                        }
                    }
                });
            });
        });
        return data;
    }, [reports, timeUnit]);

    const allReportNumbers = useMemo(() => Array.from(new Set(interventions.map(i => i.reportNumber))).sort(), [interventions]);
    const allAreas = useMemo(() => Array.from(new Set(interventions.map(i => i.area))), [interventions]);
    const allTechs = useMemo(() => Array.from(new Set(interventions.flatMap(i => i.techName.split(' / ')))), [interventions]);

    const baseData = useMemo(() => {
        let data = interventions;
        if (selectedReport) data = data.filter(i => i.reportNumber.includes(selectedReport));
        if (selectedArea) data = data.filter(i => i.area === selectedArea);
        if (selectedTech) data = data.filter(i => i.techName.includes(selectedTech));

        // Sort by report and then by start date
        return data.sort((a, b) => {
            const numA = parseInt(a.reportNumber, 10) || 0;
            const numB = parseInt(b.reportNumber, 10) || 0;
            if (numA !== numB) return numB - numA; // Changed to descending: numB - numA
            
            // Si son del mismo informe, ordenar por fecha de inicio (ascendente para que se vea la ruta cronológica)
            return (a.start || 0) - (b.start || 0);
        });
    }, [interventions, selectedReport, selectedArea, selectedTech]);

    // Format chart data: Group by Area, show bars per Technician
    const chartData = useMemo(() => {
        const aggregated = {};

        const filteredTechsSet = new Set();
        baseData.forEach(inv => {
            const techs = inv.techName.split(' / ');
            techs.forEach(t => filteredTechsSet.add(t));
        });
        const filteredTechs = Array.from(filteredTechsSet);

        allAreas.forEach(area => {
            aggregated[area] = { name: area };
            filteredTechs.forEach(tech => {
                aggregated[area][tech] = { total: 0, count: 0 };
            });
        });

        baseData.forEach(inv => {
            const techs = inv.techName.split(' / ');
            techs.forEach(tech => {
                if (aggregated[inv.area] && aggregated[inv.area][tech]) {
                    aggregated[inv.area][tech].total += inv.duration;
                    aggregated[inv.area][tech].count += 1;
                }
            });
        });

        return Object.values(aggregated).map(areaData => {
            const result = { name: areaData.name };
            filteredTechs.forEach(tech => {
                const stats = areaData[tech];
                if (stats.count > 0) {
                    const val = Number((stats.total / stats.count).toFixed(2));
                    result[tech] = val > 0 ? val : 0;
                } else {
                    result[tech] = 0;
                }
            });
            return result;
        }).filter(item => {
            // Only keep areas that have at least one tech with > 0 inside `result`
            return filteredTechs.some(t => item[t] > 0);
        });
    }, [baseData, allAreas]);

    const activeTechsInChart = useMemo(() => {
        const techs = new Set();
        chartData.forEach(item => {
            Object.keys(item).forEach(key => {
                if (key !== 'name' && item[key] > 0) {
                    techs.add(key);
                }
            });
        });
        return Array.from(techs);
    }, [chartData]);


    const axisTextColor = isExportingProcess ? '#000000' : (theme === 'dark' ? '#E5E7EB' : '#374151');

    return (
        <div className="p-6">
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/reportes" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <FaArrowLeft />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Resumen Promedio por Horas de Servicios</h1>
                    </div>
                    <button
                        onClick={exportToPDF}
                        disabled={isExportingProcess}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <FaFilePdf /> {isExportingProcess ? '...' : 'Exportar'}
                    </button>
                </div>
            </div>

            <div className={`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 ${isExportingProcess ? 'bg-white !important' : ''}`} ref={reportRef}>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1" style={{ color: isExportingProcess ? '#4b5563' : undefined }}>Informe Técnico</label>
                        <input
                            type="text"
                            placeholder="Buscar N° (ej. 110)"
                            value={selectedReport}
                            onChange={(e) => setSelectedReport(e.target.value)}
                            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            style={{ borderColor: isExportingProcess ? '#d1d5db' : undefined, color: isExportingProcess ? '#111827' : undefined, backgroundColor: isExportingProcess ? '#fff' : undefined }}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1" style={{ color: isExportingProcess ? '#4b5563' : undefined }}>Área</label>
                        <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" style={{ borderColor: isExportingProcess ? '#d1d5db' : undefined, color: isExportingProcess ? '#111827' : undefined, backgroundColor: isExportingProcess ? '#fff' : undefined }}>
                            <option value="">Todas las áreas</option>
                            {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1" style={{ color: isExportingProcess ? '#4b5563' : undefined }}>Técnico</label>
                        <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" style={{ borderColor: isExportingProcess ? '#d1d5db' : undefined, color: isExportingProcess ? '#111827' : undefined, backgroundColor: isExportingProcess ? '#fff' : undefined }}>
                            <option value="">Todos los técnicos</option>
                            {allTechs.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="mb-10">
                    <h2 className="text-lg font-bold mb-4 border-b pb-2 transition-colors" style={{ color: isExportingProcess ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'), borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                        Tiempos Promedio por Área y Técnico
                    </h2>
                    <div className="h-[450px] w-full bg-slate-900 rounded-lg p-4" style={{ backgroundColor: isExportingProcess ? '#1e293b' : (theme === 'dark' ? '#111827' : '#1e293b') }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 80, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                <XAxis dataKey="name" tick={{ fill: '#cbd5e1' }} stroke="#475569" />
                                <YAxis tick={{ fill: '#cbd5e1' }} stroke="#475569" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                                        backgroundColor: '#1e293b',
                                        color: '#fff'
                                    }}
                                />
                                <Legend wrapperStyle={{ color: '#cbd5e1', paddingTop: '10px' }} />
                                {activeTechsInChart.map((tech, idx) => (
                                    <Bar key={tech} dataKey={tech} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} isAnimationActive={!isExportingProcess}>
                                        <LabelList
                                            dataKey={tech}
                                            content={({ x, y, width, value }) => {
                                                if (!value) return null;
                                                return (
                                                    <g transform={`translate(${x + width / 2},${y - 8})`}>
                                                        <text
                                                            x={0}
                                                            y={0}
                                                            transform="rotate(-45)"
                                                            textAnchor="start"
                                                            fill={isExportingProcess ? '#ffffff' : (theme === 'dark' ? '#E5E7EB' : '#cbd5e1')}
                                                            fontSize={11}
                                                            fontWeight="bold"
                                                        >
                                                            {tech} ({value})
                                                        </text>
                                                    </g>
                                                );
                                            }}
                                        />
                                    </Bar>
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Data Table */}
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4 border-b pb-2 transition-colors" style={{ color: isExportingProcess ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'), borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                        RESUMEN PROMEDIO DE SERVICIOS REALIZADOS
                    </h3>
                    <div className="overflow-x-auto border rounded-lg" style={{ borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead style={{ backgroundColor: isExportingProcess ? '#f3f4f6' : (theme === 'dark' ? '#374151' : '#f3f4f6') }}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Informe Técnico</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Área</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Técnico Res.</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Unidad de Tiempo</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Fecha Inicio</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Fecha de Culminación</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Equipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Modelo/Marca</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}>Servicios por Área</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ backgroundColor: isExportingProcess ? '#ffffff' : (theme === 'dark' ? '#1f2937' : '#ffffff'), divideColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                                {baseData.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold" style={{ color: isExportingProcess ? '#111827' : (theme === 'dark' ? '#ffffff' : '#111827') }}>{row.reportNumber}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: isExportingProcess ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}>{row.area}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: isExportingProcess ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}>{row.techName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: isExportingProcess ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}>{formatDuration(row.duration, timeUnit)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: isExportingProcess ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}>{row.startDateStr}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: isExportingProcess ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}>{row.endDateStr}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: isExportingProcess ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}>{row.equipo}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: isExportingProcess ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}>{row.modeloMarca}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                            <button
                                                onClick={() => {
                                                    setModalData(row);
                                                    setIsModalOpen(true);
                                                }}
                                                className="text-gray-600 hover:text-blue-500 transition-colors bg-gray-200 dark:bg-gray-700 p-2 rounded-full"
                                                title="Ver Detalle"
                                            >
                                                <FaEye />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {baseData.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                            No hay registros para los filtros seleccionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal para detalles de servicio */}
            {isModalOpen && modalData && (
                <Modal onClose={() => setIsModalOpen(false)} title={`Detalle de Servicios - Área: ${modalData.area}`} maxWidth="max-w-4xl">
                    <div className="p-6 overflow-y-auto max-h-[80vh]">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600 mb-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div><span className="font-bold">Informe:</span> {modalData.reportNumber}</div>
                                <div><span className="font-bold">Técnico:</span> {modalData.techName}</div>
                                <div><span className="font-bold">Tiempo transcurrido:</span> {formatDuration(modalData.duration, timeUnit)}</div>
                            </div>
                        </div>

                        <ReadOnlyAreaHistory entry={modalData.entry} areaName={modalData.area} report={modalData.report} />

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ResumenServicios;
