import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSales, deleteSale } from '../services/salesService';
import { FaPlus, FaTrash, FaSpinner, FaSearch, FaFileExcel, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx-js-style';

const TIPOS_COMPROBANTE = [
    "BOLETA FISICA",
    "FACTURA ELECTRONICA",
    "BOLETA ELECTRONICA"
];

function Ventas() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTipo, setFilterTipo] = useState('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchSales();
    }, [filterTipo]); // We re-fetch when main type changes, or we could fetch all and filter client side.
    // Optimisation: Fetching all if TODOS is efficient for small datasets. 
    // To respect the previous pattern, we filter in fetch where possible.
    // However, for "TODOS", we fetch all.

    const fetchSales = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (filterTipo !== 'TODOS') {
                filters.tipoComprobante = filterTipo;
            }
            const data = await getSales(filters);
            setSales(data);
        } catch (error) {
            toast.error("Error al cargar las ventas");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este comprobante? Se borrarán todos sus items.")) return;
        try {
            await deleteSale(id);
            setSales(sales.filter(s => s.id !== id));
            toast.success("Venta eliminada");
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const filteredSales = useMemo(() => {
        let result = sales.filter((sale) => {
            const saleDate = sale.date; // YYYY-MM-DD

            // Date Filter
            if (dateRange.start && saleDate < dateRange.start) return false;
            if (dateRange.end && saleDate > dateRange.end) return false;

            // Type Filter
            if (filterTipo !== 'TODOS' && sale.tipoComprobante !== filterTipo) return false;

            return true;
        });

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(sale => {
                // Check header fields
                if (
                    (sale.clientName || '').toLowerCase().includes(lowerTerm) ||
                    (sale.saleCompNum || '').toLowerCase().includes(lowerTerm) ||
                    (sale.clientDocNum || '').toLowerCase().includes(lowerTerm) ||
                    (sale.techReportNum || '').toLowerCase().includes(lowerTerm)
                ) return true;

                // Check items
                if (sale.items && sale.items.some(item =>
                    (item.description || '').toLowerCase().includes(lowerTerm) ||
                    (item.provider || '').toLowerCase().includes(lowerTerm)
                )) return true;

                return false;
            });
        }

        // Sort descending by creation date
        return result.sort((a, b) => {
            const timeA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.date || 0).getTime() / 1000;
            const timeB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.date || 0).getTime() / 1000;
            return timeB - timeA;
        });

    }, [sales, dateRange, searchTerm, filterTipo]);

    const totalCalculated = useMemo(() => {
        return filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
    }, [filteredSales]);

    const handleExportExcel = () => {
        const workbook = XLSX.utils.book_new();

        const headers = [
            "N°", "Fecha Venta", "Cliente", "Tipo Doc", "N° Documento",
            "N° Inf. Tec.", "Tipo Comp.", "N° Comp. Venta",
            "Cantidades", "Descripciones", "Importes",
            "N° Fact/Guía Compra", "Proveedores", "Observaciones"
        ];

        const values = filteredSales.map((sale, index) => {
            const items = sale.items || [];
            const joinChar = '\n';

            const quantities = items.map(i => i.quantity).join(joinChar);
            const descriptions = items.map(i => i.description).join(joinChar);
            const amounts = items.map(i => parseFloat(i.amount || 0).toFixed(2)).join(joinChar);
            const purchaseDocs = items.map(i => i.purchaseDocNum || '-').join(joinChar);
            const providers = items.map(i => i.provider || '-').join(joinChar);
            const observations = items.map(i => i.observation || '-').join(joinChar);

            return [
                index + 1,
                sale.date,
                sale.clientName,
                sale.clientDocType,
                sale.clientDocNum,
                sale.techReportNum,
                sale.tipoComprobante,
                sale.saleCompNum,
                quantities,
                descriptions,
                amounts,
                purchaseDocs,
                providers,
                observations
            ];
        });

        // Construct Data with placeholders for merging
        const displayData = [
            ["REPORTE DE VENTAS"],
            ["Fecha de Generación:", "", "", new Date().toLocaleString()],
            [""],
            ["FILTROS APLICADOS:"],
            ["Fecha Inicio:", "", "", dateRange.start || "Todos"],
            ["Fecha Fin:", "", "", dateRange.end || "Todos"],
            ["Tipo Comprobante:", "", "", filterTipo || "TODOS"],
            ["Búsqueda:", "", "", searchTerm || "-"],
            [""],
            ["RESUMEN:"],
            ["Total Ventas (Filtrado):", "", "", `S/ ${totalCalculated.toFixed(2)}`],
            [""],
            headers,
            ...values
        ];

        const sheetWithMerges = XLSX.utils.aoa_to_sheet(displayData);

        sheetWithMerges['!merges'] = [
            // Title
            { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
            // Gen Date
            { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, // Label 3 cols
            { s: { r: 1, c: 3 }, e: { r: 1, c: 6 } }, // Value 4 cols
            // Filters Title
            { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
            // Date Start
            { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
            { s: { r: 4, c: 3 }, e: { r: 4, c: 6 } },
            // Date End
            { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } },
            { s: { r: 5, c: 3 }, e: { r: 5, c: 6 } },
            // Type
            { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } },
            { s: { r: 6, c: 3 }, e: { r: 6, c: 6 } },
            // Search
            { s: { r: 7, c: 0 }, e: { r: 7, c: 2 } },
            { s: { r: 7, c: 3 }, e: { r: 7, c: 6 } },
            // Summary
            { s: { r: 9, c: 0 }, e: { r: 9, c: 3 } },
            // Total
            { s: { r: 10, c: 0 }, e: { r: 10, c: 2 } },
            { s: { r: 10, c: 3 }, e: { r: 10, c: 6 } },
        ];

        // Apply Styles
        const range = XLSX.utils.decode_range(sheetWithMerges['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = sheetWithMerges[cell_address];
                if (cell) {
                    if (!cell.s) cell.s = {};
                    cell.s.alignment = { vertical: 'top', wrapText: true };

                    // Header Row is 12
                    if (R === 12) {
                        cell.s.font = { bold: true };
                        cell.s.fill = { fgColor: { rgb: "E0E0E0" } };
                        cell.s.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
                    }
                    // Bold Labels for Filters
                    if (C === 0 && R >= 4 && R <= 10) {
                        cell.s.font = { bold: true };
                    }
                }
            }
        }

        sheetWithMerges['!cols'] = [
            { wch: 5 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 15 },
            { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 30 },
            { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(workbook, sheetWithMerges, "Ventas");
        XLSX.writeFile(workbook, `Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const clearFilters = () => {
        setDateRange({ start: '', end: '' });
        setSearchTerm('');
        setFilterTipo('TODOS');
    };

    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Registro de Comprobantes de Ventas</h1>

            {/* Total Summary Card */}
            <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-400 p-4 rounded-lg shadow-lg text-white flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Total Ventas (Filtrado)</h2>
                    <p className="text-3xl font-bold">S/ {totalCalculated.toFixed(2)}</p>
                </div>
                <div className="text-4xl opacity-50">
                    <FaFileExcel />
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-col lg:flex-row gap-4 justify-between items-end lg:items-center">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {/* Date Filters */}
                    <div>
                        <label className="block text-xs font-bold mb-1 dark:text-gray-300">Fecha Inicio</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1 dark:text-gray-300">Fecha Fin</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                        />
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <label className="block text-xs font-bold mb-1 dark:text-gray-300">Buscar</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cliente, N° Doc, Descripción..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-8 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                            />
                            <FaSearch className="absolute left-2.5 top-2.5 text-gray-400" />
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                        <label className="block text-xs font-bold mb-1 dark:text-gray-300">Tipo de Comprobante</label>
                        <select
                            value={filterTipo}
                            onChange={(e) => setFilterTipo(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                        >
                            <option value="TODOS">TODOS</option>
                            {TIPOS_COMPROBANTE.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 min-w-max">
                    <button
                        onClick={clearFilters}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center shadow"
                        title="Limpiar Filtros"
                    >
                        Limpiar
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center shadow"
                        title="Exportar a Excel"
                    >
                        <FaFileExcel className="mr-2" /> Excel
                    </button>
                    <Link
                        to="/ventas/nueva"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center shadow"
                    >
                        <FaPlus className="mr-2" /> Nueva
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><FaSpinner className="animate-spin text-3xl text-blue-500" /></div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                    <table className="min-w-full text-xs text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase font-bold text-[10px] md:text-xs">
                            <tr>
                                <th className="px-3 py-2 border-b">N°</th>
                                <th className="px-3 py-2 border-b">Fecha Venta</th>
                                <th className="px-3 py-2 border-b">Cliente</th>
                                <th className="px-3 py-2 border-b hidden md:table-cell">Tipo Doc</th>
                                <th className="px-3 py-2 border-b">N° Documento</th>
                                <th className="px-3 py-2 border-b hidden lg:table-cell">N° Inf. Tec.</th>
                                <th className="px-3 py-2 border-b">Tipo Comp.</th>
                                <th className="px-3 py-2 border-b">N° Comp. Venta</th>
                                <th className="px-3 py-2 border-b text-center">Cant</th>
                                <th className="px-3 py-2 border-b">Descripción</th>
                                <th className="px-3 py-2 border-b text-right">Importe</th>
                                <th className="px-3 py-2 border-b hidden xl:table-cell">N° Fact/Guia Compra</th>
                                <th className="px-3 py-2 border-b hidden xl:table-cell">Proveedor</th>
                                <th className="px-3 py-2 border-b hidden xl:table-cell">Observación</th>
                                <th className="px-3 py-2 border-b text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {filteredSales.length > 0 ? filteredSales.map((sale, index) => (
                                <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition group align-top">
                                    <td className="px-3 py-2">{index + 1}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{sale.date}</td>
                                    <td className="px-3 py-2 font-medium">{sale.clientName}</td>
                                    <td className="px-3 py-2 hidden md:table-cell">{sale.clientDocType}</td>
                                    <td className="px-3 py-2">{sale.clientDocNum}</td>
                                    <td className="px-3 py-2 hidden lg:table-cell">{sale.techReportNum || '-'}</td>
                                    <td className="px-3 py-2 text-[10px]">{sale.tipoComprobante}</td>
                                    <td className="px-3 py-2 font-bold">{sale.saleCompNum || '-'}</td>

                                    {/* Multi-line Item Columns */}
                                    <td className="px-3 py-2 text-center bg-gray-50 dark:bg-gray-900 group-hover:bg-white dark:group-hover:bg-gray-800">
                                        {(sale.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden">{item.quantity}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2">
                                        {(sale.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden truncate max-w-xs">{item.description}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        {(sale.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden font-bold text-blue-600">
                                                {parseFloat(item.amount || 0).toFixed(2)}
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2 hidden xl:table-cell">
                                        {(sale.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden">{item.purchaseDocNum || '-'}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2 hidden xl:table-cell">
                                        {(sale.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden">{item.provider || '-'}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2 hidden xl:table-cell">
                                        {(sale.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden truncate max-w-xs">{item.observation || '-'}</div>
                                        ))}
                                    </td>

                                    <td className="px-3 py-2 text-center flex justify-center gap-2 items-start pt-2">
                                        <button
                                            onClick={() => navigate(`/ventas/${sale.id}`)}
                                            className="text-blue-500 hover:text-blue-700 p-1 border border-blue-500 rounded"
                                            title="Ver/Editar Detalle"
                                        >
                                            <FaPlus size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(sale.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Eliminar Comprobante Completo"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="15" className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No se encontraron registros que coincidan con los filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Ventas;
