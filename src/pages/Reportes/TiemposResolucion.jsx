import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { getAllUsersDetailed } from '../../services/userService';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { FaFilePdf, FaArrowLeft, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1', '#84cc16'];

const parseInterventionDate = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const [d, m, y] = dateStr.split('-');
    const [h, min] = timeStr.split(':');
    return new Date(y, m - 1, d, h, min);
};

const getReportCreationDate = (report) => {
    if (!report.createdAt) return new Date(0);
    if (report.createdAt.toDate) return report.createdAt.toDate();
    if (typeof report.createdAt === 'string') return new Date(report.createdAt);
    if (report.createdAt.seconds) return new Date(report.createdAt.seconds * 1000);
    return new Date(report.createdAt);
};

const formatDuration = (value, unit) => {
    if (isNaN(value) || value === null) return unit === 'hours' ? '0.00h' : '0m';
    if (unit === 'hours') {
        return `${value.toFixed(2)}h`;
    } else {
        return `${Math.round(value)}m`;
    }
};

const TiemposResolucion = () => {
    const { theme } = useContext(ThemeContext);
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedTech, setSelectedTech] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [timeUnit, setTimeUnit] = useState('minutes');
    const [isLoading, setIsLoading] = useState(true);
    const [isExportingProcess, setIsExportingProcess] = useState(false);

    const reportRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const fetchedReports = await getAllDiagnosticReports();
                const fetchedUsers = await getAllUsersDetailed();
                setReports(fetchedReports || []);
                setUsers(fetchedUsers.filter(u => u.rol === 'USER' || u.rol === 'SUPERUSER'));
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
                const pdfWidth = 210;
                const margin = 10;
                const contentWidth = pdfWidth - (margin * 2);

                const img = new Image();
                img.src = imgData;
                await new Promise(resolve => img.onload = resolve);

                const imgHeight = (img.height * contentWidth) / img.width;

                const pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: 'a4'
                });

                pdf.setFontSize(18);
                pdf.setTextColor(0, 0, 0);
                pdf.text("Reporte de Tiempos de Resolución", pdfWidth / 2, 15, { align: 'center' });

                if (startDate || endDate) {
                    pdf.setFontSize(10);
                    pdf.setTextColor(100, 100, 100);
                    const rangeText = `Periodo: ${startDate || 'Inicio'} al ${endDate || 'Hoy'}`;
                    pdf.text(rangeText, pdfWidth / 2, 22, { align: 'center' });
                }

                pdf.addImage(imgData, 'PNG', margin, 30, contentWidth, imgHeight);
                pdf.save(`Tiempos_Resolucion_${startDate || 'inicio'}_${endDate || 'fin'}.pdf`);

            } catch (err) {
                console.error("Export Error:", err);
            } finally {
                setIsExportingProcess(false);
            }
        }, 100);
    };

    const getTableWrapperStyle = () => ({
        borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
    });

    const getTheadStyle = () => ({
        backgroundColor: isExportingProcess ? '#f3f4f6' : (theme === 'dark' ? '#374151' : '#f3f4f6')
    });

    const getThStyle = () => ({
        color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'),
        borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb')
    });

    const getTbodyStyle = () => ({
        backgroundColor: isExportingProcess ? '#ffffff' : (theme === 'dark' ? '#1f2937' : '#ffffff'),
        divideColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
    });

    const getTdStyle = (isBold = false, isCenter = false) => ({
        color: isExportingProcess ? (isBold ? '#111827' : '#374151') : (theme === 'dark' ? (isBold ? '#ffffff' : '#d1d5db') : (isBold ? '#111827' : '#374151')),
        borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb'),
        textAlign: isCenter ? 'center' : 'left'
    });

    const filteredReports = useMemo(() => {
        let filtered = reports;
        if (startDate) {
            const start = new Date(`${startDate}T00:00:00`);
            filtered = filtered.filter(r => getReportCreationDate(r) >= start);
        }
        if (endDate) {
            const end = new Date(`${endDate}T23:59:59`);
            filtered = filtered.filter(r => getReportCreationDate(r) <= end);
        }
        return filtered;
    }, [reports, startDate, endDate]);

    const interventions = useMemo(() => {
        const data = [];
        filteredReports.forEach(report => {
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
                            data.push({
                                reportId: report.id,
                                reportNumber: report.reportNumber,
                                area: areaName,
                                techId: entry.tecnicoId,
                                techName: entry.tecnico || 'Desconocido',
                                start,
                                end,
                                duration: durationValue,
                                isResponsible: report.tecnicoResponsableId === entry.tecnicoId
                            });
                        }
                    }
                });
            });
        });
        return data;
    }, [filteredReports, timeUnit]);

    const allAreas = useMemo(() => Array.from(new Set(interventions.map(i => i.area))), [interventions]);
    const allTechs = useMemo(() => Array.from(new Set(interventions.map(i => i.techName))), [interventions]);

    const baseData = useMemo(() => {
        let data = interventions;
        if (selectedTech) data = data.filter(i => i.techId === selectedTech);
        if (selectedArea) data = data.filter(i => i.area === selectedArea);
        return data;
    }, [interventions, selectedTech, selectedArea]);

    const chartDataDefault = useMemo(() => {
        if (selectedArea) return [];
        const aggregated = {};
        allAreas.forEach(area => {
            aggregated[area] = { name: area };
            allTechs.forEach(tech => {
                aggregated[area][tech] = { total: 0, count: 0 };
            });
        });

        baseData.forEach(inv => {
            if (aggregated[inv.area] && aggregated[inv.area][inv.techName]) {
                aggregated[inv.area][inv.techName].total += inv.duration;
                aggregated[inv.area][inv.techName].count += 1;
            }
        });

        return Object.values(aggregated).map(areaData => {
            const result = { name: areaData.name };
            allTechs.forEach(tech => {
                const stats = areaData[tech];
                if (stats.count > 0) {
                    const val = Number((stats.total / stats.count).toFixed(2));
                    result[tech] = val > 0 ? val : 0.01;
                } else {
                    result[tech] = null;
                }
            });
            return result;
        });
    }, [baseData, allAreas, allTechs, selectedArea]);

    const chartDataArea = useMemo(() => {
        if (!selectedArea) return [];
        const aggregated = {};
        allTechs.forEach(tech => {
            aggregated[tech] = { name: tech, total: 0, count: 0 };
        });

        baseData.forEach(inv => {
            if (aggregated[inv.techName]) {
                aggregated[inv.techName].total += inv.duration;
                aggregated[inv.techName].count += 1;
            }
        });

        return Object.values(aggregated)
            .filter(d => d.count > 0)
            .map(d => {
                const val = Number((d.total / d.count).toFixed(2));
                return {
                    name: d.name,
                    Tiempo: val > 0 ? val : 0.01
                };
            });
    }, [baseData, allTechs, selectedArea]);

    const last10Reports = useMemo(() => {
        if (!selectedTech) return [];
        const userInterventions = interventions.filter(i => i.techId === selectedTech);
        const groupedByReport = {};

        userInterventions.forEach(inv => {
            if (!groupedByReport[inv.reportNumber]) {
                groupedByReport[inv.reportNumber] = {
                    reportNumber: inv.reportNumber,
                    areas: [],
                    totalTime: 0,
                    lastEndTime: inv.end
                };
            }
            groupedByReport[inv.reportNumber].areas.push({
                area: inv.area,
                time: inv.duration
            });
            groupedByReport[inv.reportNumber].totalTime += inv.duration;
            if (inv.end > groupedByReport[inv.reportNumber].lastEndTime) {
                groupedByReport[inv.reportNumber].lastEndTime = inv.end;
            }
        });

        return Object.values(groupedByReport)
            .sort((a, b) => b.lastEndTime - a.lastEndTime)
            .slice(0, 10);
    }, [interventions, selectedTech]);

    const responsibleReports = useMemo(() => {
        if (!selectedTech) return { list: [], avg: 0 };
        const reportsWhereResponsible = filteredReports.filter(r => r.tecnicoResponsableId === selectedTech);

        const list = reportsWhereResponsible.map(r => {
            const reportInvs = interventions.filter(i => i.reportId === r.id);
            if (reportInvs.length === 0) return { reportNumber: r.reportNumber, totalTime: 0 };

            const times = reportInvs.map(i => i.start.getTime()).concat(reportInvs.map(i => i.end.getTime()));
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);
            const totalMs = (maxTime - minTime);
            const totalDuration = timeUnit === 'hours' ? totalMs / (1000 * 60 * 60) : totalMs / (1000 * 60);

            return {
                reportNumber: r.reportNumber,
                totalTime: totalDuration
            };
        }).filter(r => r.totalTime > 0);

        const totalOverall = list.reduce((acc, curr) => acc + curr.totalTime, 0);
        const avg = list.length > 0 ? totalOverall / list.length : 0;

        return { list, avg };
    }, [filteredReports, interventions, selectedTech, timeUnit]);

    const areaTechBreakdown = useMemo(() => {
        if (!selectedArea) return [];
        const techGroups = {};

        baseData.forEach(inv => {
            if (!techGroups[inv.techName]) {
                techGroups[inv.techName] = [];
            }
            techGroups[inv.techName].push({
                reportNumber: inv.reportNumber,
                time: inv.duration
            });
        });

        return Object.entries(techGroups).map(([tech, reps]) => {
            reps.sort((a, b) => b.time - a.time);
            return {
                tech,
                reports: reps,
                max: reps[0],
                min: reps[reps.length - 1]
            };
        });
    }, [baseData, selectedArea]);

    if (isLoading) return <div className="p-8 text-center dark:text-gray-200">Cargando datos...</div>;

    const axisTextColor = isExportingProcess ? '#000000' : (theme === 'dark' ? '#E5E7EB' : '#374151');

    return (
        <div className="p-6">
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/reportes" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><FaArrowLeft /></Link>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reporte de Tiempos de Resolución</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={exportToPDF}
                            disabled={isExportingProcess}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors h-[38px]"
                        >
                            <FaFilePdf /> {isExportingProcess ? '...' : 'Exportar'}
                        </button>
                    </div>
                </div>
            </div>

            <div className={`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300 ${isExportingProcess ? 'bg-white !important' : ''}`} ref={reportRef}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1" style={{ color: isExportingProcess ? '#4b5563' : undefined }}>Fecha Creación Inicio</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" style={{ borderColor: isExportingProcess ? '#d1d5db' : undefined, color: isExportingProcess ? '#111827' : undefined, backgroundColor: isExportingProcess ? '#fff' : undefined }} />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1" style={{ color: isExportingProcess ? '#4b5563' : undefined }}>Fecha Creación Fin</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" style={{ borderColor: isExportingProcess ? '#d1d5db' : undefined, color: isExportingProcess ? '#111827' : undefined, backgroundColor: isExportingProcess ? '#fff' : undefined }} />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1" style={{ color: isExportingProcess ? '#4b5563' : undefined }}>Técnico</label>
                        <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" style={{ borderColor: isExportingProcess ? '#d1d5db' : undefined, color: isExportingProcess ? '#111827' : undefined, backgroundColor: isExportingProcess ? '#fff' : undefined }}>
                            <option value="">Todos los técnicos</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1" style={{ color: isExportingProcess ? '#4b5563' : undefined }}>Área</label>
                        <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" style={{ borderColor: isExportingProcess ? '#d1d5db' : undefined, color: isExportingProcess ? '#111827' : undefined, backgroundColor: isExportingProcess ? '#fff' : undefined }}>
                            <option value="">Todas las áreas</option>
                            {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1" style={{ color: isExportingProcess ? '#4b5563' : undefined }}>Unidad de Tiempo</label>
                        <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" style={{ borderColor: isExportingProcess ? '#d1d5db' : undefined, color: isExportingProcess ? '#111827' : undefined, backgroundColor: isExportingProcess ? '#fff' : undefined }}>
                            <option value="minutes">Minutos</option>
                            <option value="hours">Horas</option>
                        </select>
                    </div>
                </div>

                <div className="mb-10">
                    <h2 className="text-lg font-bold mb-4 border-b pb-2 transition-colors" style={{ color: isExportingProcess ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'), borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                        {selectedArea ? `Tiempos Promedio en Área: ${selectedArea}` : 'Tiempos Promedio por Área y Técnico'}
                    </h2>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={selectedArea ? chartDataArea : chartDataDefault} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' && !isExportingProcess ? '#4B5563' : '#e5e7eb'} />
                                <XAxis dataKey="name" tick={{ fill: axisTextColor }} stroke={isExportingProcess ? '#000000' : (theme === 'dark' ? '#E5E7EB' : '#374151')} />
                                <YAxis
                                    tick={{ fill: axisTextColor }}
                                    stroke={isExportingProcess ? '#000000' : (theme === 'dark' ? '#E5E7EB' : '#374151')}
                                    unit={timeUnit === 'hours' ? "h" : "m"}
                                    scale="log"
                                    domain={['auto', 'auto']}
                                    allowDataOverflow
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        backgroundColor: theme === 'dark' ? '#1F2937' : '#fff',
                                        color: theme === 'dark' ? '#fff' : '#000'
                                    }}
                                />
                                <Legend wrapperStyle={{ color: axisTextColor, paddingTop: '20px' }} />
                                {selectedArea ? (
                                    <Line type="monotone" dataKey="Tiempo" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} isAnimationActive={!isExportingProcess} connectNulls />
                                ) : (
                                    allTechs.filter(tech => !selectedTech || interventions.find(i => i.techId === selectedTech && i.techName === tech)).map((tech, idx) => (
                                        <Line key={tech} type="monotone" dataKey={tech} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={!isExportingProcess} connectNulls />
                                    ))
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {!selectedArea && (
                    <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4 border-b pb-2 transition-colors" style={{ color: isExportingProcess ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'), borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                            Resumen Promedios ({timeUnit === 'hours' ? 'Horas' : 'Minutos'})
                        </h3>
                        <div className="overflow-hidden border rounded-lg" style={getTableWrapperStyle()}>
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead style={getTheadStyle()}>
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r" style={getThStyle()}>Área</th>
                                        {allTechs.filter(tech => !selectedTech || interventions.find(i => i.techId === selectedTech && i.techName === tech)).map(tech => (
                                            <th key={tech} className="px-6 py-4 text-center text-xs font-extra-bold uppercase tracking-wider border-r" style={getThStyle()}>{tech}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={getTbodyStyle()}>
                                    {chartDataDefault.map((row, idx) => (
                                        <tr key={idx} className="transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r" style={getTdStyle(true)}>{row.name}</td>
                                            {allTechs.filter(tech => !selectedTech || interventions.find(i => i.techId === selectedTech && i.techName === tech)).map(tech => (
                                                <td key={tech} className="px-6 py-4 whitespace-nowrap text-sm text-center border-r" style={getTdStyle()}>{formatDuration(row[tech], timeUnit)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    {chartDataDefault.length === 0 && (
                                        <tr>
                                            <td colSpan={allTechs.length + 1} className="px-6 py-4 text-center text-gray-500" style={getTdStyle()}>
                                                No hay datos para el periodo seleccionado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {selectedArea && (
                    <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4 border-b pb-2 transition-colors" style={{ color: isExportingProcess ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'), borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                            Desglose por Técnico en {selectedArea}
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {areaTechBreakdown.map(data => (
                                <div key={data.tech} className="border rounded-lg overflow-hidden" style={getTableWrapperStyle()}>
                                    <div className="p-4" style={{ backgroundColor: isExportingProcess ? '#f9fafb' : (theme === 'dark' ? '#374151' : '#f9fafb'), borderBottom: `1px solid ${isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb')}` }}>
                                        <h4 className="font-bold text-lg" style={{ color: isExportingProcess ? '#111827' : (theme === 'dark' ? '#ffffff' : '#111827') }}>{data.tech}</h4>
                                        <div className="flex gap-4 mt-2 text-sm">
                                            <div className="px-3 py-1.5 rounded flex flex-col items-start" style={{ backgroundColor: isExportingProcess ? '#fee2e2' : (theme === 'dark' ? 'rgba(127, 29, 29, 0.3)' : '#fee2e2'), color: isExportingProcess ? '#b91c1c' : (theme === 'dark' ? '#fca5a5' : '#b91c1c') }}>
                                                <span className="font-bold text-xs uppercase mb-1">Mayor Tiempo</span>
                                                <span>{data.max.reportNumber} ({formatDuration(data.max.time, timeUnit)})</span>
                                            </div>
                                            <div className="px-3 py-1.5 rounded flex flex-col items-start" style={{ backgroundColor: isExportingProcess ? '#dcfce7' : (theme === 'dark' ? 'rgba(20, 83, 45, 0.3)' : '#dcfce7'), color: isExportingProcess ? '#15803d' : (theme === 'dark' ? '#86efac' : '#15803d') }}>
                                                <span className="font-bold text-xs uppercase mb-1">Menor Tiempo</span>
                                                <span>{data.min.reportNumber} ({formatDuration(data.min.time, timeUnit)})</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`overflow-y-auto ${isExportingProcess ? '' : 'max-h-60'}`}>
                                        <table className="min-w-full divide-y" style={{ divideColor: getTbodyStyle().divideColor }}>
                                            <thead style={getTheadStyle()}>
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-extra-bold uppercase tracking-wider border-r" style={getThStyle()}>Informe</th>
                                                    <th className="px-6 py-3 text-center text-xs font-extra-bold uppercase tracking-wider" style={getThStyle()}>Tiempo ({timeUnit === 'hours' ? 'h' : 'm'})</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y" style={getTbodyStyle()}>
                                                {data.reports.map((r, i) => (
                                                    <tr key={i} className="transition-colors">
                                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium border-r" style={getTdStyle(true)}>{r.reportNumber}</td>
                                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-center" style={getTdStyle()}>{formatDuration(r.time, timeUnit)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {selectedTech && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4 border-b pb-2 transition-colors" style={{ color: isExportingProcess ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'), borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                                Últimos 10 Informes Trabajados
                            </h3>
                            <div className="overflow-x-auto border rounded-lg overflow-hidden" style={getTableWrapperStyle()}>
                                <table className="min-w-full divide-y" style={{ divideColor: getTbodyStyle().divideColor }}>
                                    <thead style={getTheadStyle()}>
                                        <tr>
                                            <th className="px-4 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r" style={getThStyle()}>Informe</th>
                                            <th className="px-4 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r" style={getThStyle()}>Áreas Intervenidas</th>
                                            <th className="px-4 py-4 text-center text-xs font-extra-bold uppercase tracking-wider" style={getThStyle()}>Tiempo Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={getTbodyStyle()}>
                                        {last10Reports.map((r, idx) => (
                                            <tr key={idx} className="transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold border-r" style={getTdStyle(true)}>{r.reportNumber}</td>
                                                <td className="px-4 py-4 text-sm border-r" style={getTdStyle()}>
                                                    {r.areas.map((a, i) => (
                                                        <div key={i} className="mb-1">{a.area}: <span className="font-semibold">{formatDuration(a.time, timeUnit)}</span></div>
                                                    ))}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold" style={getTdStyle(true, true)}>{formatDuration(r.totalTime, timeUnit)}</td>
                                            </tr>
                                        ))}
                                        {last10Reports.length === 0 && (
                                            <tr><td colSpan="3" className="px-4 py-4 text-center" style={getTdStyle()}>No hay registros recientes.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-4 border-b pb-2 transition-colors" style={{ color: isExportingProcess ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'), borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                                Informes como Responsable
                            </h3>
                            <div className="mb-6 p-6 rounded-lg border text-center font-bold text-xl shadow-sm flex flex-col items-center justify-center gap-2" style={{ backgroundColor: isExportingProcess ? '#eff6ff' : (theme === 'dark' ? 'rgba(30, 58, 138, 0.2)' : '#eff6ff'), borderColor: isExportingProcess ? '#bfdbfe' : (theme === 'dark' ? '#1e40af' : '#bfdbfe'), color: isExportingProcess ? '#1e3a8a' : (theme === 'dark' ? '#bfdbfe' : '#1e3a8a') }}>
                                <span className="text-sm font-normal uppercase tracking-wide opacity-80" style={{ color: isExportingProcess ? '#1e40af' : (theme === 'dark' ? '#93c5fd' : '#1e40af') }}>Promedio Total de Resolución</span>
                                <div className="flex items-center gap-2">
                                    <FaClock className="text-2xl" />
                                    <span>{formatDuration(responsibleReports.avg, timeUnit)}</span>
                                </div>
                            </div>
                            <div className={`overflow-x-auto border rounded-lg overflow-hidden ${isExportingProcess ? '' : 'max-h-96'}`} style={getTableWrapperStyle()}>
                                <table className="min-w-full divide-y" style={{ divideColor: getTbodyStyle().divideColor }}>
                                    <thead style={getTheadStyle()}>
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r" style={getThStyle()}>Informe</th>
                                            <th className="px-6 py-4 text-center text-xs font-extra-bold uppercase tracking-wider" style={getThStyle()}>Tiempo Total Ciclo Vida</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={getTbodyStyle()}>
                                        {responsibleReports.list.map((r, idx) => (
                                            <tr key={idx} className="transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r" style={getTdStyle(true)}>{r.reportNumber}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center" style={getTdStyle()}>{formatDuration(r.totalTime, timeUnit)}</td>
                                            </tr>
                                        ))}
                                        {responsibleReports.list.length === 0 && (
                                            <tr><td colSpan="2" className="px-6 py-4 text-center" style={getTdStyle()}>No es responsable de ningún informe en este rango.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TiemposResolucion;