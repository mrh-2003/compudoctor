import { useState } from 'react';
import Modal from '../common/Modal';
import { addPayment, markReportAsPaid, updateDiagnosticReport } from '../../services/diagnosticService';
import toast from 'react-hot-toast';
import { FaMoneyBillWave, FaWallet } from 'react-icons/fa';

function CostosModal({ report, onClose, onUpdate }) {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentData, setPaymentData] = useState({
        monto: '',
        metodoPago: 'Yape',
        otroMetodo: ''
    });

    const [includeIgv, setIncludeIgv] = useState(report.includeIgv || false);

    const servicesList = report.servicesList || [];
    const additionalServices = report.additionalServices || [];

    const totalPrincipal = servicesList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalAdicional = additionalServices.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const diagnosticoCost = parseFloat(report.diagnostico) || 0;

    // Calculate totals based on IGV
    const subTotal = totalPrincipal + totalAdicional; // Base without diagnostic
    const totalWithIgv = includeIgv ? (subTotal * 1.18) : subTotal; 
    const totalGeneral = totalWithIgv;

    const pagosRealizados = report.pagosRealizado || [];
    const totalPagado = pagosRealizados.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0); 
    const saldo = totalGeneral - totalPagado;

    const handleToggleIgv = async () => {
        const newValue = !includeIgv;
        setIncludeIgv(newValue);
        // Persist immediately
        try {
            await updateDiagnosticReport(report.id, { includeIgv: newValue }); 
            const newTotalDB = newValue
                ? (totalPrincipal + totalAdicional + diagnosticoCost) * 1.18
                : (totalPrincipal + totalAdicional + diagnosticoCost);

            await updateDiagnosticReport(report.id, {
                includeIgv: newValue,
                total: newTotalDB,
                saldo: newTotalDB - totalPagado
            });

            if (onUpdate) onUpdate();
            toast.success(`IGV ${newValue ? 'activado' : 'desactivado'} correcamente.`);
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar IGV");
            setIncludeIgv(!newValue); // Revert on error
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

    const handleFillBalance = () => {
        setPaymentData(prev => ({ ...prev, monto: saldo.toFixed(2) }));
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        const monto = parseFloat(paymentData.monto);
        if (!monto || monto <= 0) {
            toast.error('Ingrese un monto válido');
            return;
        }
        if (monto > saldo + 0.1) { // Tolerance for float errors
            toast.error('El monto no puede ser mayor al saldo');
            return;
        }

        const metodo = paymentData.metodoPago === 'Otro' ? paymentData.otroMetodo : paymentData.metodoPago;
        if (!metodo) {
            toast.error('Ingrese un método de pago');
            return;
        }

        const newPayment = {
            fecha: new Date().toISOString(),
            monto: monto,
            formaPago: metodo
        };

        setIsSubmitting(true);
        try {
            if (paymentType === 'DIAGNOSTICO') {
                const success = await markReportAsPaid(report.id, newPayment);
                if (success) {
                    toast.success('Diagnóstico pagado y reporte cerrado');
                    setIsPaymentModalOpen(false);
                    onClose();
                    onUpdate();
                } else {
                    toast.error('Error al registrar el pago del diagnóstico');
                }
            } else {
                const success = await addPayment(report.id, newPayment);
                if (success) {
                    toast.success('Pago registrado correctamente');
                    setIsPaymentModalOpen(false);
                    onUpdate();
                } else {
                    toast.error('Error al registrar el pago');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al registrar el pago');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            <div className="p-6 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <FaWallet className="text-green-600" />
                    Detalle de Costos y Pagos - {report.marca || ''} / {report.modelo || ''}
                </h2>

                {/* Services Table */}
                <div className="mb-6 overflow-x-auto">
                    <h3 className="text-lg font-semibold mb-2">Servicios Solicitados y Adicionales</h3>
                    <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-left">Servicio</th>
                                <th className="px-4 py-2 text-right">Monto</th>
                                <th className="px-4 py-2 text-center">Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {servicesList.map((service, index) => (
                                <tr key={`principal-${index}`} className="border-t border-gray-200 dark:border-gray-700">
                                    <td className="px-4 py-2">{service.service}</td>
                                    <td className="px-4 py-2 text-right">S/ {(parseFloat(service.amount) || 0).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-center"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Principal</span></td>
                                </tr>
                            ))}
                            {additionalServices.map((service, index) => (
                                <tr key={`additional-${index}`} className="border-t border-gray-200 dark:border-gray-700">
                                    <td className="px-4 py-2">{service.description}</td>
                                    <td className="px-4 py-2 text-right">S/ {(parseFloat(service.amount) || 0).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-center"><span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Adicional</span></td>
                                </tr>
                            ))}
                            {diagnosticoCost > 0 && (
                                <tr className="border-t border-gray-200 dark:border-gray-700">
                                    <td className="px-4 py-2">Diagnóstico</td>
                                    <td className="px-4 py-2 text-right">S/ {diagnosticoCost.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-center"><span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Diagnóstico</span></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Financial Report */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center border-b pb-2 mb-2 dark:border-gray-600">
                            <span className="font-bold">Aplicar IGV (18%)</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={includeIgv} onChange={handleToggleIgv} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Total Servicios Principales:</span>
                            <span>S/ {totalPrincipal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Total Servicios Adicionales:</span>
                            <span>S/ {totalAdicional.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Diagnóstico:</span>
                            <span>S/ {diagnosticoCost.toFixed(2)}</span>
                        </div>
                        {includeIgv && (
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>IGV (18%):</span>
                                <span>S/ {(subTotal * 0.18).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between font-bold text-lg">
                            <span>Total General {includeIgv ? '(Inc. IGV)' : ''}:</span>
                            <span>S/ {totalGeneral.toFixed(2)}</span>
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

                        {!report.isPaid && diagnosticoCost > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                                <p className="text-sm text-center mb-2 font-medium">¿Servicio no realizado?</p>
                                <button
                                    onClick={handlePayDiagnostic}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                                >
                                    <FaMoneyBillWave /> Pagar Solo Diagnóstico (S/ {diagnosticoCost.toFixed(2)})
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
                    <div className="p-6 max-w-md mx-auto">
                        <h3 className="text-xl font-bold mb-4">Registrar Nuevo Pago</h3>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Fecha</label>
                                <input
                                    type="text"
                                    value={new Date().toLocaleString()}
                                    disabled
                                    className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Monto</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={saldo}
                                        value={paymentData.monto}
                                        onChange={(e) => setPaymentData({ ...paymentData, monto: e.target.value })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="0.00"
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleFillBalance}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 rounded disabled:bg-blue-300"
                                        title="Completar saldo"
                                        disabled={isSubmitting}
                                    >
                                        <FaWallet />
                                    </button>
                                </div>
                            </div>

                            <div>
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

                            {paymentData.metodoPago === 'Otro' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Especifique</label>
                                    <input
                                        type="text"
                                        value={paymentData.otroMetodo}
                                        onChange={(e) => setPaymentData({ ...paymentData, otroMetodo: e.target.value })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-300"
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-300"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </Modal>
    );
}

export default CostosModal;
