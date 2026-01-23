import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { FaFilePdf, FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';

const COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1',
    '#EC4899', '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4',
    '#84CC16', '#A855F7', '#D946EF', '#E11D48', '#22D3EE'
];

function TopServicios() {
    const { theme } = useContext(ThemeContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExportingProcess, setIsExportingProcess] = useState(false);

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

    const chartData = useMemo(() => {
        const counts = {};
        let total = 0;

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
            if (!isDateInRange(report.fecha)) return;

            if (report.servicesList && Array.isArray(report.servicesList)) {
                report.servicesList.forEach(service => {
                    const name = typeof service === 'string' ? service : service.name;
                    if (name) {
                        counts[name] = (counts[name] || 0) + 1;
                        total++;
                    }
                });
            }

            if (report.diagnosticoPorArea) {
                Object.values(report.diagnosticoPorArea).forEach(areaItems => {
                    if (Array.isArray(areaItems)) {
                        areaItems.forEach(item => {
                            Object.entries(item).forEach(([key, value]) => {
                                if (value === true) {
                                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                    counts[formattedKey] = (counts[formattedKey] || 0) + 1;
                                    total++;
                                }
                            });
                        });
                    }
                });
            }
        });

        return Object.entries(counts)
            .map(([name, value]) => ({
                name,
                value,
                percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [reports, startDate, endDate]);

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
                pdf.text("Top de Servicios Realizados", pdfWidth / 2, 15, { align: 'center' });

                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                const rangeText = `Periodo: ${startDate} al ${endDate}`;
                pdf.text(rangeText, pdfWidth / 2, 22, { align: 'center' });

                pdf.addImage(imgData, 'PNG', margin, 30, contentWidth, imgHeight);
                pdf.save(`Top_Servicios_${startDate}_${endDate}.pdf`);

            } catch (err) {
                console.error("Export Error:", err);
            } finally {
                setIsExportingProcess(false);
            }
        }, 100);
    };

    const axisTextColor = isExportingProcess ? '#000000' : (theme === 'dark' ? '#E5E7EB' : '#374151');
    const labelTextColor = isExportingProcess ? '#000000' : (theme === 'dark' ? '#000000' : '#374151');

    if (loading) return <div className="p-8 text-center dark:text-gray-200">Cargando datos...</div>;

    return (
        <div className="p-6">
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/reportes" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><FaArrowLeft /></Link>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Top de Servicios Realizados</h1>
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
                        Distribución de Servicios (Top 10)
                    </h2>

                    <div className="h-[500px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' && !isExportingProcess ? '#4B5563' : '#e5e7eb'} />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                    tick={{ fill: axisTextColor, fontSize: 11, fontWeight: 500 }}
                                    height={100}
                                />
                                <YAxis
                                    tick={{ fill: axisTextColor, fontSize: 12 }}
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
                                <Bar dataKey="value" name="Cantidad" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        style={{ fontSize: '14px', fontWeight: 'bold', fill: labelTextColor }}
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
                        Detalle de Servicios ({startDate} al {endDate})
                    </h3>
                    <div className="overflow-hidden border rounded-lg" style={{ borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb') }}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead style={{ backgroundColor: isExportingProcess ? '#f3f4f6' : (theme === 'dark' ? '#374151' : '#f3f4f6') }}>
                                <tr>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{
                                            color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'),
                                            borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb')
                                        }}
                                    >
                                        Servicio
                                    </th>
                                    <th
                                        className="px-6 py-4 text-center text-xs font-extra-bold uppercase tracking-wider border-r"
                                        style={{
                                            color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563'),
                                            borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#4b5563' : '#e5e7eb')
                                        }}
                                    >
                                        Cantidad
                                    </th>
                                    <th
                                        className="px-6 py-4 text-center text-xs font-extra-bold uppercase tracking-wider"
                                        style={{ color: isExportingProcess ? '#4b5563' : (theme === 'dark' ? '#e5e7eb' : '#4b5563') }}
                                    >
                                        Porcentaje
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
                                {chartData.map((item, index) => (
                                    <tr key={index} className="transition-colors">
                                        <td
                                            className="px-6 py-4 whitespace-nowrap text-sm font-bold border-r"
                                            style={{
                                                color: isExportingProcess ? '#111827' : (theme === 'dark' ? '#ffffff' : '#111827'),
                                                borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                                            }}
                                        >
                                            {item.name}
                                        </td>
                                        <td
                                            className="px-6 py-4 whitespace-nowrap text-sm text-center border-r"
                                            style={{
                                                color: isExportingProcess ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151'),
                                                borderColor: isExportingProcess ? '#e5e7eb' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                                            }}
                                        >
                                            {item.value}
                                        </td>
                                        <td
                                            className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold"
                                            style={{ color: isExportingProcess ? '#374151' : (theme === 'dark' ? '#d1d5db' : '#374151') }}
                                        >
                                            {item.percentage}%
                                        </td>
                                    </tr>
                                ))}
                                {chartData.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                            No hay datos para el periodo seleccionado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TopServicios;
