import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSales, deleteSale } from '../services/salesService';
import { FaPlus, FaTrash, FaSpinner, FaSearch, FaFileExcel, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

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

    const filteredFlatItems = useMemo(() => {
        let items = [];

        // Flatten first (or filter sales then flatten? Filtering items is requested via search)
        // Let's flatten then filter to allows searching within items
        sales.forEach((sale) => {
            const saleDate = sale.date; // YYYY-MM-DD

            // Date Filter
            if (dateRange.start && saleDate < dateRange.start) return;
            if (dateRange.end && saleDate > dateRange.end) return;

            if (sale.items && sale.items.length > 0) {
                sale.items.forEach((item, itemIndex) => {
                    items.push({
                        uniqueId: `${sale.id}-${itemIndex}`,
                        saleId: sale.id,
                        index: 0, // Will assign later
                        ...sale,
                        item
                    });
                });
            } else {
                items.push({
                    uniqueId: `${sale.id}-empty`,
                    saleId: sale.id,
                    index: 0,
                    ...sale,
                    item: {}
                });
            }
        });

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            items = items.filter(row => {
                return (
                    (row.clientName || '').toLowerCase().includes(lowerTerm) ||
                    (row.saleCompNum || '').toLowerCase().includes(lowerTerm) ||
                    (row.clientDocNum || '').toLowerCase().includes(lowerTerm) ||
                    (row.techReportNum || '').toLowerCase().includes(lowerTerm) ||
                    (row.item.description || '').toLowerCase().includes(lowerTerm) ||
                    (row.item.provider || '').toLowerCase().includes(lowerTerm)
                );
            });
        }

        // Assign/Re-index
        return items.map((item, idx) => ({ ...item, index: idx + 1 }));

    }, [sales, dateRange, searchTerm]);

    const totalCalculated = useMemo(() => {
        // Calculate total of UNIQUE sales present in filteredFlatItems
        // If 2 items from same sale are shown, we shouldn't add the SALE total twice if we mean "Volume of Sales".
        // BUT, if we mean "Sum of displayed rows' value", it's ambiguous.
        // Usually, financial summary sums the Documents.
        // If I see 2 lines of Invoice #100 (Total 100), adding 100+100=200 is wrong.
        // So I will sum unique filtered sales.
        const uniqueSaleIds = new Set(filteredFlatItems.map(i => i.saleId));
        let sum = 0;
        uniqueSaleIds.forEach(id => {
            const sale = sales.find(s => s.id === id);
            if (sale) {
                sum += (parseFloat(sale.total) || 0);
            }
        });
        return sum;
    }, [filteredFlatItems, sales]);

    const handleExportExcel = () => {
        // 1. Prepare Filter Info
        const filterInfo = [
            ["REPORTE DE VENTAS"],
            ["Fecha de Generación:", new Date().toLocaleString()],
            [""],
            ["FILTROS APLICADOS:"],
            ["Fecha Inicio:", dateRange.start || "Todos"],
            ["Fecha Fin:", dateRange.end || "Todos"],
            ["Tipo Comprobante:", filterTipo || "TODOS"],
            ["Búsqueda:", searchTerm || "-"],
            [""],
            ["RESUMEN:"],
            ["Total Ventas (Filtrado):", `S/ ${totalCalculated.toFixed(2)}`],
            [""]
        ];

        // 2. Prepare Headers and Data
        const headers = [
            "N° Item", "Fecha Venta", "Cliente", "Tipo Doc", "N° Documento",
            "N° Inf. Tec.", "Tipo Comp.", "N° Comp. Venta", "Cant", "Descripción",
            "Total (Global)", "N° Fact/Guía Compra", "Proveedor", "Observación"
        ];

        const values = filteredFlatItems.map(row => [
            row.index,
            row.date,
            row.clientName,
            row.clientDocType,
            row.clientDocNum,
            row.techReportNum,
            row.tipoComprobante,
            row.saleCompNum,
            row.item.quantity,
            row.item.description,
            parseFloat(row.total || 0).toFixed(2),
            row.item.purchaseDocNum,
            row.item.provider,
            row.item.observation
        ]);

        // 3. Combine All
        const finalData = [...filterInfo, headers, ...values];
        const finalSheet = XLSX.utils.aoa_to_sheet(finalData);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, finalSheet, "Ventas");
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
                                <th className="px-3 py-2 border-b">N° Item</th>
                                <th className="px-3 py-2 border-b">Fecha Venta</th>
                                <th className="px-3 py-2 border-b">Cliente</th>
                                <th className="px-3 py-2 border-b hidden md:table-cell">Tipo Doc</th>
                                <th className="px-3 py-2 border-b">N° Documento</th>
                                <th className="px-3 py-2 border-b hidden lg:table-cell">N° Inf. Tec.</th>
                                <th className="px-3 py-2 border-b">Tipo Comp.</th>
                                <th className="px-3 py-2 border-b">N° Comp. Venta</th>
                                <th className="px-3 py-2 border-b text-center">Cant</th>
                                <th className="px-3 py-2 border-b">Descripción</th>
                                <th className="px-3 py-2 border-b text-blue-600">Total (Global)</th>
                                <th className="px-3 py-2 border-b hidden xl:table-cell">N° Fact/Guia Compra</th>
                                <th className="px-3 py-2 border-b hidden xl:table-cell">Proveedor</th>
                                <th className="px-3 py-2 border-b hidden xl:table-cell">Observación</th>
                                <th className="px-3 py-2 border-b text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {filteredFlatItems.length > 0 ? filteredFlatItems.map((row) => (
                                <tr key={row.uniqueId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition group">
                                    <td className="px-3 py-2">{row.index}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{row.date}</td>
                                    <td className="px-3 py-2 font-medium">{row.clientName}</td>
                                    <td className="px-3 py-2 hidden md:table-cell">{row.clientDocType}</td>
                                    <td className="px-3 py-2">{row.clientDocNum}</td>
                                    <td className="px-3 py-2 hidden lg:table-cell">{row.techReportNum || '-'}</td>
                                    <td className="px-3 py-2 text-[10px]">{row.tipoComprobante}</td>
                                    <td className="px-3 py-2 font-bold">{row.saleCompNum || '-'}</td>
                                    <td className="px-3 py-2 text-center bg-gray-50 dark:bg-gray-900 group-hover:bg-white dark:group-hover:bg-gray-800">{row.item.quantity || 0}</td>
                                    <td className="px-3 py-2 truncate max-w-xs">{row.item.description || '-'}</td>
                                    <td className="px-3 py-2 font-bold text-blue-600">
                                        S/ {(parseFloat(row.total) || 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 hidden xl:table-cell">{row.item.purchaseDocNum || '-'}</td>
                                    <td className="px-3 py-2 hidden xl:table-cell">{row.item.provider || '-'}</td>
                                    <td className="px-3 py-2 truncate max-w-xs hidden xl:table-cell">{row.item.observation || '-'}</td>
                                    <td className="px-3 py-2 text-center flex justify-center gap-2">
                                        <button
                                            onClick={() => navigate(`/ventas/${row.saleId}`)}
                                            className="text-blue-500 hover:text-blue-700 p-1 border border-blue-500 rounded"
                                            title="Ver/Editar Detalle"
                                        >
                                            <FaPlus size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(row.saleId)}
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
