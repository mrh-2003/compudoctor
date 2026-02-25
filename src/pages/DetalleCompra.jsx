import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPurchase, getPurchaseById, updatePurchase } from '../services/comprasService';
import { FaPlus, FaTrash, FaSave, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

const TIPOS_COMPROBANTE = [
    "FACTURA DE COMPRA",
    "GUIA DE COMPRA"
];

function DetalleCompra() {
    const { id } = useParams();
    const isEditMode = id && id !== 'nueva';
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);

    const [header, setHeader] = useState({
        date: new Date().toISOString().split('T')[0],
        tipoComprobante: TIPOS_COMPROBANTE[0],
        purchaseCompNum: '',
        provider: ''
    });

    const [items, setItems] = useState([
        {
            id: Date.now(),
            quantity: 1,
            description: '',
            unitPrice: 0,
            amount: 0,
            techReportNum: '',
            boletaFisica: '',
            facturaElect: '',
            boletaElect: '',
            observation: ''
        }
    ]);

    useEffect(() => {
        if (isEditMode) {
            loadPurchase();
        }
    }, [id]);

    const loadPurchase = async () => {
        try {
            const purchase = await getPurchaseById(id);
            if (!purchase) {
                toast.error("Compra no encontrada");
                navigate('/compras');
                return;
            }
            setHeader({
                date: purchase.date,
                tipoComprobante: purchase.tipoComprobante,
                purchaseCompNum: purchase.purchaseCompNum,
                provider: purchase.provider
            });

            if (purchase.items) {
                setItems(purchase.items.map((i, idx) => ({ ...i, id: Date.now() + idx })));
            }
        } catch (error) {
            toast.error("Error cargando compra");
        } finally {
            setLoading(false);
        }
    };

    const { subTotal, total } = useMemo(() => {
        const sum = items.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        return { subTotal: sum, total: sum }; // Assuming no specific tax logic for now, or total is just sum
    }, [items]);

    const handleItemChange = (id, field, value) => {
        if (isSaving) return;
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const changes = { [field]: value };
                // Auto calc amount
                if (field === 'quantity' || field === 'unitPrice') {
                    const q = field === 'quantity' ? parseFloat(value) : parseFloat(item.quantity);
                    const p = field === 'unitPrice' ? parseFloat(value) : parseFloat(item.unitPrice);
                    if (!isNaN(q) && !isNaN(p)) {
                        changes.amount = (q * p).toFixed(2);
                    }
                }
                return { ...item, ...changes };
            }
            return item;
        }));
    };

    const addItem = () => {
        if (isSaving) return;
        setItems(prev => [...prev, {
            id: Date.now(),
            quantity: 1,
            description: '',
            unitPrice: 0,
            amount: 0,
            techReportNum: '',
            boletaFisica: '',
            facturaElect: '',
            boletaElect: '',
            observation: ''
        }]);
    };

    const removeItem = (id) => {
        if (isSaving) return;
        if (items.length > 1) {
            setItems(prev => prev.filter(i => i.id !== id));
        } else {
            toast("Debe haber al menos un ítem");
        }
    };

    const handleSave = async () => {
        if (!header.provider) return toast.error("Proveedor requerido");
        if (!header.tipoComprobante) return toast.error("Tipo de comprobante requerido");
        if (!header.purchaseCompNum?.trim()) return toast.error("El N° de Comprobante de Compra es obligatorio");

        const purchaseData = {
            ...header,
            items: items.map(i => ({
                quantity: parseFloat(i.quantity) || 0,
                description: i.description,
                unitPrice: parseFloat(i.unitPrice) || 0,
                amount: parseFloat(i.amount) || 0,
                techReportNum: i.techReportNum,
                boletaFisica: i.boletaFisica,
                facturaElect: i.facturaElect,
                boletaElect: i.boletaElect,
                observation: i.observation
            })),
            total: total
        };

        setIsSaving(true);
        try {
            if (isEditMode) {
                await updatePurchase(id, purchaseData);
                toast.success("Compra actualizada");
                setIsSaving(false);
            } else {
                await createPurchase(purchaseData);
                toast.success("Compra creada");
                navigate('/compras');
            }
        } catch (error) {
            toast.error("Error al guardar");
            console.error(error);
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-8">Cargando...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex items-center mb-6 gap-4">
                <button onClick={() => navigate('/compras')} className="text-gray-600 dark:text-gray-300 hover:text-blue-500" disabled={isSaving}>
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {isEditMode ? 'Editar Compra' : 'Nueva Compra'}
                </h1>
            </div>

            {/* Header Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 mb-6">
                <h2 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Datos de la Compra</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold mb-1 dark:text-gray-300">Fecha de Compra</label>
                        <input
                            type="date"
                            value={header.date}
                            onChange={e => setHeader({ ...header, date: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                            disabled={isSaving}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1 dark:text-gray-300">Proveedor</label>
                        <input
                            type="text"
                            value={header.provider}
                            onChange={e => setHeader({ ...header, provider: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                            placeholder="Nombre del Proveedor"
                            disabled={isSaving}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1 dark:text-gray-300">Tipo de Comprobante</label>
                        <select
                            value={header.tipoComprobante}
                            onChange={e => setHeader({ ...header, tipoComprobante: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                            disabled={isSaving}
                        >
                            {TIPOS_COMPROBANTE.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1 dark:text-gray-300">N° Comprobante Compra <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={header.purchaseCompNum}
                            onChange={e => setHeader({ ...header, purchaseCompNum: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm font-bold"
                            placeholder="Ej. F001-123"
                            disabled={isSaving}
                        />
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
                <h2 className="text-lg font-bold mb-4 text-green-600 border-b pb-2">Detalle de Items</h2>

                <div className="overflow-x-auto mb-4">
                    <table className="min-w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-100 dark:bg-gray-700 uppercase">
                            <tr>
                                <th className="p-2 border w-12 text-center">Cant.</th>
                                <th className="p-2 border w-48">Descripción</th>
                                <th className="p-2 border w-24 text-right">P. Unit</th>
                                <th className="p-2 border w-24 text-right">Importe</th>
                                <th className="p-2 border w-24 text-center">N° Inf. Tec.</th>
                                <th className="p-2 border">Bol. Fisica Venta</th>
                                <th className="p-2 border">Fact. Elect. Venta</th>
                                <th className="p-2 border">Bol. Elect. Venta</th>
                                <th className="p-2 border">Observación</th>
                                <th className="p-2 border text-center">x</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="p-1 border">
                                        <input type="number" min="1" className="w-full p-1 border rounded text-center dark:bg-gray-700"
                                            value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="number" min="0" step="0.01" className="w-full p-1 border rounded text-right dark:bg-gray-700"
                                            value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border bg-gray-50 dark:bg-gray-900 text-right font-bold">
                                        {parseFloat(item.amount).toFixed(2)}
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700 text-center"
                                            value={item.techReportNum} onChange={(e) => handleItemChange(item.id, 'techReportNum', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.boletaFisica} onChange={(e) => handleItemChange(item.id, 'boletaFisica', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.facturaElect} onChange={(e) => handleItemChange(item.id, 'facturaElect', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.boletaElect} onChange={(e) => handleItemChange(item.id, 'boletaElect', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.observation} onChange={(e) => handleItemChange(item.id, 'observation', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border text-center">
                                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 disabled:text-red-300" disabled={isSaving}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button onClick={addItem} className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-bold py-1 px-3 rounded flex items-center mb-6 disabled:bg-gray-200 disabled:text-gray-500" disabled={isSaving}>
                    <FaPlus className="mr-1" /> Agregar Fila
                </button>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between p-2 bg-gray-200 dark:bg-gray-700 rounded font-bold text-lg">
                            <span>TOTAL:</span>
                            <span>S/ {total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-8 space-x-4">
                <button
                    onClick={() => navigate('/compras')}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-400"
                    disabled={isSaving}
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center text-lg disabled:bg-blue-400"
                    disabled={isSaving}
                >
                    <FaSave className="mr-2" /> {isSaving ? 'Guardando...' : 'Guardar Compra'}
                </button>
            </div>
        </div>
    );
}

export default DetalleCompra;
