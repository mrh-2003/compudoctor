import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createSale, getSaleById, updateSale } from '../services/salesService';
import { getAllClientsForSelection, getDiagnosticReportByNumber, getClientById } from '../services/diagnosticService'; // Reusing client fetch
import Select from 'react-select';
import { FaPlus, FaTrash, FaSave, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { getInventoryItems, updateInventoryItem } from '../services/inventoryService';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
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
    const { theme } = useContext(ThemeContext);

    const [loading, setLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);

    // Inventory status
    const [inventoryData, setInventoryData] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(null);

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
        {
            id: Date.now(),
            quantity: 1,
            description: '',
            unitPrice: 0,
            amount: 0,
            purchaseDocNum: '',
            provider: '',
            observation: '',
            isFromInventory: false,
            inventoryItemId: null,
            maxQuantity: null,
            isExistingInventoryItem: false
        }
    ]);

    useEffect(() => {
        const loadInventory = async () => {
            try {
                const data = await getInventoryItems();
                // Filter only items with stock > 0 for suggestions
                setInventoryData(data.filter(item => item.cantidad > 0));
            } catch (error) {
                console.error("Error loading inventory", error);
            }
        };

        loadInventory();
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
                setItems(sale.items.map((i, idx) => ({
                    ...i,
                    id: Date.now() + idx,
                    isFromInventory: i.isFromInventory || false,
                    inventoryItemId: i.inventoryItemId || null,
                    maxQuantity: null,
                    isExistingInventoryItem: i.isFromInventory || false
                })));
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
        // Now 'amount' in items is the Final Amount (inclusive of IGV if applicable)
        const sumFinal = items.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

        let _sub = 0;
        let _igv = 0;
        let _total = 0;

        if (header.tipoComprobante === 'BOLETA FISICA') {
            // No IGV scenario
            _total = sumFinal;
            _sub = sumFinal;
            _igv = 0;
        } else {
            // IGV included in the Item Amount
            // Total = Subtotal + IGV
            // Total = Subtotal * 1.18
            // Subtotal = Total / 1.18
            _total = sumFinal;
            _sub = _total / 1.18;
            _igv = _total - _sub;
        }

        return { subTotal: _sub, igv: _igv, total: _total };
    }, [items, header.tipoComprobante]);

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

                const q = parseFloat(newQuant) || 0;
                const p = parseFloat(item.unitPrice) || 0;
                let newAmount = '0.00';
                if (!isNaN(q) && !isNaN(p)) {
                    const base = q * p;
                    const isNoIgv = header.tipoComprobante === 'BOLETA FISICA';
                    const rate = isNoIgv ? 1 : 1.18;
                    newAmount = (base * rate).toFixed(2);
                }

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
                    return item;
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
                if (field === 'quantity' || field === 'unitPrice') {
                    const q = field === 'quantity' ? parseFloat(value) : parseFloat(item.quantity);
                    const p = field === 'unitPrice' ? parseFloat(value) : parseFloat(item.unitPrice);
                    if (!isNaN(q) && !isNaN(p)) {
                        const base = q * p;
                        // Calculate IGV based on current header type
                        const isNoIgv = header.tipoComprobante === 'BOLETA FISICA';
                        const rate = isNoIgv ? 1 : 1.18;
                        changes.amount = (base * rate).toFixed(2);
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
            purchaseDocNum: '',
            provider: '',
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
            toast.success('Ítem eliminado de la venta. Recuerda que el stock descontado previamente no se restaurará.', { duration: 4000 });
        }

        if (items.length > 1) {
            setItems(prev => prev.filter(i => i.id !== id));
        } else {
            toast("Debe haber al menos un ítem");
        }
    };

    const triggerSave = () => {
        if (!header.clientName) return toast.error("Nombre de cliente requerido");
        if (!header.tipoComprobante) return toast.error("Tipo de comprobante requerido");
        if (!header.saleCompNum?.trim()) return toast.error("El N° de Comprobante de Venta es obligatorio");

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

        const saleData = {
            ...header,
            items: items.map(i => ({
                quantity: parseFloat(i.quantity) || 0,
                description: i.description,
                unitPrice: parseFloat(i.unitPrice) || 0,
                amount: parseFloat(i.amount) || 0,
                purchaseDocNum: i.purchaseDocNum,
                provider: i.provider,
                observation: i.observation,
                isFromInventory: i.isFromInventory || false,
                inventoryItemId: i.inventoryItemId || null
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
            navigate('/ventas');
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
                            onChange={e => {
                                const newType = e.target.value;
                                setHeader({ ...header, tipoComprobante: newType });

                                // Recalculate amounts based on new type
                                setItems(prev => prev.map(item => {
                                    const q = parseFloat(item.quantity);
                                    const p = parseFloat(item.unitPrice);
                                    if (!isNaN(q) && !isNaN(p)) {
                                        const base = q * p;
                                        const isNoIgv = newType === 'BOLETA FISICA';
                                        const rate = isNoIgv ? 1 : 1.18;
                                        return { ...item, amount: (base * rate).toFixed(2) };
                                    }
                                    return item;
                                }));
                            }}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                            disabled={isSaving}
                        >
                            {TIPOS_COMPROBANTE.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">N° Comprobante Venta <span className="text-red-500">*</span></label>
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
                            styles={{
                                control: (baseStyles) => ({
                                    ...baseStyles,
                                    backgroundColor: theme === "dark" ? "#374151" : "#fff",
                                    borderColor: theme === "dark" ? "#4B5563" : baseStyles.borderColor,
                                    color: theme === "dark" ? "#fff" : "#000",
                                }),
                                menu: (baseStyles) => ({
                                    ...baseStyles,
                                    backgroundColor: theme === "dark" ? "#374151" : "#fff",
                                    color: theme === "dark" ? "#fff" : "#000",
                                }),
                                option: (baseStyles, state) => ({
                                    ...baseStyles,
                                    backgroundColor: state.isFocused
                                        ? (theme === "dark" ? "#4B5563" : "#e5e7eb")
                                        : "transparent",
                                    color: theme === "dark" ? "#fff" : "#000",
                                }),
                                singleValue: (baseStyles) => ({
                                    ...baseStyles,
                                    color: theme === "dark" ? "#fff" : "#000",
                                }),
                                input: (baseStyles) => ({
                                    ...baseStyles,
                                    color: theme === "dark" ? "#fff" : "#000",
                                }),
                                placeholder: (baseStyles) => ({
                                    ...baseStyles,
                                    color: theme === "dark" ? "#9CA3AF" : "#9CA3AF",
                                }),
                            }}
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

                <div className={`overflow-x-auto mb-4 transition-all ${showSuggestions ? 'pb-[200px]' : ''}`}>
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
                                <tr key={item.id} className={item.isFromInventory ? "bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500" : ""}>
                                    <td className="p-1 border text-center relative group">
                                        <input type="number" min="1" className="w-16 p-1 border rounded text-center dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-600"
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
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                                                                    {inv.marca && <span className="mr-2 border-r pr-2 border-gray-300 dark:border-gray-600">Marca: <span className="font-semibold">{inv.marca}</span></span>}
                                                                    {inv.modelo && <span>Modelo: <span className="font-semibold">{inv.modelo}</span></span>}
                                                                </div>
                                                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Stock disponible: {availableStock}</div>
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
                        Las filas resaltadas en azul indican que el producto pertenece al inventario y su cantidad se descontará al guardar la venta.
                    </div>
                    {isEditMode && (
                        <div className="flex items-center text-red-500 dark:text-red-400 font-medium">
                            * Nota: La cantidad de productos de inventario ya guardados previamente NO SE PUEDE MODIFICAR. Si desea aumentar, cree un registro nuevo en la tabla.
                        </div>
                    )}
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
                    onClick={triggerSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg flex items-center text-lg disabled:bg-blue-400"
                    disabled={isSaving}
                >
                    <FaSave className="mr-2" /> {isSaving ? 'Guardando...' : 'Guardar Venta'}
                </button>
            </div>

            {/* Custom Modal for Confirmation */}
            {confirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 max-w-md border dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirmación de Inventario</h3>
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
        </div>
    );
}

export default DetalleVenta;
