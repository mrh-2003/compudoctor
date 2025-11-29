import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { FaFilePdf, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function ProductividadTecnicos() {
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
        const technicianStats = {};

        reports.forEach(report => {
            const tech = report.tecnicoResponsable || 'Sin Asignar';
            if (!technicianStats[tech]) {
                technicianStats[tech] = { name: tech, terminados: 0, totalMonto: 0 };
            }

            if (report.estado === 'TERMINADO') {
                technicianStats[tech].terminados += 1;
                technicianStats[tech].totalMonto += (parseFloat(report.montoServicio) || 0);
            }
        });

        return Object.values(technicianStats).sort((a, b) => b.terminados - a.terminados);
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
            pdf.text("Ranking de Productividad de Técnicos", margin, 15);
            pdf.addImage(imgData, 'PNG', margin, 25, contentWidth, imgHeight);
            pdf.save("Productividad_Tecnicos.pdf");
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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ranking de Productividad</h1>
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
                <h2 className="text-xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">Tickets Terminados por Técnico</h2>
                {/* Reduced height from 500px to 350px */}
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="terminados" name="Tickets Terminados" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Detalle de Ingresos Generados (Opcional)</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Técnico</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tickets Terminados</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto Generado (Est.)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.terminados}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">S/ {item.totalMonto.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductividadTecnicos;
