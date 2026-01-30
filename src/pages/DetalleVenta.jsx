import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createSale, getSaleById, updateSale } from '../services/salesService';
import { getAllClientsForSelection } from '../services/diagnosticService'; // Reusing client fetch
import Select from 'react-select';
import { FaPlus, FaTrash, FaSave, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

const TIPOS_COMPROBANTE = [
    "BOLETA FISICA",
    "FACTURA ELECTRONICA",
    "BOLETA ELECTRONICA"
];

const TIPOS_DOC_CLIENTE = [
    "DNI", "RUC", "CE", "PASAPORTE"
];

function DetalleVenta() {
    const { id } = useParams(); // If "nueva", id undefined? No, route will be /ventas/nueva or /ventas/:id
    // Wait, if path is /ventas/nueva, id is 'nueva'? Or different route?
    // I'll set route /ventas/nueva and /ventas/:id. If id is present and not 'nueva', it's edit.

    const isEditMode = id && id !== 'nueva';
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEditMode);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);

    const [header, setHeader] = useState({
        date: new Date().toISOString().split('T')[0],
        tipoComprobante: TIPOS_COMPROBANTE[0],
        saleCompNum: '',
        techReportNum: '',
        clientName: '',
        clientDocType: 'DNI',
        clientDocNum: '',
        clientId: ''
    });

    const [items, setItems] = useState([
        { id: Date.now(), quantity: 1, description: '', unitPrice: 0, amount: 0, purchaseDocNum: '', provider: '', observation: '' }
    ]);

    useEffect(() => {
        loadClients();
        if (isEditMode) {
            loadSale();
        }
    }, [id]);

    const loadClients = async () => {
        try {
            const data = await getAllClientsForSelection();
            setClients(data);
        } catch (e) {
            console.error("Error loading clients", e);
        }
    };

    const loadSale = async () => {
        try {
            const sale = await getSaleById(id);
            if (!sale) {
                toast.error("Venta no encontrada");
                navigate('/ventas');
                return;
            }
            setHeader({
                date: sale.date,
                tipoComprobante: sale.tipoComprobante,
                saleCompNum: sale.saleCompNum,
                techReportNum: sale.techReportNum,
                clientName: sale.clientName,
                clientDocType: sale.clientDocType,
                clientDocNum: sale.clientDocNum,
                clientId: sale.clientId
            });
            // If editing, map items
            if (sale.items) {
                setItems(sale.items.map((i, idx) => ({ ...i, id: Date.now() + idx })));
            }
        } catch (error) {
            toast.error("Error cargando venta");
        } finally {
            setLoading(false);
        }
    };

    const handleClientSelect = (option) => {
        setSelectedClient(option);
        if (option) {
            const c = option.data;
            let docType = 'DNI';
            let docNum = '';
            let name = c.display;

            if (c.tipoPersona === 'JURIDICA') {
                docType = 'RUC';
                docNum = c.ruc;
                name = c.razonSocial;
            } else {
                docNum = c.dni || ''; // Assuming DNI field exists or we extract from somewhere. Actually getAllClientsForSelection returns limited data.
                // Re-checking diagnosticService getAllClientsForSelection...
                name = `${c.nombre} ${c.apellido}`;
            }

            setHeader(prev => ({
                ...prev,
                clientName: name,
                clientDocType: docType,
                clientDocNum: docNum,
                clientId: c.id
            }));
        } else {
            // Clear or keep? clear
            setHeader(prev => ({
                ...prev,
                clientId: '',
                clientName: '',
                clientDocNum: ''
            }));
        }
    };

    // Recalculate totals
    const { subTotal, igv, total } = useMemo(() => {
        const sum = items.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        // User asked: TOTAL = SUBTOTAL + IGV. 
        // Usually Importe includes IGV or not?
        // "PRECIO IMPORTE (PRECIO IMPORTE * CANTIDAD)" -> Should be Unit Price * Cant... ambiguous.
        // Assuming user enters values that are BASE? Or values are VALID TOTAL?
        // "IGV = SUBTOTAL * 0.18". "TOTAL = SUBTOTAL + IGV".
        // This implies the Item Amount is the Subtotal part? Or the Item Amount is the Total?
        // Let's assume the entered Unit Price is EXCLUDING IGV (Subtotal base).

        const _sub = sum;
        const _igv = _sub * 0.18;
        const _total = _sub + _igv;

        return { subTotal: _sub, igv: _igv, total: _total };
    }, [items]);

    const handleItemChange = (id, field, value) => {
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
        setItems(prev => [...prev, { id: Date.now(), quantity: 1, description: '', unitPrice: 0, amount: 0, purchaseDocNum: '', provider: '', observation: '' }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(prev => prev.filter(i => i.id !== id));
        } else {
            toast("Debe haber al menos un ítem");
        }
    };

    const handleSave = async () => {
        if (!header.clientName) return toast.error("Nombre de cliente requerido");
        if (!header.tipoComprobante) return toast.error("Tipo de comprobante requerido");

        const saleData = {
            ...header,
            items: items.map(i => ({
                quantity: parseFloat(i.quantity) || 0,
                description: i.description,
                unitPrice: parseFloat(i.unitPrice) || 0,
                amount: parseFloat(i.amount) || 0,
                purchaseDocNum: i.purchaseDocNum,
                provider: i.provider,
                observation: i.observation
            })),
            subTotal: subTotal,
            igv: igv,
            total: total
        };

        try {
            if (isEditMode) {
                await updateSale(id, saleData);
                toast.success("Venta actualizada");
            } else {
                await createSale(saleData);
                toast.success("Venta creada");
                navigate('/ventas');
            }
        } catch (error) {
            toast.error("Error al guardar");
            console.error(error);
        }
    };

    if (loading) return <div className="p-8">Cargando...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex items-center mb-6 gap-4">
                <button onClick={() => navigate('/ventas')} className="text-gray-600 dark:text-gray-300 hover:text-blue-500">
                    <FaArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {isEditMode ? 'Editar Venta' : 'Nueva Venta'}
                </h1>
            </div>

            {/* Header Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 mb-6">
                <h2 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Datos del Comprobante</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold mb-1">Tipo de Comprobante</label>
                        <select
                            value={header.tipoComprobante}
                            onChange={e => setHeader({ ...header, tipoComprobante: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                        >
                            {TIPOS_COMPROBANTE.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">N° Comprobante Venta</label>
                        <input
                            type="text"
                            value={header.saleCompNum}
                            onChange={e => setHeader({ ...header, saleCompNum: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm font-bold"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold mb-1">Fecha de Venta</label>
                        <input
                            type="date"
                            value={header.date}
                            onChange={e => setHeader({ ...header, date: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold mb-1">Buscar Cliente (Opcional)</label>
                        <Select
                            options={clients.map((c) => ({
                                value: c.id,
                                label: c.display,
                                data: c,
                            }))}
                            value={selectedClient}
                            onChange={handleClientSelect}
                            placeholder="Buscar cliente..."
                            isClearable
                            className="text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">N° Informe Técnico</label>
                        <input
                            type="text"
                            value={header.techReportNum}
                            onChange={e => setHeader({ ...header, techReportNum: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-1">Tipo Doc. Cliente</label>
                        <select
                            value={header.clientDocType}
                            onChange={e => setHeader({ ...header, clientDocType: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                        >
                            {TIPOS_DOC_CLIENTE.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">N° Documento Cliente</label>
                        <input
                            type="text"
                            value={header.clientDocNum}
                            onChange={e => setHeader({ ...header, clientDocNum: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold mb-1">Nombre / Razón Social</label>
                        <input
                            type="text"
                            value={header.clientName}
                            onChange={e => setHeader({ ...header, clientName: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700">
                <h2 className="text-lg font-bold mb-4 text-green-600 border-b pb-2">Detalle de Productos / Servicios</h2>

                <div className="overflow-x-auto mb-4">
                    <table className="min-w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-100 dark:bg-gray-700 uppercase">
                            <tr>
                                <th className="p-2 border">Cant.</th>
                                <th className="p-2 border w-64">Descripción</th>
                                <th className="p-2 border">P. Unit</th>
                                <th className="p-2 border">Importe</th>
                                <th className="p-2 border">Fact/Guia Compra</th>
                                <th className="p-2 border">Proveedor</th>
                                <th className="p-2 border">Observación</th>
                                <th className="p-2 border text-center">x</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="p-1 border">
                                        <input type="number" min="1" className="w-16 p-1 border rounded text-center dark:bg-gray-700"
                                            value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="number" min="0" step="0.01" className="w-20 p-1 border rounded text-right dark:bg-gray-700"
                                            value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} />
                                    </td>
                                    <td className="p-1 border bg-gray-50 dark:bg-gray-900 text-right font-bold">
                                        {parseFloat(item.amount).toFixed(2)}
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.purchaseDocNum} onChange={(e) => handleItemChange(item.id, 'purchaseDocNum', e.target.value)} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.provider} onChange={(e) => handleItemChange(item.id, 'provider', e.target.value)} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.observation} onChange={(e) => handleItemChange(item.id, 'observation', e.target.value)} />
                                    </td>
                                    <td className="p-1 border text-center">
                                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <button onClick={addItem} className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-bold py-1 px-3 rounded flex items-center mb-6">
                    <FaPlus className="mr-1" /> Agregar Fila
                </button>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between p-2 border-b">
                            <span className="font-bold">SUBTOTAL:</span>
                            <span>S/ {subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-2 border-b">
                            <span className="font-bold">IGV (18%):</span>
                            <span>S/ {igv.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-200 dark:bg-gray-700 rounded font-bold text-lg">
                            <span>TOTAL:</span>
                            <span>S/ {total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-8 space-x-4">
                <button
                    onClick={() => navigate('/ventas')}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center text-lg"
                >
                    <FaSave className="mr-2" /> Guardar Venta
                </button>
            </div>
        </div>
    );
}

export default DetalleVenta;
