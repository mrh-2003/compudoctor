import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPurchases, deletePurchase } from '../services/comprasService';
import { FaPlus, FaTrash, FaSpinner, FaSearch, FaFileExcel } from 'react-icons/fa';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx-js-style';

const TIPOS_COMPROBANTE = [
    "FACTURA DE COMPRA",
    "GUIA DE COMPRA"
];

function Compras() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTipo, setFilterTipo] = useState('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchPurchases();
    }, [filterTipo]);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (filterTipo !== 'TODOS') {
                filters.tipoComprobante = filterTipo;
            }
            const data = await getPurchases(filters);
            setPurchases(data);
        } catch (error) {
            toast.error("Error al cargar las compras");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este registro de compra?")) return;
        try {
            await deletePurchase(id);
            setPurchases(purchases.filter(p => p.id !== id));
            toast.success("Compra eliminada");
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const filteredPurchases = useMemo(() => {
        let result = purchases.filter((p) => {
            const pDate = p.date;

            // Date Filter
            if (dateRange.start && pDate < dateRange.start) return false;
            if (dateRange.end && pDate > dateRange.end) return false;

            // Type Filter
            if (filterTipo !== 'TODOS' && p.tipoComprobante !== filterTipo) return false;

            return true;
        });

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p => {
                // Header fields
                if (
                    (p.provider || '').toLowerCase().includes(lowerTerm) ||
                    (p.purchaseCompNum || '').toLowerCase().includes(lowerTerm)
                ) return true;

                // Items
                if (p.items && p.items.some(item =>
                    (item.description || '').toLowerCase().includes(lowerTerm) ||
                    (item.techReportNum || '').toLowerCase().includes(lowerTerm)
                )) return true;

                return false;
            });
        }

        return result;
    }, [purchases, dateRange, searchTerm, filterTipo]);

    const totalCalculated = useMemo(() => {
        return filteredPurchases.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    }, [filteredPurchases]);

    const handleExportExcel = () => {
        const workbook = XLSX.utils.book_new();

        // 1. Prepare Filter Info (Structured for placement)
        // We will manually place them to handle merges better or just use the array and then add merges
        const filterInfo = [
            ["REPORTE DE COMPRAS"],
            ["Fecha de Generación:", new Date().toLocaleString()],
            [""],
            ["FILTROS APLICADOS:"],
            ["Fecha Inicio:", dateRange.start || "Todos"],
            ["Fecha Fin:", dateRange.end || "Todos"],
            ["Tipo Comprobante:", filterTipo || "TODOS"],
            ["Búsqueda:", searchTerm || "-"],
            [""],
            ["RESUMEN:"],
            ["Total Compras (Filtrado):", `S/ ${totalCalculated.toFixed(2)}`],
            [""]
        ];

        const headers = [
            "N°", "Fecha Compra", "Proveedor", "Tipo Comprobante", "N° Comprobante Compra",
            "N° Informe Tecnico", "Cant.", "Descripcion", "Precio Unit.", "Importe Total",
            "Boleta Fisica Venta", "Factura Elect. Venta", "Boleta Elect. Venta", "Observacion"
        ];

        const values = filteredPurchases.map((p, index) => {
            const items = p.items || [];
            const joinChar = '\n';

            return [
                index + 1,
                p.date,
                p.provider,
                p.tipoComprobante,
                p.purchaseCompNum,
                items.map(i => i.techReportNum || '-').join(joinChar),
                items.map(i => i.quantity).join(joinChar),
                items.map(i => i.description).join(joinChar),
                items.map(i => parseFloat(i.unitPrice || 0).toFixed(2)).join(joinChar),
                items.map(i => parseFloat(i.amount || 0).toFixed(2)).join(joinChar),
                items.map(i => i.boletaFisica || '-').join(joinChar),
                items.map(i => i.facturaElect || '-').join(joinChar),
                items.map(i => i.boletaElect || '-').join(joinChar),
                items.map(i => i.observation || '-').join(joinChar)
            ];
        });

        const finalData = [...filterInfo, headers, ...values];
        const finalSheet = XLSX.utils.aoa_to_sheet(finalData);

        // Define Merges
        // Filter rows start at index 4 (0-based): 4, 5, 6, 7. 
        // Label at Col 0 (span 3 -> 0,1,2), Value at Col 1 (but effectively Col 3 after merge? No, AOA puts it in Col 1. We need to move value to Col 3?
        // Actually, AOA puts ["Label", "Value"].
        // To merge A1:C1 (Label) and D1:G1 (Value), we need the data to be in A1 and D1.

        // Let's Correct data placement for Filters
        // We need to re-construct the Top part to place values in correct columns for merging
        /*
            Rows:
            0: Title
            1: Gen Date
            3: "FILTROS APLICADOS:"
            4: [Label, "", "", Value] -> We need to spacer items if we want AOA to place it in 4th col? 
            No, we can just write to specific cells, OR we can use nulls/empty strings in between.
        */

        const spacer = ["", "", ""]; // 3 empty cells
        const displayData = [
            ["REPORTE DE COMPRAS"],
            ["Fecha de Generación:", "", "", new Date().toLocaleString()],
            [""],
            ["FILTROS APLICADOS:"],
            ["Fecha Inicio:", "", "", dateRange.start || "Todos"],
            ["Fecha Fin:", "", "", dateRange.end || "Todos"],
            ["Tipo Comprobante:", "", "", filterTipo || "TODOS"],
            ["Búsqueda:", "", "", searchTerm || "-"],
            [""],
            ["RESUMEN:"],
            ["Total Compras (Filtrado):", "", "", `S/ ${totalCalculated.toFixed(2)}`],
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
            { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } }, // Label A-C
            { s: { r: 4, c: 3 }, e: { r: 4, c: 6 } }, // Value D-G
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
        const range2 = XLSX.utils.decode_range(sheetWithMerges['!ref']);
        for (let R = range2.s.r; R <= range2.e.r; ++R) {
            for (let C = range2.s.c; C <= range2.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = sheetWithMerges[cell_address];
                if (cell) {
                    if (!cell.s) cell.s = {};
                    cell.s.alignment = { vertical: 'top', wrapText: true };
                    // Header Row is now index 12
                    if (R === 12) {
                        cell.s.font = { bold: true };
                        cell.s.fill = { fgColor: { rgb: "E0E0E0" } };
                        cell.s.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
                    }
                    // Bold Labels for Filters (First Column A)
                    if (C === 0 && R >= 4 && R <= 10) {
                        cell.s.font = { bold: true };
                    }
                }
            }
        }

        sheetWithMerges['!cols'] = [
            { wch: 5 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
            { wch: 15 }, { wch: 8 }, { wch: 30 }, { wch: 12 }, { wch: 12 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(workbook, sheetWithMerges, "Compras");
        XLSX.writeFile(workbook, `Compras_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const clearFilters = () => {
        setDateRange({ start: '', end: '' });
        setSearchTerm('');
        setFilterTipo('TODOS');
    };

    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Registro de Compras</h1>

            {/* Total Summary */}
            <div className="mb-6 bg-gradient-to-r from-green-600 to-green-400 p-4 rounded-lg shadow-lg text-white flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Total Compras (Filtrado)</h2>
                    <p className="text-3xl font-bold">S/ {totalCalculated.toFixed(2)}</p>
                </div>
                <div className="text-4xl opacity-50">
                    <FaFileExcel />
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-col lg:flex-row gap-4 justify-between items-end lg:items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
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
                    <div className="relative">
                        <label className="block text-xs font-bold mb-1 dark:text-gray-300">Buscar</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Proveedor, N° Doc, Descripción..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-8 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                            />
                            <FaSearch className="absolute left-2.5 top-2.5 text-gray-400" />
                        </div>
                    </div>
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
                    <button onClick={clearFilters} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded shadow">Limpiar</button>
                    <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow flex items-center"><FaFileExcel className="mr-2" /> Excel</button>
                    <Link to="/compras/nueva" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow flex items-center"><FaPlus className="mr-2" /> Nueva</Link>
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
                                <th className="px-3 py-2 border-b">Fecha Compra</th>
                                <th className="px-3 py-2 border-b">Proveedor</th>
                                <th className="px-3 py-2 border-b">Tipo Comp.</th>
                                <th className="px-3 py-2 border-b">N° Comp. Compra</th>

                                <th className="px-3 py-2 border-b text-center">N° Inf. Tec.</th>
                                <th className="px-3 py-2 border-b text-center">Cant.</th>
                                <th className="px-3 py-2 border-b">Descripción</th>
                                <th className="px-3 py-2 border-b text-right">P. Unit</th>
                                <th className="px-3 py-2 border-b text-right">Imp. Total</th>

                                <th className="px-3 py-2 border-b">Bol. Fis. Venta</th>
                                <th className="px-3 py-2 border-b">Fact. Elect. Venta</th>
                                <th className="px-3 py-2 border-b">Bol. Elect. Venta</th>
                                <th className="px-3 py-2 border-b">Observación</th>
                                <th className="px-3 py-2 border-b text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {filteredPurchases.length > 0 ? filteredPurchases.map((p, index) => (
                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition group align-top">
                                    <td className="px-3 py-2">{index + 1}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{p.date}</td>
                                    <td className="px-3 py-2 font-medium">{p.provider}</td>
                                    <td className="px-3 py-2 text-[10px]">{p.tipoComprobante}</td>
                                    <td className="px-3 py-2 font-bold">{p.purchaseCompNum || '-'}</td>

                                    <td className="px-3 py-2 text-center bg-gray-50 dark:bg-gray-900">
                                        {(p.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden">{item.techReportNum || '-'}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2 text-center bg-gray-50 dark:bg-gray-900">
                                        {(p.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden">{item.quantity}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2">
                                        {(p.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden truncate max-w-xs">{item.description}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        {(p.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden">{parseFloat(item.unitPrice || 0).toFixed(2)}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-blue-600">
                                        {(p.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden">{parseFloat(item.amount || 0).toFixed(2)}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2">
                                        {(p.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden">{item.boletaFisica || '-'}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2">
                                        {(p.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden">{item.facturaElect || '-'}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2">
                                        {(p.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden">{item.boletaElect || '-'}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2">
                                        {(p.items || []).map((item, idx) => (
                                            <div key={idx} className="h-6 overflow-hidden truncate max-w-xs">{item.observation || '-'}</div>
                                        ))}
                                    </td>
                                    <td className="px-3 py-2 text-center flex justify-center gap-2 items-start pt-2">
                                        <button onClick={() => navigate(`/compras/${p.id}`)} className="text-blue-500 hover:text-blue-700 p-1 border border-blue-500 rounded" title="Ver/Editar Detalle"><FaPlus size={12} /></button>
                                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 p-1" title="Eliminar"><FaTrash size={12} /></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="15" className="text-center py-8 text-gray-500">No se encontraron registros.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Compras;
