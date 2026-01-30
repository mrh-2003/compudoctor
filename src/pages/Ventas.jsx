import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSales, deleteSale } from '../services/salesService';
import { FaPlus, FaTrash, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const TIPOS_COMPROBANTE = [
    "BOLETA FISICA",
    "FACTURA ELECTRONICA",
    "BOLETA ELECTRONICA"
];

function Ventas() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterTipo, setFilterTipo] = useState(TIPOS_COMPROBANTE[0]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSales();
    }, [filterTipo]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const data = await getSales({ tipoComprobante: filterTipo });
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

    // Flatten sales to show one row per item
    const flatItems = [];
    sales.forEach((sale, saleIndex) => {
        if (sale.items && sale.items.length > 0) {
            sale.items.forEach((item, itemIndex) => {
                flatItems.push({
                    uniqueId: `${sale.id}-${itemIndex}`,
                    saleId: sale.id,
                    index: flatItems.length + 1,
                    ...sale,
                    item
                });
            });
        } else {
            // Caso raro: venta sin items, mostrar fila vacía de detalle
            flatItems.push({
                uniqueId: `${sale.id}-empty`,
                saleId: sale.id,
                index: flatItems.length + 1,
                ...sale,
                item: {}
            });
        }
    });

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Registro de Comprobantes de Ventas</h1>

            <div className="flex justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center gap-4">
                    <label className="font-semibold dark:text-gray-200">Tipo de Comprobante:</label>
                    <select
                        value={filterTipo}
                        onChange={(e) => setFilterTipo(e.target.value)}
                        className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        {TIPOS_COMPROBANTE.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <Link
                    to="/ventas/nueva"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
                >
                    <FaPlus className="mr-2" /> Nueva Venta
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><FaSpinner className="animate-spin text-3xl text-blue-500" /></div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                    <table className="min-w-full text-xs text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase font-bold">
                            <tr>
                                <th className="px-3 py-2 border-b">N° Item</th>
                                <th className="px-3 py-2 border-b">Fecha Venta</th>
                                <th className="px-3 py-2 border-b">Cliente</th>
                                <th className="px-3 py-2 border-b">Tipo Doc</th>
                                <th className="px-3 py-2 border-b">N° Documento</th>
                                <th className="px-3 py-2 border-b">N° Inf. Tec.</th>
                                <th className="px-3 py-2 border-b">Tipo Comp.</th>
                                <th className="px-3 py-2 border-b">N° Comp. Venta</th>
                                <th className="px-3 py-2 border-b">Cant</th>
                                <th className="px-3 py-2 border-b">Descripción</th>
                                <th className="px-3 py-2 border-b">Total (Global)</th>
                                <th className="px-3 py-2 border-b">N° Fact/Guia Compra</th>
                                <th className="px-3 py-2 border-b">Proveedor</th>
                                <th className="px-3 py-2 border-b">Observación</th>
                                <th className="px-3 py-2 border-b text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {flatItems.length > 0 ? flatItems.map((row) => (
                                <tr key={row.uniqueId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <td className="px-3 py-2">{row.index}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{row.date}</td>
                                    <td className="px-3 py-2">{row.clientName}</td>
                                    <td className="px-3 py-2">{row.clientDocType}</td>
                                    <td className="px-3 py-2">{row.clientDocNum}</td>
                                    <td className="px-3 py-2">{row.techReportNum || '-'}</td>
                                    <td className="px-3 py-2">{row.tipoComprobante}</td>
                                    <td className="px-3 py-2 font-bold">{row.saleCompNum || '-'}</td>
                                    <td className="px-3 py-2 text-center">{row.item.quantity || 0}</td>
                                    <td className="px-3 py-2 truncate max-w-xs" title={row.item.description}>{row.item.description || '-'}</td>
                                    <td className="px-3 py-2 font-medium text-blue-600">
                                        {/* Mostramos el TOTAL de la venta, no del item, según encabezado ambiguo, pero 'Total' suele ser el total del documento */}
                                        S/ {(parseFloat(row.total) || 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2">{row.item.purchaseDocNum || '-'}</td>
                                    <td className="px-3 py-2">{row.item.provider || '-'}</td>
                                    <td className="px-3 py-2 truncate max-w-xs">{row.item.observation || '-'}</td>
                                    <td className="px-3 py-2 text-center flex justify-center gap-2">
                                        <button
                                            onClick={() => navigate(`/ventas/${row.saleId}`)}
                                            className="text-blue-500 hover:text-blue-700 p-1 border border-blue-500 rounded"
                                            title="Ver/Editar Detalle"
                                        >
                                            <FaPlus />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(row.saleId)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Eliminar Comprobante Completo"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="15" className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        No se encontraron registros para {filterTipo}
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
