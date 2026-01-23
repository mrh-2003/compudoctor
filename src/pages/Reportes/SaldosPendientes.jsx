import React, { useState, useEffect, useMemo } from 'react';
import { getAllDiagnosticReports } from '../../services/diagnosticService';
import * as XLSX from 'xlsx';
import { FaFileExcel, FaPhone, FaArrowLeft, FaMoneyBillWave } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import CostosModal from '../../components/diagnostico/CostosModal';

function SaldosPendientes() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCostosModalOpen, setIsCostosModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getAllDiagnosticReports();
            setReports(data);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateReport = () => {
        // Refresh data after payment
        fetchData();
    };

    const handleOpenCosts = (report) => {
        setSelectedReport(report);
        setIsCostosModalOpen(true);
    };

    const handleCloseCosts = () => {
        setSelectedReport(null);
        setIsCostosModalOpen(false);
    };

    const pendingReports = useMemo(() => {
        return reports.filter(r => r.saldo > 0);
    }, [reports]);

    const totalPending = useMemo(() => {
        return pendingReports.reduce((sum, r) => sum + (parseFloat(r.saldo) || 0), 0);
    }, [pendingReports]);

    const exportToExcel = () => {
        const dataToExport = pendingReports.map(r => ({
            'Cliente': r.clientName,
            'Teléfono': r.telefono,
            'N° Informe': r.reportNumber,
            'Saldo Pendiente': r.saldo
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Saldos Pendientes");
        XLSX.writeFile(wb, "Reporte_Saldos_Pendientes.xlsx");
    };

    if (loading && reports.length === 0) return <div className="p-8 text-center">Cargando datos...</div>;

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/reportes" className="text-gray-500 hover:text-gray-700"><FaArrowLeft /></Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reporte de Saldos Pendientes</h1>
                </div>
                <button
                    onClick={exportToExcel}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    <FaFileExcel /> Exportar Excel
                </button>
            </div>

            {/* KPI Card */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg mb-8 max-w-sm">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Total por Cobrar</h3>
                <p className="text-4xl font-bold text-red-600 dark:text-red-400">S/ {totalPending.toFixed(2)}</p>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">N° Informe</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Motivo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Saldo</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {pendingReports.map((report) => (
                            <tr key={report.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{report.clientName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{report.telefono}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{report.reportNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{report.motivoIngreso}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">S/ {parseFloat(report.saldo).toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-4">
                                        <button
                                            onClick={() => handleOpenCosts(report)}
                                            className="text-green-500 hover:text-green-700"
                                            title="Realizar Pago"
                                        >
                                            <FaMoneyBillWave size={18} />
                                        </button>
                                        {report.telefono && (
                                            <a href={`tel:${report.telefono}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1">
                                                <FaPhone className="text-xs" />
                                            </a>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {pendingReports.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No hay saldos pendientes.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isCostosModalOpen && selectedReport && (
                <CostosModal
                    report={selectedReport}
                    onClose={handleCloseCosts}
                    onUpdate={handleUpdateReport}
                />
            )}
        </div>
    );
}

export default SaldosPendientes;
