import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPurchase, getPurchaseById, updatePurchase } from '../services/comprasService';
import { getInventoryItems, updateInventoryItem } from '../services/inventoryService';
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
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // Inventory status
    const [inventoryData, setInventoryData] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(null);

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
            observation: '',
            isFromInventory: false,
            inventoryItemId: null,
            maxQuantity: null,
            isExistingInventoryItem: false // Prevent editing amounts for existing inv items
        }
    ]);

    useEffect(() => {
        const loadInventory = async () => {
            try {
                const data = await getInventoryItems();
                // Filter only positive stock
                setInventoryData(data.filter(i => i.cantidad > 0));
            } catch (error) {
                console.error("Error cargando inventario", error);
            }
        };

        loadInventory();
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
                setItems(purchase.items.map((i, idx) => ({
                    ...i,
                    id: Date.now() + idx,
                    isFromInventory: i.isFromInventory || false,
                    inventoryItemId: i.inventoryItemId || null,
                    maxQuantity: null, // In edit mode, we just keep the flag unless we want to refetch the exact max
                    isExistingInventoryItem: i.isFromInventory || false // Items from DB already handled
                })));
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

    const getRealInventoryMax = (invId, currentItemId = null) => {
        const invDoc = inventoryData.find(inv => inv.id === invId);
        if (!invDoc) return 0;

        // Cuánto sumaron OTRAS filas para el mismo producto?
        const usedByOthers = items
            .filter(i => i.isFromInventory && i.inventoryItemId === invId && i.id !== currentItemId && !i.isExistingInventoryItem)
            .reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

        return Math.max(0, invDoc.cantidad - usedByOthers);
    };

    const selectInventoryItem = (itemId, invItem) => {
        const realMax = getRealInventoryMax(invItem.id, itemId);

        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                let newQuant = item.quantity;
                if (parseFloat(newQuant) > realMax) {
                    newQuant = realMax;
                    toast.success(`Cantidad ajustada a max disponible real (${realMax})`, { id: 'inv-max-adjust' });
                }
                const newAmount = (!isNaN(parseFloat(newQuant)) && !isNaN(parseFloat(item.unitPrice)))
                    ? (parseFloat(newQuant) * parseFloat(item.unitPrice)).toFixed(2)
                    : 0;

                return {
                    ...item,
                    description: invItem.descripcion,
                    isFromInventory: true,
                    inventoryItemId: invItem.id,
                    maxQuantity: realMax,
                    quantity: newQuant,
                    amount: newAmount,
                };
            }
            return item;
        }));
        setShowSuggestions(null);
    };

    const handleItemChange = (id, field, value) => {
        if (isSaving) return;
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                if (item.isExistingInventoryItem && field === 'quantity') {
                    toast.error('No se puede modificar la cantidad de un artículo ya descontado.', { id: 'inv-exist-qty-err' });
                    return item; // Don't apply changes to quantity
                }
                if (item.isExistingInventoryItem && field === 'description') {
                    toast.error('No se puede modificar el producto de un artículo ya descontado.', { id: 'inv-exist-desc-err' });
                    return item;
                }

                const changes = { [field]: value };

                if (field === 'quantity') {
                    if (item.isFromInventory && item.inventoryItemId !== null) {
                        const realMax = getRealInventoryMax(item.inventoryItemId, id);
                        item.maxQuantity = realMax;
                        const parsed = parseFloat(value) || 0;
                        if (parsed > realMax) {
                            toast.error(`Cantidad máxima disponible descontando otras filas es ${realMax}`, { id: 'inv-qty-err' });
                            changes.quantity = realMax;
                        } else {
                            changes.quantity = value;
                        }
                    }
                }

                if (field === 'description') {
                    if (item.isFromInventory && value !== item.description) {
                        changes.isFromInventory = false;
                        changes.inventoryItemId = null;
                        changes.maxQuantity = null;
                    }

                    if (value && value.length > 0) {
                        setShowSuggestions(id);
                    } else {
                        setShowSuggestions(null);
                    }
                }

                // Auto calc amount
                const q = field === 'quantity' ? parseFloat(changes.quantity ?? item.quantity) : parseFloat(item.quantity);
                const p = field === 'unitPrice' ? parseFloat(value) : parseFloat(item.unitPrice);
                if (!isNaN(q) && !isNaN(p)) {
                    changes.amount = (q * p).toFixed(2);
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
            observation: '',
            isFromInventory: false,
            inventoryItemId: null,
            maxQuantity: null,
            isExistingInventoryItem: false
        }]);
    };

    const removeItem = (id) => {
        if (isSaving) return;
        const itemToRemove = items.find(i => i.id === id);
        if (itemToRemove && itemToRemove.isExistingInventoryItem) {
            toast.success('Ítem eliminado de la compra. Recuerda que el stock descontado previamente no se restaurará.', { duration: 4000 });
        }

        if (items.length > 1) {
            setItems(prev => prev.filter(i => i.id !== id));
        } else {
            toast("Debe haber al menos un ítem");
        }
    };

    const triggerSave = () => {
        if (!header.provider) return toast.error("Proveedor requerido");
        if (!header.tipoComprobante) return toast.error("Tipo de comprobante requerido");
        if (!header.purchaseCompNum?.trim()) return toast.error("El N° de Comprobante de Compra es obligatorio");

        // Filter only NEW inventory items being added
        const hasNewInventoryItems = items.some(i => i.isFromInventory && !i.isExistingInventoryItem);
        if (hasNewInventoryItems) {
            setConfirmModalOpen(true);
        } else {
            executeSave();
        }
    };

    const executeSave = async () => {
        setConfirmModalOpen(false);

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
                observation: i.observation,
                isFromInventory: i.isFromInventory || false,
                inventoryItemId: i.inventoryItemId || null
            })),
            total: total
        };

        setIsSaving(true);
        try {
            if (isEditMode) {
                await updatePurchase(id, purchaseData);
                toast.success("Compra actualizada");
            } else {
                await createPurchase(purchaseData);
                toast.success("Compra creada");
            }

            // Discount inventory ONLY for new items
            const newInventoryItems = items.filter(i => i.isFromInventory && i.inventoryItemId && !i.isExistingInventoryItem);
            if (newInventoryItems.length > 0) {
                const updatePromises = newInventoryItems.map(async (invItem) => {
                    const invDoc = inventoryData.find(inv => inv.id === invItem.inventoryItemId);
                    if (invDoc) {
                        const newQuantity = invDoc.cantidad - parseFloat(invItem.quantity || 0);
                        await updateInventoryItem(invDoc.id, { cantidad: newQuantity >= 0 ? newQuantity : 0 });
                    }
                });
                await Promise.all(updatePromises);
            }

            setIsSaving(false);
            navigate('/compras');
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

                <div className={`overflow-x-auto mb-4 transition-all ${showSuggestions ? 'pb-[200px]' : ''}`}>
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
                                <tr key={item.id} className={item.isFromInventory ? "bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500" : ""}>
                                    <td className="p-1 border text-center relative group">
                                        <input type="number" min="1" className="w-full p-1 border rounded text-center dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-600"
                                            value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} disabled={isSaving || item.isExistingInventoryItem} />
                                    </td>
                                    <td className="p-1 border relative">
                                        <input type="text" className={`w-full p-1 border rounded dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-600 ${item.isFromInventory ? 'font-bold text-blue-700 dark:text-blue-300' : ''}`}
                                            value={item.description}
                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                            onFocus={() => { if (item.description && item.description.length > 0 && !item.isExistingInventoryItem) setShowSuggestions(item.id) }}
                                            onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                                            disabled={isSaving || item.isExistingInventoryItem} />

                                        {showSuggestions === item.id && (
                                            <ul className="absolute z-50 left-0 w-max min-w-[250px] bg-white dark:bg-gray-800 border dark:border-gray-600 rounded shadow-lg max-h-48 overflow-y-auto mt-1">
                                                {inventoryData
                                                    .filter(inv => inv.descripcion.toLowerCase().includes(item.description.toLowerCase()) && getRealInventoryMax(inv.id, item.id) > 0)
                                                    .map(inv => {
                                                        const availableStock = getRealInventoryMax(inv.id, item.id);
                                                        return (
                                                            <li key={inv.id} className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b dark:border-gray-700"
                                                                onClick={() => selectInventoryItem(item.id, inv)}>
                                                                <div className="font-bold">{inv.descripcion}</div>
                                                                <div className="text-xs text-blue-600 dark:text-blue-400">Stock disponible: {availableStock}</div>
                                                            </li>
                                                        );
                                                    })}
                                                {inventoryData.filter(inv => inv.descripcion.toLowerCase().includes(item.description.toLowerCase()) && getRealInventoryMax(inv.id, item.id) > 0).length === 0 && (
                                                    <li className="p-2 text-gray-500 text-xs italic">No hay productos en inventario con ese nombre o sin stock.</li>
                                                )}
                                            </ul>
                                        )}
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
                                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 disabled:text-red-300 disabled:opacity-50" disabled={isSaving}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-xs text-gray-500 flex flex-col gap-1 mb-4">
                    <div className="flex items-center">
                        <span className="inline-block w-4 h-4 bg-blue-50 border border-blue-500 mr-2 dark:bg-blue-900"></span>
                        Las filas resaltadas en azul indican que el producto pertenece al inventario y su cantidad se descontará al guardar la compra.
                    </div>
                    {isEditMode && (
                        <div className="flex items-center text-red-500 dark:text-red-400 font-medium">
                            * Nota: La cantidad de productos de inventario ya guardados previamente NO SE PUEDE MODIFICAR. Si desea aumentar, cree un registro nuevo en la tabla.
                        </div>
                    )}
                </div>

                <button onClick={addItem} className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-bold py-1 px-3 rounded flex items-center disabled:bg-gray-200 disabled:text-gray-500" disabled={isSaving}>
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
                    onClick={triggerSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center text-lg disabled:bg-blue-400"
                    disabled={isSaving}
                >
                    <FaSave className="mr-2" /> {isSaving ? 'Guardando...' : 'Guardar Compra'}
                </button>
            </div>

            {/* Custom Modal for Confirmation */}
            {confirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 max-w-md border dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 justify-center">Confirmación de Inventario</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 font-medium">
                            Al agregar un producto del inventario, esta cantidad se descontará permanentemente del stock.
                            <br /><br />
                            <span className="text-red-500">IMPORTANTE:</span> En caso de eliminar la boleta o el ítem en un futuro, el stock NO volverá automáticamente al inventario.
                            ¿Desea continuar con esta acción?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setConfirmModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={executeSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Aceptar y Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

export default DetalleCompra;
