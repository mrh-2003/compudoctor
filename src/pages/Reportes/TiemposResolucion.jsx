import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { getAllUsersDetailed } from '../../services/userService';

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

const formatDuration = (hours) => {
    if (isNaN(hours) || hours === null) return '0.00h';
    return `${hours.toFixed(2)}h`;
};

const TiemposResolucion = () => {
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedTech, setSelectedTech] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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
                            const durationHours = durationMs / (1000 * 60 * 60);
                            data.push({
                                reportId: report.id,
                                reportNumber: report.reportNumber,
                                area: areaName,
                                techId: entry.tecnicoId,
                                techName: entry.tecnico || 'Desconocido',
                                start,
                                end,
                                durationHours,
                                isResponsible: report.tecnicoResponsableId === entry.tecnicoId
                            });
                        }
                    }
                });
            });
        });
        return data;
    }, [filteredReports]);

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
                aggregated[inv.area][inv.techName].total += inv.durationHours;
                aggregated[inv.area][inv.techName].count += 1;
            }
        });

        return Object.values(aggregated).map(areaData => {
            const result = { name: areaData.name };
            allTechs.forEach(tech => {
                const stats = areaData[tech];
                result[tech] = stats.count > 0 ? Number((stats.total / stats.count).toFixed(2)) : 0;
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
                aggregated[inv.techName].total += inv.durationHours;
                aggregated[inv.techName].count += 1;
            }
        });

        return Object.values(aggregated)
            .filter(d => d.count > 0)
            .map(d => ({
                name: d.name,
                Tiempo: Number((d.total / d.count).toFixed(2))
            }));
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
                time: inv.durationHours
            });
            groupedByReport[inv.reportNumber].totalTime += inv.durationHours;
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
            const totalHours = (maxTime - minTime) / (1000 * 60 * 60);
            
            return {
                reportNumber: r.reportNumber,
                totalTime: totalHours
            };
        }).filter(r => r.totalTime > 0);

        const totalOverall = list.reduce((acc, curr) => acc + curr.totalTime, 0);
        const avg = list.length > 0 ? totalOverall / list.length : 0;

        return { list, avg };
    }, [filteredReports, interventions, selectedTech]);

    const areaTechBreakdown = useMemo(() => {
        if (!selectedArea) return [];
        const techGroups = {};
        
        baseData.forEach(inv => {
            if (!techGroups[inv.techName]) {
                techGroups[inv.techName] = [];
            }
            techGroups[inv.techName].push({
                reportNumber: inv.reportNumber,
                time: inv.durationHours
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

    if (isLoading) return <div className="p-8 text-center text-gray-500 font-bold">Cargando datos...</div>;

    return (
        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Reporte de Tiempos de Resolución</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">Fecha Creación Inicio</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">Fecha Creación Fin</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">Técnico</label>
                    <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="">Todos los técnicos</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">Área</label>
                    <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="">Todas las áreas</option>
                        {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            <div className="mb-10 bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h2 className="text-lg font-bold mb-4 text-gray-700 dark:text-gray-200">
                    {selectedArea ? `Tiempos Promedio en Área: ${selectedArea}` : 'Tiempos Promedio por Área y Técnico'}
                </h2>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedArea ? chartDataArea : chartDataDefault} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                            <XAxis dataKey="name" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" unit="h" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#f3f4f6', border: 'none' }} />
                            <Legend />
                            {selectedArea ? (
                                <Line type="monotone" dataKey="Tiempo" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                            ) : (
                                allTechs.filter(tech => !selectedTech || interventions.find(i => i.techId === selectedTech && i.techName === tech)).map((tech, idx) => (
                                    <Line key={tech} type="monotone" dataKey={tech} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                ))
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {!selectedArea && (
                <div className="mb-10">
                    <h3 className="text-md font-bold mb-3 text-gray-700 dark:text-gray-200">Resumen Promedios (Horas)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    <th className="p-3 border dark:border-gray-600">Área</th>
                                    {allTechs.filter(tech => !selectedTech || interventions.find(i => i.techId === selectedTech && i.techName === tech)).map(tech => (
                                        <th key={tech} className="p-3 border dark:border-gray-600">{tech}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {chartDataDefault.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">
                                        <td className="p-3 border dark:border-gray-600 font-bold">{row.name}</td>
                                        {allTechs.filter(tech => !selectedTech || interventions.find(i => i.techId === selectedTech && i.techName === tech)).map(tech => (
                                            <td key={tech} className="p-3 border dark:border-gray-600">{formatDuration(row[tech])}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedArea && (
                <div className="mb-10">
                    <h3 className="text-md font-bold mb-3 text-gray-700 dark:text-gray-200">Desglose por Técnico en {selectedArea}</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {areaTechBreakdown.map(data => (
                            <div key={data.tech} className="bg-gray-50 dark:bg-gray-800 p-4 rounded border dark:border-gray-700">
                                <h4 className="font-bold text-lg mb-2 dark:text-white">{data.tech}</h4>
                                <div className="flex gap-4 mb-4 text-sm">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                                        <span className="font-bold block">Mayor Tiempo</span>
                                        {data.max.reportNumber} ({formatDuration(data.max.time)})
                                    </div>
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                                        <span className="font-bold block">Menor Tiempo</span>
                                        {data.min.reportNumber} ({formatDuration(data.min.time)})
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-white dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="p-2 border-b dark:border-gray-600">Informe</th>
                                                <th className="p-2 border-b dark:border-gray-600">Tiempo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.reports.map((r, i) => (
                                                <tr key={i} className="hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-300">
                                                    <td className="p-2 border-b dark:border-gray-700">{r.reportNumber}</td>
                                                    <td className="p-2 border-b dark:border-gray-700">{formatDuration(r.time)}</td>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-md font-bold mb-3 text-gray-700 dark:text-gray-200">Últimos 10 Informes Trabajados</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                        <th className="p-3 border dark:border-gray-600">Informe</th>
                                        <th className="p-3 border dark:border-gray-600">Áreas Intervenidas</th>
                                        <th className="p-3 border dark:border-gray-600">Tiempo Total (Áreas)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {last10Reports.map((r, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">
                                            <td className="p-3 border dark:border-gray-600 font-bold">{r.reportNumber}</td>
                                            <td className="p-3 border dark:border-gray-600">
                                                {r.areas.map((a, i) => (
                                                    <div key={i} className="mb-1">{a.area}: {formatDuration(a.time)}</div>
                                                ))}
                                            </td>
                                            <td className="p-3 border dark:border-gray-600 font-bold">{formatDuration(r.totalTime)}</td>
                                        </tr>
                                    ))}
                                    {last10Reports.length === 0 && (
                                        <tr><td colSpan="3" className="p-4 text-center text-gray-500">No hay registros recientes.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-md font-bold mb-3 text-gray-700 dark:text-gray-200">Informes como Responsable</h3>
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800">
                            <span className="text-blue-800 dark:text-blue-300 font-bold text-lg">Promedio Total de Resolución: {formatDuration(responsibleReports.avg)}</span>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                                    <tr>
                                        <th className="p-3 border dark:border-gray-600">Informe</th>
                                        <th className="p-3 border dark:border-gray-600">Tiempo Total Ciclo Vida</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {responsibleReports.list.map((r, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300">
                                            <td className="p-3 border dark:border-gray-600 font-bold">{r.reportNumber}</td>
                                            <td className="p-3 border dark:border-gray-600">{formatDuration(r.totalTime)}</td>
                                        </tr>
                                    ))}
                                    {responsibleReports.list.length === 0 && (
                                        <tr><td colSpan="2" className="p-4 text-center text-gray-500">No es responsable de ningún informe en este rango.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TiemposResolucion;