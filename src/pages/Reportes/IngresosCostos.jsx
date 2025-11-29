import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { FaFilePdf, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function IngresosCostos() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [isExporting, setIsExporting] = useState(false);
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAllDiagnosticReports();
                // Normalize dates
                const normalizedData = data.map(r => {
                    let date = r.createdAt;
                    if (date && date.seconds) {
                        date = new Date(date.seconds * 1000);
                    } else if (typeof date === 'string') {
                        date = new Date(date);
                    } else if (!date && r.fecha) {
                        // Fallback to fecha string DD-MM-YYYY
                        const parts = r.fecha.split('-');
                        if (parts.length === 3) date = new Date(parts[2], parts[1] - 1, parts[0]);
                    }
                    return { ...r, normalizedDate: date };
                });
                setReports(normalizedData);
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const data = useMemo(() => {
        if (!selectedMonth) return [];

        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyStats = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            ingresoTotal: 0,
            ingresoDiagnostico: 0
        }));

        reports.forEach(report => {
            if (!report.normalizedDate) return;

            if (report.normalizedDate.getFullYear() === year && report.normalizedDate.getMonth() === month - 1) {
                const day = report.normalizedDate.getDate();
                const stats = dailyStats[day - 1];

                // User requested 'total' and 'diagnostico'. Fallback to 'montoServicio' if 'total' missing.
                const total = parseFloat(report.total) || parseFloat(report.montoServicio) || 0;
                const diagnostico = parseFloat(report.diagnostico) || 0; // Assuming 'diagnostico' field exists

                stats.ingresoTotal += total;
                stats.ingresoDiagnostico += diagnostico;
            }
        });

        return dailyStats;
    }, [reports, selectedMonth]);

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
            pdf.text(`Ingresos vs Costos - ${selectedMonth}`, margin, 15);
            pdf.addImage(imgData, 'PNG', margin, 25, contentWidth, imgHeight);
            pdf.save("Ingresos_vs_Costos.pdf");
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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ingresos vs Costos</h1>
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

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md" ref={chartRef}>
                <h2 className="text-xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">Evolución Diaria de Ingresos</h2>
                {/* Reduced height from 500px to 350px */}
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" label={{ value: 'Día del Mes', position: 'insideBottomRight', offset: -10 }} />
                            <YAxis label={{ value: 'Soles (S/)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => `S/ ${value.toFixed(2)}`} />
                            <Legend />
                            <Line type="monotone" dataKey="ingresoTotal" name="Ingreso Total" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                            <Line type="monotone" dataKey="ingresoDiagnostico" name="Ingreso Diagnóstico" stroke="#82ca9d" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default IngresosCostos;
