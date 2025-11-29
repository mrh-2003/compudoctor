import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { FaFilePdf, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function TiemposResolucion() {
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
        const areaStats = {};

        reports.forEach(report => {
            const area = report.area || 'SIN AREA';
            if (!areaStats[area]) {
                areaStats[area] = { name: area, totalHours: 0, count: 0 };
            }

            // Determine Start Time
            let startDate = null;
            if (report.createdAt && report.createdAt.seconds) {
                startDate = new Date(report.createdAt.seconds * 1000);
            } else if (report.fecha && report.hora) {
                const [d, m, y] = report.fecha.split('-');
                const [h, min] = report.hora.split(':');
                startDate = new Date(y, m - 1, d, h, min);
            }

            // Determine End Time
            // Priority: fecha_fin/hora_fin in diagnosticoPorArea -> fechaEntrega/horaEntrega -> null
            let endDate = null;

            // Check diagnosticoPorArea for specific finish time
            if (report.diagnosticoPorArea && report.diagnosticoPorArea[area]) {
                const areaItems = report.diagnosticoPorArea[area];
                if (Array.isArray(areaItems) && areaItems.length > 0) {
                    const lastItem = areaItems[areaItems.length - 1];
                    if (lastItem.fecha_fin && lastItem.hora_fin) {
                        const [d, m, y] = lastItem.fecha_fin.split('-');
                        const [h, min] = lastItem.hora_fin.split(':');
                        endDate = new Date(y, m - 1, d, h, min);
                    }
                }
            }

            // Fallback to fechaEntrega if no specific technical finish time
            if (!endDate && report.fechaEntrega && report.horaEntrega) {
                const [d, m, y] = report.fechaEntrega.split('-');
                const [h, min] = report.horaEntrega.split(':');
                endDate = new Date(y, m - 1, d, h, min);
            }

            if (startDate && endDate && endDate > startDate) {
                const diffMs = endDate - startDate;
                const diffHours = diffMs / (1000 * 60 * 60);
                areaStats[area].totalHours += diffHours;
                areaStats[area].count += 1;
            }
        });

        return Object.values(areaStats).map(stat => ({
            name: stat.name,
            avgTime: stat.count > 0 ? parseFloat((stat.totalHours / stat.count).toFixed(2)) : 0
        }));
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
            // Landscape for this chart
            const pdfWidth = 297; // A4 landscape width
            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);

            const img = new Image();
            img.src = imgData;
            await new Promise(resolve => img.onload = resolve);

            const imgHeight = (img.height * contentWidth) / img.width;
            const totalHeight = imgHeight + 30; // Title + margins

            const pdf = new jsPDF({
                orientation: 'l',
                unit: 'mm',
                format: [pdfWidth, Math.max(totalHeight, 210)] // Min height A4 landscape
            });

            pdf.setFontSize(16);
            pdf.text("Tiempos Promedio de Resolución por Área", margin, 15);
            pdf.addImage(imgData, 'PNG', margin, 25, contentWidth, imgHeight);
            pdf.save("Tiempos_Resolucion.pdf");
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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tiempos de Resolución</h1>
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
                <h2 className="text-xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">Tiempo Promedio (Horas)</h2>
                {/* Reduced height from 500px to 350px */}
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Horas', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => `${value} hrs`} />
                            <Legend />
                            <Bar dataKey="avgTime" name="Tiempo Promedio" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {data.length === 0 && (
                    <p className="text-center text-gray-500 mt-4">No hay datos suficientes para calcular tiempos.</p>
                )}
            </div>
        </div>
    );
}

export default TiemposResolucion;
