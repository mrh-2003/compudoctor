import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { FaFilePdf, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

function TopServicios() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
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

    const data = useMemo(() => {
        const counts = {};

        reports.forEach(report => {
            // Count from servicesList (if available)
            if (report.servicesList && Array.isArray(report.servicesList)) {
                report.servicesList.forEach(service => {
                    const name = typeof service === 'string' ? service : service.name;
                    if (name) counts[name] = (counts[name] || 0) + 1;
                });
            }

            // Count booleans in diagnosticoPorArea
            if (report.diagnosticoPorArea) {
                Object.values(report.diagnosticoPorArea).forEach(areaItems => {
                    if (Array.isArray(areaItems)) {
                        areaItems.forEach(item => {
                            Object.entries(item).forEach(([key, value]) => {
                                if (value === true) {
                                    // Format key: repoten_ssd -> Repoten Ssd
                                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                    counts[formattedKey] = (counts[formattedKey] || 0) + 1;
                                }
                            });
                        });
                    }
                });
            }
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10
    }, [reports]);

    const exportToPDF = async () => {
        if (chartRef.current === null) return;
        setIsExporting(true);
        try {
            const element = chartRef.current;

            // Capture full content
            const canvas = await toPng(element, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                width: element.scrollWidth,
                height: element.scrollHeight,
                style: {
                    overflow: 'visible',
                    height: 'auto',
                    maxHeight: 'none'
                }
            });

            const imgData = canvas;
            const pdfWidth = 210; // A4 width in mm
            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);

            const img = new Image();
            img.src = imgData;
            await new Promise(resolve => img.onload = resolve);

            const imgHeight = (img.height * contentWidth) / img.width;
            const totalHeight = imgHeight + 30; // Title + margins

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [pdfWidth, Math.max(totalHeight, 297)]
            });

            pdf.setFontSize(16);
            pdf.text("Top de Servicios y Fallas Más Comunes", margin, 15);
            pdf.addImage(imgData, 'PNG', margin, 25, contentWidth, imgHeight);
            pdf.save("Top_Servicios.pdf");
        } catch (err) {
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando datos...</div>;

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/reportes" className="text-gray-500 hover:text-gray-700"><FaArrowLeft /></Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Top Servicios y Fallas</h1>
                </div>
                <button
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    <FaFilePdf /> {isExporting ? 'Exportando...' : 'Exportar PDF'}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md" ref={chartRef}>
                <h2 className="text-xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">Distribución de Servicios (Top 10)</h2>
                {/* Reduced height from 500px to 350px */}
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {data.length === 0 && (
                    <p className="text-center text-gray-500 mt-4">No hay datos suficientes para mostrar el gráfico.</p>
                )}
            </div>
        </div>
    );
}

export default TopServicios;
