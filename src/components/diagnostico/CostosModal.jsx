import { useState } from 'react';
import Modal from '../common/Modal';
import { addPayment, markReportAsPaid, updateDiagnosticReport } from '../../services/diagnosticService';
import toast from 'react-hot-toast';
import { FaMoneyBillWave, FaWallet, FaTrash, FaPlus } from 'react-icons/fa';

function CostosModal({ report, onClose, onUpdate }) {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentData, setPaymentData] = useState({
        metodoPago: 'Yape',
        otroMetodo: ''
    });
    const [paymentBatch, setPaymentBatch] = useState([]);
    const [discount, setDiscount] = useState(report.descuento || 0);

    // State for Payment Vouchers (Comprobantes de Pago)
    const [comprobantesPago, setComprobantesPago] = useState(report.comprobantesPago || (report.comprobante ? [{ ...report.comprobante, id: Date.now() }] : []));
    const [newComprobante, setNewComprobante] = useState({
        tipo: 'BOLETA ELECTRONICA',
        numero: '',
        monto: ''
    });

    // Helper to gather all cost items with unique IDs
    const getAllCostItems = () => {
        const items = [];

        // Check if Revision Check is strictly 'NO' in ANY area history
        // Check if Revision Check is strictly 'NO' in ANY area history
        let shouldChargeRevision = true;
        let shouldChargeReparacion = true; // Default is YES, charge repair

        if (report.diagnosticoPorArea) {
            const areasToCheck = ['IMPRESORA', 'HARDWARE', 'SOFTWARE', 'ELECTRONICA', 'TESTEO'];

            for (const area of areasToCheck) {
                if (report.diagnosticoPorArea[area]) {
                    const history = report.diagnosticoPorArea[area];
                    // Find the last entry that has a explicit decision
                    const entryWithDecision = [...history].reverse().find(h => h.printer_cobra_revision || h.cobra_revision);

                    if (entryWithDecision) {
                        const decision = entryWithDecision.printer_cobra_revision || entryWithDecision.cobra_revision;
                        if (decision === 'NO') {
                            shouldChargeRevision = false;
                        }
                    }
                }
            }

            // Check specifically for Reparacion logic in TESTEO
            if (report.diagnosticoPorArea['TESTEO']) {
                const testeoHistory = report.diagnosticoPorArea['TESTEO'];
                const repairEntry = [...testeoHistory].reverse().find(h => h.cobra_reparacion);
                if (repairEntry && repairEntry.cobra_reparacion === 'NO') {
                    shouldChargeReparacion = false;
                }
            }
        }

        // LOGIC MATRIX for CostosModal:
        // By default: Charge Repair (if present) + Diagnostic is 0.
        // If Cobrar Reparacion = NO -> Charge Diagnostic, Reparaction = 0.

        const hasReparacionServiceInList = report.servicesList?.some(s => s.service && s.service.toUpperCase().includes('REPARACIÓN'));

        let initialDiagnosticCost = parseFloat(report.diagnostico);

        // If we have a repair service and we ARE charging for it, Diagnostic becomes 0 (it's included or waived)
        if (hasReparacionServiceInList && shouldChargeReparacion) {
            initialDiagnosticCost = 0;
        }

        // 1. Diagnostic
        if (shouldChargeRevision && initialDiagnosticCost > 0) {
            items.push({
                id: 'diag-1',
                label: 'Diagnóstico',
                amount: initialDiagnosticCost,
                type: 'Diagnóstico'
            });
        }

        // 2. Services List (Main) from Diagnostico Form
        if (report.servicesList) {
            report.servicesList.forEach((s, idx) => {
                let amount = parseFloat(s.amount) || 0;

                // Flags
                const isRevision = s.service && s.service.toUpperCase().includes('REVISIÓN');
                const isReparacion = s.service && s.service.toUpperCase().includes('REPARACIÓN');

                // If Revision is disabled and service name contains "Revisión", set amount to 0
                if (!shouldChargeRevision && isRevision) {
                    amount = 0;
                }

                // If Reparacion is disabled (User said NO to charging repair), set amount to 0
                if (!shouldChargeReparacion && isReparacion) {
                    amount = 0;
                }

                items.push({
                    id: `main-${idx}`,
                    label: s.service + (s.specification ? ` [${s.specification}]` : ''),
                    amount: amount,
                    type: 'Principal'
                });
            });
        }



        // 3. Legacy Additional Services (Global)
        if (report.additionalServices) {
            report.additionalServices.forEach((s, idx) => {
                const specInfo = s.specification ? ` [${s.specification}]` : '';
                items.push({
                    id: s.id || `legacy-${idx}`,
                    label: `${s.description}${specInfo}`,
                    amount: parseFloat(s.amount) || 0,
                    type: 'Adicional (Global)'
                });
            });
        }

        // 4. History/Area Additional Services (New)
        if (report.diagnosticoPorArea) {
            const seenServiceIds = new Set();

            Object.entries(report.diagnosticoPorArea).forEach(([area, entries]) => {
                entries.forEach((entry, entryIdx) => {
                    const processServiceList = (list, listName) => {
                        if (list) {
                            list.forEach((s, sIdx) => {
                                // If service has an ID and we've seen it, skip it.
                                if (s.id && seenServiceIds.has(s.id)) {
                                    return;
                                }
                                if (s.id) {
                                    seenServiceIds.add(s.id);
                                }

                                const specInfo = s.specification ? ` [${s.specification}]` : '';
                                items.push({
                                    id: s.id || `area-${area}-${entryIdx}-${listName}-${sIdx}`,
                                    label: `${s.description}${specInfo} (${area})`,
                                    amount: parseFloat(s.amount) || 0,
                                    type: 'Adicional (Área)'
                                });
                            });
                        }
                    };

                    processServiceList(entry.addedServices, 'added');
                    processServiceList(entry.printer_services_additional, 'printer-add');
                });
            });
        }

        return items;
    };

    const costItems = getAllCostItems();

    // Map of IDs that have IGV applied
    // Assuming report.igvApplicableIds is an array of strings. If undefined, default to empty.
    const [igvMap, setIgvMap] = useState(() => {
        const map = {};
        if (report.igvApplicableIds) {
            report.igvApplicableIds.forEach(id => map[id] = true);
        }
        return map;
    });

    const diagnosticoCost = parseFloat(report.diagnostico) || 0;

    // Calculate Totals dynamically
    const { totalBase, totalIgv, totalFinal, groupedTotals } = costItems.reduce((acc, item) => {
        const base = item.amount;
        const hasIgv = !!igvMap[item.id];
        const igv = hasIgv ? (base * 0.18) : 0;

        acc.totalBase += base;
        acc.totalIgv += igv;
        acc.totalFinal += (base + igv);

        // Group totals breakdown
        if (item.type === 'Diagnóstico') acc.groupedTotals.diagnostico += base;
        else if (item.type === 'Principal') acc.groupedTotals.principal += base;
        else acc.groupedTotals.adicional += base; // Covers 'Adicional (Global)' and 'Adicional (Área)'

        return acc;
    }, { totalBase: 0, totalIgv: 0, totalFinal: 0, groupedTotals: { diagnostico: 0, principal: 0, adicional: 0 } });

    const pagosRealizados = report.pagosRealizado || [];
    const totalPagado = pagosRealizados.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
    const saldo = (totalFinal - (parseFloat(discount) || 0)) - totalPagado;

    // Handler for toggling IGV on a specific item
    const handleToggleItemIgv = async (itemId) => {
        const newMap = { ...igvMap, [itemId]: !igvMap[itemId] };
        setIgvMap(newMap);

        // Calculate new persistence data
        const newIgvApplicableIds = Object.keys(newMap).filter(id => newMap[id]);

        // Re-calculate totals for DB save (manual reducer as we are inside the handler)
        const reCalc = costItems.reduce((acc, item) => {
            const hasIgv = !!newMap[item.id];
            const igv = hasIgv ? (item.amount * 0.18) : 0;
            acc.final += (item.amount + igv);
            return acc;
        }, { final: 0 });

        const newDiscount = parseFloat(discount) || 0;
        const newTotal = reCalc.final - newDiscount;

        try {
            await updateDiagnosticReport(report.id, {
                igvApplicableIds: newIgvApplicableIds,
                total: newTotal,
                saldo: newTotal - totalPagado
            });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error updating IGV", error);
            toast.error("Error al actualizar IGV");
            setIgvMap(igvMap); // Revert
        }
    };

    const handleAddComprobante = async () => {
        if (!newComprobante.numero) {
            toast.error("Ingrese el número de comprobante");
            return;
        }

        /* 
        // Optional: Require amount? User said "igual que los comprobantes de compra" which I added amount to.
        if (!newComprobante.monto) {
             toast.error("Ingrese el monto del comprobante");
             return;
        }
        */

        const updatedList = [...comprobantesPago, { ...newComprobante, id: Date.now() }];

        setIsSubmitting(true);
        try {
            await updateDiagnosticReport(report.id, {
                comprobantesPago: updatedList,
                // Keep backward compatibility if needed, or just switch to new field
                comprobante: updatedList.length > 0 ? updatedList[0] : null
            });
            setComprobantesPago(updatedList);
            setNewComprobante({ tipo: 'BOLETA ELECTRONICA', numero: '', monto: '' });
            toast.success("Comprobante agregado");
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar comprobante");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveComprobante = async (id) => {
        const updatedList = comprobantesPago.filter(c => c.id !== id);
        setIsSubmitting(true);
        try {
            await updateDiagnosticReport(report.id, {
                comprobantesPago: updatedList,
                comprobante: updatedList.length > 0 ? updatedList[0] : null
            });
            setComprobantesPago(updatedList);
            toast.success("Comprobante eliminado");
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar comprobante");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if payment is allowed
    const canAddPayment = report.tecnicoResponsable && report.area && report.area !== 'N/A';

    const handleOpenPaymentModal = () => {
        setPaymentData({
            monto: '',
            metodoPago: 'Yape',
            otroMetodo: ''
        });
        setPaymentBatch([]);
        setIsPaymentModalOpen(true);
        setPaymentType('SERVICE'); // Default type
    };

    const [paymentType, setPaymentType] = useState('SERVICE'); // SERVICE or DIAGNOSTICO
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState(0);

    const handlePayDiagnostic = () => {
        const totalPaid = report.aCuenta || 0;
        const diff = diagnosticoCost - totalPaid;

        if (diff < 0) {
            // Overpaid
            setRefundAmount(Math.abs(diff));
            setShowRefundModal(true);
        } else {
            // Need to pay
            setPaymentData({
                monto: diff.toFixed(2),
                metodoPago: 'Yape',
                otroMetodo: ''
            });
            setPaymentType('DIAGNOSTICO');
            setIsPaymentModalOpen(true);
        }
    };

    const handleRefundDecision = async (decision) => {
        setIsSubmitting(true);
        try {
            let refundNote = decision === 'DEVOLVER'
                ? `Devolución al cliente: S/ ${refundAmount.toFixed(2)}`
                : `Saldo a favor conservado: S/ ${refundAmount.toFixed(2)}`;

            await markReportAsPaid(report.id, null, refundNote);
            toast.success('Informe marcado como PAGADO');
            setShowRefundModal(false);
            onClose(); // Close modal on finish
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Error al procesar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDiscountChange = (e) => {
        const val = e.target.value;
        if (parseFloat(val) < 0) return;
        setDiscount(val);
    };

    const saveDiscount = async () => {
        const val = parseFloat(discount) || 0;
        const totalAfterDiscount = totalFinal - val; // totalFinal comes from the reducing logic in render scope (costItems + igvMap)

        try {
            await updateDiagnosticReport(report.id, {
                descuento: val,
                total: totalAfterDiscount,
                saldo: totalAfterDiscount - totalPagado
            });
            if (onUpdate) onUpdate();
            toast.success("Descuento actualizado");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar descuento");
        }
    };

    const handleFillBalance = () => {
        const currentBatchTotal = paymentBatch.reduce((sum, p) => sum + parseFloat(p.monto), 0);
        const remaining = Math.max(0, saldo - currentBatchTotal);
        setPaymentData(prev => ({ ...prev, monto: remaining.toFixed(2) }));
    };

    const handleAddPaymentToBatch = () => {
        const monto = parseFloat(paymentData.monto);
        if (!monto || monto <= 0) {
            toast.error('Ingrese un monto válido');
            return;
        }

        const currentBatchTotal = paymentBatch.reduce((sum, p) => sum + parseFloat(p.monto), 0);
        // Allow a tiny tolerance for float precision issues
        if (monto + currentBatchTotal > saldo + 0.1) {
            toast.error('El monto total supera el saldo pendiente');
            return;
        }

        const metodo = paymentData.metodoPago === 'Otro' ? paymentData.otroMetodo : paymentData.metodoPago;
        if (!metodo) {
            toast.error('Ingrese un método de pago');
            return;
        }

        const newPayment = {
            id: Date.now(),
            fecha: new Date().toISOString(),
            monto: monto,
            formaPago: metodo
        };

        setPaymentBatch([...paymentBatch, newPayment]);
        // Reset amount but keep method? Or reset method? User might pay multiple with same method.
        // Let's reset amount to avoid double addition of same large number.
        setPaymentData(prev => ({ ...prev, monto: '' }));
    };

    const handleRemovePaymentFromBatch = (id) => {
        setPaymentBatch(paymentBatch.filter(p => p.id !== id));
    };

    const handlePaymentSubmit = async (e) => {
        if (e) e.preventDefault();

        if (paymentBatch.length === 0) {
            toast.error('Debe agregar al menos un pago a la lista antes de registrar.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Process each payment in the batch
            for (const payment of paymentBatch) {
                await addPayment(report.id, {
                    fecha: payment.fecha,
                    monto: payment.monto,
                    formaPago: payment.formaPago
                });
            }

            if (paymentType === 'DIAGNOSTICO') {
                // If it was a diagnostic payment flow, mark as fully paid/closed
                // Pass null as payment data because we already added the payments above
                const success = await markReportAsPaid(report.id, null);
                if (success) {
                    toast.success('Diagnóstico pagado y reporte cerrado');
                    setIsPaymentModalOpen(false);
                    onClose();
                    onUpdate();
                } else {
                    toast.error('Error al finalizar el pago del diagnóstico');
                }
            } else {
                toast.success('Pagos registrados correctamente');
                setIsPaymentModalOpen(false);
                onUpdate();
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al registrar los pagos');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <FaWallet className="text-green-600" />
                        Detalle de Costos y Pagos
                    </h2>
                    <div className="text-right">
                        <div className="text-xl font-bold text-gray-800 dark:text-gray-100">N° {report.reportNumber}</div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
                            {report.razonSocial || report.clientName || 'Cliente sin nombre'}
                        </div>
                        <div className="text-xs text-gray-500">
                            {report.marca || ''} {report.modelo || ''}
                        </div>
                    </div>
                </div>

                {/* Services Table with IGV Switch */}
                <div className="mb-6 overflow-x-auto">
                    <h3 className="text-lg font-semibold mb-2">Detalle de Servicios y Productos</h3>
                    <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="px-4 py-2 text-left">Descripción</th>
                                <th className="px-4 py-2 text-center">Tipo</th>
                                <th className="px-4 py-2 text-right">Monto Base</th>
                                <th className="px-4 py-2 text-center">Aplicar IGV</th>
                                <th className="px-4 py-2 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {costItems.map((item) => {
                                const hasIgv = !!igvMap[item.id];
                                const subTotalItem = item.amount + (hasIgv ? item.amount * 0.18 : 0);

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-2 font-medium">{item.label}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`text-[10px] px-2 py-1 rounded border ${item.type === 'Diagnóstico' ? 'bg-gray-100 border-gray-300 text-gray-600' :
                                                item.type === 'Principal' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                                                    'bg-yellow-50 border-yellow-200 text-yellow-600'
                                                }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right">S/ {item.amount.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={hasIgv}
                                                    onChange={() => handleToggleItemIgv(item.id)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </td>
                                        <td className="px-4 py-2 text-right font-bold w-24">
                                            S/ {subTotalItem.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-700 font-bold">
                            <tr>
                                <td colSpan="2" className="px-4 py-2 text-right">Totales:</td>
                                <td className="px-4 py-2 text-right">S/ {totalBase.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right text-gray-500 text-xs">IGV: S/ {totalIgv.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right text-blue-600 text-base">S/ {totalFinal.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Financial Report */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                        {groupedTotals.diagnostico > 0 && (
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Diagnóstico:</span>
                                <span>S/ {groupedTotals.diagnostico.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Total Servicios Principales:</span>
                            <span>S/ {groupedTotals.principal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 pb-2 mb-2">
                            <span>Total Servicios Adicionales:</span>
                            <span>S/ {groupedTotals.adicional.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>S/ {totalBase.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Total IGV (18%):</span>
                            <span>S/ {totalIgv.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Descuento:</span>
                            <div className="flex items-center gap-1">
                                <span className="text-red-500 font-bold">- S/</span>
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={handleDiscountChange}
                                    onBlur={saveDiscount}
                                    className="w-24 p-1 border rounded text-right dark:bg-gray-600 dark:border-gray-500"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between font-bold text-lg">
                            <span>Total General:</span>
                            <span>S/ {(totalFinal - (parseFloat(discount) || 0)).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="font-medium">Total Pagado:</span>
                            <span className="text-green-600 font-bold">S/ {totalPagado.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Saldo Pendiente:</span>
                            <span className="text-red-600 font-bold text-xl">S/ {saldo.toFixed(2)}</span>
                        </div>

                        {canAddPayment && saldo > 0 && (
                            <button
                                onClick={handleOpenPaymentModal}
                                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                            >
                                <FaMoneyBillWave /> Registrar Pago
                            </button>
                        )}
                        {!canAddPayment && (
                            <p className="text-xs text-center text-gray-500 mt-2">
                                * Se requiere técnico responsable y área asignada para registrar pagos.
                            </p>
                        )}
                        {saldo <= 0 && !report.isPaid && (
                            <p className="text-xs text-center text-green-600 mt-2 font-bold">
                                ¡Pagado en su totalidad!
                            </p>
                        )}
                        {report.isPaid && (
                            <p className="text-lg text-center text-blue-600 mt-2 font-black border-2 border-blue-600 p-2 rounded transform -rotate-2">
                                PAGADO
                            </p>
                        )}

                        {!report.isPaid && costItems.find(i => i.type === 'Diagnóstico')?.amount > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                                <p className="text-sm text-center mb-2 font-medium">¿Servicio no realizado?</p>
                                <button
                                    onClick={handlePayDiagnostic}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                                >
                                    <FaMoneyBillWave /> Pagar Solo Diagnóstico (S/ {costItems.find(i => i.type === 'Diagnóstico')?.amount.toFixed(2)})
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payments History */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Historial de Pagos</h3>
                    {pagosRealizados.length > 0 ? (
                        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-2 text-left">Fecha</th>
                                    <th className="px-4 py-2 text-left">Método de Pago</th>
                                    <th className="px-4 py-2 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagosRealizados.map((pago, index) => (
                                    <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                                        <td className="px-4 py-2">{new Date(pago.fecha).toLocaleString()}</td>
                                        <td className="px-4 py-2">{pago.formaPago}</td>
                                        <td className="px-4 py-2 text-right">S/ {(parseFloat(pago.monto) || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500 italic">No se han registrado pagos.</p>
                    )}
                </div>

                {/* Voucher Section (Multiple) */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        Comprobantes de Pago (Emitidos al Cliente)
                    </h3>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="w-full md:w-1/3">
                                <label className="block text-sm font-medium mb-1">Tipo de Comprobante</label>
                                <select
                                    value={newComprobante.tipo}
                                    onChange={(e) => setNewComprobante(prev => ({ ...prev, tipo: e.target.value }))}
                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    disabled={isSubmitting}
                                >
                                    <option value="BOLETA FISICA">BOLETA FISICA</option>
                                    <option value="BOLETA ELECTRONICA">BOLETA ELECTRONICA</option>
                                    <option value="FACTURA ELECTRONICA">FACTURA ELECTRONICA</option>
                                </select>
                            </div>
                            <div className="w-full md:w-1/3">
                                <label className="block text-sm font-medium mb-1">Número</label>
                                <input
                                    type="text"
                                    value={newComprobante.numero}
                                    onChange={(e) => setNewComprobante(prev => ({ ...prev, numero: e.target.value }))}
                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="Ejem: B001-000123"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="block text-sm font-medium mb-1">Monto (S/)</label>
                                <input
                                    type="number"
                                    value={newComprobante.monto}
                                    onChange={(e) => setNewComprobante(prev => ({ ...prev, monto: e.target.value }))}
                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="0.00"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="w-full md:w-auto">
                                <button
                                    onClick={handleAddComprobante}
                                    disabled={isSubmitting}
                                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 px-3 rounded-md flex items-center justify-center gap-2 h-[42px]"
                                    title="Agregar Comprobante"
                                >
                                    <FaPlus />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List of Vouchers */}
                    {comprobantesPago.length > 0 && (
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Tipo</th>
                                        <th className="px-4 py-2 text-left">Número</th>
                                        <th className="px-4 py-2 text-right">Monto</th>
                                        <th className="px-4 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                                    {comprobantesPago.map((comp) => (
                                        <tr key={comp.id}>
                                            <td className="px-4 py-2">{comp.tipo}</td>
                                            <td className="px-4 py-2">{comp.numero}</td>
                                            <td className="px-4 py-2 text-right">{comp.monto ? `S/ ${parseFloat(comp.monto).toFixed(2)}` : '-'}</td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => handleRemoveComprobante(comp.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                    disabled={isSubmitting}
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                        Cerrar
                    </button>
                </div>
            </div>

            {/* Refund Modal */}
            {showRefundModal && (
                <Modal onClose={() => setShowRefundModal(false)}>
                    <div className="p-6 max-w-sm mx-auto">
                        <h3 className="text-xl font-bold mb-4 text-center">Exceso de Pago</h3>
                        <p className="text-center mb-6">
                            El adelanto del cliente (S/ {report.aCuenta.toFixed(2)}) supera el costo del diagnóstico (S/ {diagnosticoCost.toFixed(2)}).
                            <br /><br />
                            <strong>Monto de diferencia: S/ {refundAmount.toFixed(2)}</strong>
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleRefundDecision('DEVOLVER')}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg"
                                disabled={isSubmitting}
                            >
                                Devolver Dinero
                            </button>
                            <button
                                onClick={() => handleRefundDecision('CONSERVAR')}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg"
                                disabled={isSubmitting}
                            >
                                Conservar en Saldo (No devolver)
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <Modal onClose={() => !isSubmitting && setIsPaymentModalOpen(false)}>
                    <div className="p-6 max-w-2xl mx-auto">
                        <h3 className="text-xl font-bold mb-4 text-center">Registrar Pagos</h3>


                        <div className="flex flex-col items-center mb-6">
                            <label className="text-sm font-medium text-gray-500 mb-1">Fecha de Transacción</label>
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg border dark:border-gray-600 mb-2">
                                {new Date().toLocaleString()}
                            </div>
                            <div className="text-sm text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-200 dark:border-red-800">
                                Saldo Pendiente: S/ {Math.max(0, saldo - paymentBatch.reduce((sum, p) => sum + parseFloat(p.monto), 0)).toFixed(2)}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-4">
                                    <label className="block text-sm font-medium mb-1">Método de Pago</label>
                                    <select
                                        value={paymentData.metodoPago}
                                        onChange={(e) => setPaymentData({ ...paymentData, metodoPago: e.target.value })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        disabled={isSubmitting}
                                    >
                                        <option value="Yape">Yape</option>
                                        <option value="Plin">Plin</option>
                                        <option value="Transferencia">Transferencia</option>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>

                                <div className="md:col-span-6">
                                    <label className="block text-sm font-medium mb-1">Monto (S/)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max={saldo}
                                            value={paymentData.monto}
                                            onChange={(e) => setPaymentData({ ...paymentData, monto: e.target.value })}
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 font-bold text-right"
                                            placeholder="0.00"
                                            disabled={isSubmitting}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddPaymentToBatch();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleFillBalance}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded disabled:bg-blue-300 whitespace-nowrap"
                                            title="Completar saldo restante"
                                            disabled={isSubmitting}
                                        >
                                            <FaWallet />
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <button
                                        type="button"
                                        onClick={handleAddPaymentToBatch}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center disabled:bg-indigo-300 h-[42px]"
                                        disabled={isSubmitting || !paymentData.monto}
                                        title="Agregar a la lista"
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                            </div>

                            {paymentData.metodoPago === 'Otro' && (
                                <div className="mt-3">
                                    <label className="block text-sm font-medium mb-1">Especifique Método</label>
                                    <input
                                        type="text"
                                        value={paymentData.otroMetodo}
                                        onChange={(e) => setPaymentData({ ...paymentData, otroMetodo: e.target.value })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="Detalle el método..."
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <h4 className="text-xs font-bold mb-2 uppercase text-gray-500 tracking-wider">Pagos a Registrar en esta Transacción</h4>
                            {paymentBatch.length > 0 ? (
                                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-100 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Método</th>
                                                <th className="px-4 py-2 text-right">Monto</th>
                                                <th className="px-4 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                                            {paymentBatch.map((p) => (
                                                <tr key={p.id}>
                                                    <td className="px-4 py-3 font-medium">{p.formaPago}</td>
                                                    <td className="px-4 py-3 text-right">S/ {p.monto.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleRemovePaymentFromBatch(p.id)}
                                                            className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 p-1 rounded transition-colors"
                                                            disabled={isSubmitting}
                                                            title="Quitar"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold border-t-2 border-gray-200 dark:border-gray-600">
                                                <td className="px-4 py-2 text-right">TOTAL A REGISTRAR:</td>
                                                <td className="px-4 py-2 text-right text-blue-600 text-base">
                                                    S/ {paymentBatch.reduce((acc, curr) => acc + curr.monto, 0).toFixed(2)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                                    No hay pagos en la lista. Agregue un pago arriba.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8 border-t pt-5 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-300"
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handlePaymentSubmit}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded disabled:bg-green-300 shadow-sm"
                                disabled={isSubmitting || paymentBatch.length === 0}
                            >
                                {isSubmitting ? 'Registrando...' : 'Registrar Pagos'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Modal>
    );
}

export default CostosModal;
