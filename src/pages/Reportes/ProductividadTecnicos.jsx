import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { FaFilePdf, FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import Select from 'react-select';

const COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1',
    '#EC4899', '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4',
    '#84CC16', '#A855F7', '#D946EF', '#E11D48', '#22D3EE'
];

function ProductividadTecnicos() {
    const { theme } = useContext(ThemeContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExportingProcess, setIsExportingProcess] = useState(false);

    const [selectedArea, setSelectedArea] = useState({ value: 'TODAS', label: 'Todas las Áreas' });

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        return date.toISOString().split('T')[0];
    });

    const chartRef = useRef(null);

    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
            borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
            color: theme === 'dark' ? '#ffffff' : '#000000',
        }),
        singleValue: (base) => ({
            ...base,
            color: theme === 'dark' ? '#ffffff' : '#1F2937',
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: theme === 'dark' ? '#1F2937' : '#ffffff',
            zIndex: 9999
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused
                ? (theme === 'dark' ? '#4B5563' : '#E5E7EB')
                : (theme === 'dark' ? '#1F2937' : '#ffffff'),
            color: theme === 'dark' ? '#ffffff' : '#1F2937',
            cursor: 'pointer'
        }),
        input: (base) => ({
            ...base,
            color: theme === 'dark' ? '#ffffff' : '#000000',
        }),
        placeholder: (base) => ({
            ...base,
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        })
    };

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

    const { processedData, availableAreas, chartData } = useMemo(() => {
        const stats = {};
        const allAreasSet = new Set(['RECEPCIÓN', 'DIAGNÓSTICO INICIAL', 'TESTEO']);

        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts[0].length === 4) return new Date(dateStr);
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
            return null;
        };

        const start = startDate ? new Date(startDate) : new Date('2000-01-01');
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const isDateInRange = (dateStr) => {
            const d = parseDate(dateStr);
            if (!d) return false;
            return d >= start && d <= end;
        };

        reports.forEach(report => {
            const reportDateValid = isDateInRange(report.fecha);

            const track = (tech, area, specificDate = null) => {
                if (!tech || tech === 'N/A' || tech === 'Sin Asignar') return;

                const isValid = specificDate ? isDateInRange(specificDate) : reportDateValid;

                if (isValid) {
                    const normalizeTech = tech.trim();
                    const normalizeArea = area.toUpperCase();

                    if (!stats[normalizeTech]) {
                        stats[normalizeTech] = { name: normalizeTech, total: 0, areas: {} };
                    }
                    if (!stats[normalizeTech].areas[normalizeArea]) {
                        stats[normalizeTech].areas[normalizeArea] = 0;
                    }

                    return `${normalizeTech}|${normalizeArea}`;
                }
                return null;
            };

            const reportContributions = new Set();

            const r1 = track(report.tecnicoRecepcion, 'RECEPCIÓN');
            if (r1) reportContributions.add(r1);

            const r2 = track(report.tecnicoInicial, 'DIAGNÓSTICO INICIAL');
            if (r2) reportContributions.add(r2);

            const r3 = track(report.tecnicoTesteo, 'TESTEO');
            if (r3) reportContributions.add(r3);

            if (report.diagnosticoPorArea) {
                Object.entries(report.diagnosticoPorArea).forEach(([areaName, entries]) => {
                    if (Array.isArray(entries)) {
                        entries.forEach(entry => {
                            const rDyn = track(entry.tecnico, areaName, entry.fecha_inicio || report.fecha);
                            if (rDyn) reportContributions.add(rDyn);
                        });
                    }
                });
            }

            reportContributions.forEach(item => {
                const [tech, area] = item.split('|');

                if (!stats[tech]) stats[tech] = { name: tech, total: 0, areas: {} };
                if (!stats[tech].areas[area]) stats[tech].areas[area] = 0;

                stats[tech].areas[area] += 1;
                stats[tech].total += 1;
                allAreasSet.add(area);
            });
        });

        const processedArray = Object.values(stats)
            .map(tech => ({
                ...tech,
                areasEntries: Object.entries(tech.areas).sort((a, b) => b[1] - a[1])
            }))
            .sort((a, b) => b.total - a.total);

        let chartDataGenerated = [];

        const currentAreaValue = selectedArea.value;

        if (currentAreaValue === 'TODAS') {
            chartDataGenerated = processedArray.map(tech => ({
                name: tech.name,
                count: tech.total
            }));
        } else {
            chartDataGenerated = processedArray
                .map(tech => ({
                    name: tech.name,
                    count: tech.areas[currentAreaValue] || 0
                }))
                .filter(item => item.count > 0)
                .sort((a, b) => b.count - a.count);
        }

        const areaOptions = [
            { value: 'TODAS', label: 'Todas las Áreas' },
            ...Array.from(allAreasSet).sort().map(area => ({ value: area, label: area }))
        ];

        return {
            processedData: processedArray,
            availableAreas: areaOptions,
            chartData: chartDataGenerated
        };
    }, [reports, selectedArea, startDate, endDate]);


    const exportToPDF = async () => {
        if (chartRef.current === null) return;

        setIsExportingProcess(true);

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
                pdf.text("Reporte de Productividad por Técnico", pdfWidth / 2, 15, { align: 'center' });

                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                const rangeText = `Periodo: ${startDate} al ${endDate}`;
                pdf.text(rangeText, pdfWidth / 2, 22, { align: 'center' });

                pdf.addImage(imgData, 'PNG', margin, 30, contentWidth, imgHeight);
                pdf.save(`Productividad_Tecnicos_${startDate}_${endDate}.pdf`);

            } catch (err) {
                console.error("Export Error:", err);
            } finally {
                setIsExportingProcess(false);
            }
        }, 100);
    };

    const axisTextColor = isExportingProcess ? '#000000' : (theme === 'dark' ? '#E5E7EB' : '#374151');
    const labelTextColor = isExportingProcess ? '#000000' : (theme === 'dark' ? '#FFFFFF' : '#374151');

    if (loading) return <div className="p-8 text-center dark:text-gray-200">Cargando datos...</div>;

    return (
        <div className="p-6">
            {/* Header & Controls */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/reportes" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><FaArrowLeft /></Link>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Productividad de Técnicos</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm border dark:border-gray-600">
                            <FaCalendarAlt className="text-gray-400 dark:text-gray-300 ml-1" />
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-200 focus:ring-0 outline-none p-0 w-32"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-200 focus:ring-0 outline-none p-0 w-32"
                                />
                            </div>
                        </div>

                        <div className="w-64">
                            <Select
                                value={selectedArea}
                                onChange={setSelectedArea}
                                options={availableAreas}
                                styles={customSelectStyles}
                                placeholder="Filtrar por Área..."
                                isSearchable={false}
                            />
                        </div>

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

            <div className={`bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300 ${isExportingProcess ? 'bg-white !important' : ''}`} ref={chartRef}>

                <div className="mb-10">
                    <h2
                        className="text-xl font-bold mb-6 text-center uppercase tracking-wide transition-colors"
                        style={{ color: isExportingProcess ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937') }}
                    >
                        Tickets Atendidos - {selectedArea.label}
                    </h2>

                    <div className="h-[450px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ top: 5, right: 50, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke={theme === 'dark' && !isExportingProcess ? '#4B5563' : '#e5e7eb'} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={140}
                                    tick={{ fill: axisTextColor, fontSize: 13, fontWeight: 600 }}
                                    interval={0}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        backgroundColor: theme === 'dark' ? '#1F2937' : '#fff',
                                        color: theme === 'dark' ? '#fff' : '#000'
                                    }}
                                    cursor={{ fill: theme === 'dark' && !isExportingProcess ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="count" name="Tickets" radius={[0, 6, 6, 0]} barSize={35} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <LabelList
                                        dataKey="count"
                                        position="right"
                                        style={{ fontSize: '15px', fontWeight: 'bold', fill: labelTextColor }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="mt-8">
                    <h3
                        className="text-lg font-bold mb-4 border-b pb-2 transition-colors"
                        style={{
                            color: isExportingProcess ? '#000' : (theme === 'dark' ? '#F3F4F6' : '#1F2937'),
                            borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                        }}
                    >
                        Detalle de Actividad por Área ({startDate} al {endDate})
                    </h3>
                    <div className="overflow-hidden border rounded-lg" style={{ borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="" style={{ backgroundColor: isExportingProcess ? '#f3f4f6' : (theme === 'dark' ? '#374151' : '#f3f4f6') }}>
                                <tr>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{
                                            color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'),
                                            borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb')
                                        }}
                                    >
                                        Técnico
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{
                                            color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'),
                                            borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb')
                                        }}
                                    >
                                        Área
                                    </th>
                                    <th
                                        className="px-6 py-4 text-center text-xs font-extra-bold uppercase tracking-wider"
                                        style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}
                                    >
                                        Cantidad
                                    </th>
                                </tr>
                            </thead>
                            <tbody
                                className="divide-y"
                                style={{
                                    backgroundColor: isExportingProcess ? '#ffffff' : (theme === 'dark' ? '#1f2937' : '#ffffff'),
                                    divideColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                                }}
                            >
                                {processedData.map((tech, techIndex) => {
                                    const areasToShow = selectedArea.value === 'TODAS'
                                        ? tech.areasEntries
                                        : tech.areasEntries.filter(([area]) => area === selectedArea.value);

                                    if (areasToShow.length === 0) return null;

                                    return areasToShow.map(([area, count], areaIndex) => (
                                        <tr key={`${tech.name}-${area}`} className="transition-colors">
                                            {areaIndex === 0 && (
                                                <td
                                                    className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r align-middle"
                                                    style={{
                                                        color: isExportingProcess ? '#111827' : (theme === 'dark' ? '#ffffff' : '#111827'),
                                                        borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                                                        backgroundColor: isExportingProcess ? '#ffffff' : (theme === 'dark' ? '#1f2937' : '#ffffff')
                                                    }}
                                                    rowSpan={areasToShow.length}
                                                >
                                                    {tech.name}
                                                    {selectedArea.value === 'TODAS' && (
                                                        <span
                                                            className="block text-xs font-normal mt-1"
                                                            style={{ color: isExportingProcess ? '#6b7280' : (theme === 'dark' ? '#9ca3af' : '#6b7280') }}
                                                        >
                                                            Total: {tech.total}
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            <td
                                                className="px-6 py-4 whitespace-nowrap text-sm border-r"
                                                style={{ borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}
                                            >
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                    ${area === 'RECEPCIÓN' ? 'bg-blue-100 text-blue-800' : ''}
                                                    ${area === 'TESTEO' ? 'bg-purple-100 text-purple-800' : ''}
                                                    ${area === 'DIAGNÓSTICO INICIAL' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                    ${area === 'HARDWARE' ? 'bg-red-100 text-red-800' : ''}
                                                    ${area === 'SOFTWARE' ? 'bg-green-100 text-green-800' : ''}
                                                    ${!['RECEPCIÓN', 'TESTEO', 'DIAGNÓSTICO INICIAL', 'HARDWARE', 'SOFTWARE'].includes(area) ? 'bg-gray-100 text-gray-800' : ''}
                                                `}>
                                                    {area}
                                                </span>
                                            </td>
                                            <td
                                                className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold"
                                                style={{ color: isExportingProcess ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}
                                            >
                                                {count}
                                            </td>
                                        </tr>
                                    ));
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductividadTecnicos;
