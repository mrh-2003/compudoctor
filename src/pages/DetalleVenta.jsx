import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createSale, getSaleById, updateSale } from '../services/salesService';
import { getAllClientsForSelection, getDiagnosticReportByNumber, getClientById } from '../services/diagnosticService'; // Reusing client fetch
import Select from 'react-select';
import { FaPlus, FaTrash, FaSave, FaArrowLeft, FaSearch } from 'react-icons/fa';
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
    const { id } = useParams();
    const isEditMode = id && id !== 'nueva';
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);
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
            if (sale.clientId) {
                // Find and set selected client option to keep UI consistent if possible, though not strictly required
                const clientFound = clients.find(c => c.id === sale.clientId);
                if (clientFound) {
                    setSelectedClient({
                        value: clientFound.id,
                        label: clientFound.display,
                        data: clientFound
                    });
                }
            }

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
        if (isSaving) return;
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
                docNum = c.dni || ''; // Adjust based on actual data structure if needed
                // Assuming c.dni exists or fallback
                name = c.tipoPersona === 'JURIDICA' ? c.razonSocial : `${c.nombre} ${c.apellido}`;
                // Correction: display logic is complex, name needs to be simple string
            }

            // Refine Name Logic
            if (c.tipoPersona === 'JURIDICA') {
                name = c.razonSocial;
                docType = 'RUC';
                docNum = c.ruc;
            } else {
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
            setHeader(prev => ({
                ...prev,
                clientId: '',
                clientName: '',
                clientDocNum: ''
            }));
        }
    };

    const handleSearchReport = async () => {
        if (!header.techReportNum) {
            toast.error("Ingrese un número de informe");
            return;
        }

        setIsSaving(true);
        try {
            const report = await getDiagnosticReportByNumber(header.techReportNum);
            if (report) {
                toast.success(`Informe #${report.reportNumber} encontrado`);

                if (report.clientId) {
                    const client = await getClientById(report.clientId);
                    if (client) {
                        let docType = 'DNI';
                        let docNum = '';
                        let name = '';

                        if (client.tipoPersona === 'JURIDICA') {
                            docType = 'RUC';
                            docNum = client.ruc;
                            name = client.razonSocial;
                        } else {
                            name = `${client.nombre} ${client.apellido}`;
                            docNum = client.dni || ''; // Assuming DNI field
                        }

                        setHeader(prev => ({
                            ...prev,
                            clientName: name,
                            clientDocType: docType,
                            clientDocNum: docNum,
                            clientId: client.id
                        }));

                        // Update Select UI
                        // Need to reconstruct the 'display' format used in Select
                        const clientDisplay = client.tipoPersona === 'JURIDICA'
                            ? `${client.razonSocial} (RUC: ${client.ruc})`
                            : `${client.nombre} ${client.apellido}`;

                        setSelectedClient({
                            value: client.id,
                            label: clientDisplay,
                            data: { ...client, display: clientDisplay }
                        });
                    }
                }
            } else {
                toast.error("Informe no encontrado");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al buscar informe");
        } finally {
            setIsSaving(false);
        }
    };

    // Recalculate totals
    const { subTotal, igv, total } = useMemo(() => {
        const sum = items.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        const _sub = sum;

        // Logic change: BOLETA FISICA = No IGV (IGV = 0), and Total = Subtotal
        const _igv = header.tipoComprobante === 'BOLETA FISICA' ? 0 : _sub * 0.18;
        const _total = _sub + _igv;

        return { subTotal: _sub, igv: _igv, total: _total };
    }, [items, header.tipoComprobante]);

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
        setItems(prev => [...prev, { id: Date.now(), quantity: 1, description: '', unitPrice: 0, amount: 0, purchaseDocNum: '', provider: '', observation: '' }]);
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

        setIsSaving(true);
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
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-8">Cargando...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex items-center mb-6 gap-4">
                <button onClick={() => navigate('/ventas')} className="text-gray-600 dark:text-gray-300 hover:text-blue-500" disabled={isSaving}>
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
                            disabled={isSaving}
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
                            disabled={isSaving}
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
                            disabled={isSaving}
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
                            isDisabled={isSaving}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">N° Informe Técnico</label>
                        <div className="flex gap-1">
                            <input
                                type="text"
                                value={header.techReportNum}
                                onChange={e => setHeader({ ...header, techReportNum: e.target.value })}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                                disabled={isSaving}
                            />
                            <button
                                onClick={handleSearchReport}
                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded disabled:bg-blue-300"
                                title="Buscar Informe"
                                type="button"
                                disabled={isSaving}
                            >
                                <FaSearch />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-1">Tipo Doc. Cliente</label>
                        <select
                            value={header.clientDocType}
                            onChange={e => setHeader({ ...header, clientDocType: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                            disabled={isSaving}
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
                            disabled={isSaving}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold mb-1">Nombre / Razón Social</label>
                        <input
                            type="text"
                            value={header.clientName}
                            onChange={e => setHeader({ ...header, clientName: e.target.value })}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                            disabled={isSaving}
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
                                            value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="number" min="0" step="0.01" className="w-20 p-1 border rounded text-right dark:bg-gray-700"
                                            value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border bg-gray-50 dark:bg-gray-900 text-right font-bold">
                                        {parseFloat(item.amount).toFixed(2)}
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.purchaseDocNum} onChange={(e) => handleItemChange(item.id, 'purchaseDocNum', e.target.value)} disabled={isSaving} />
                                    </td>
                                    <td className="p-1 border">
                                        <input type="text" className="w-full p-1 border rounded dark:bg-gray-700"
                                            value={item.provider} onChange={(e) => handleItemChange(item.id, 'provider', e.target.value)} disabled={isSaving} />
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
                    <FaSave className="mr-2" /> {isSaving ? 'Guardando...' : 'Guardar Venta'}
                </button>
            </div>
        </div>
    );
}

export default DetalleVenta;
