import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDiagnosticReportById, updateDiagnosticReport } from '../services/diagnosticService';
import { FaArrowLeft, FaCheckCircle, FaTrash, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import ReadOnlyAreaHistory from '../components/common/ReadOnlyAreaHistory';
import ReadOnlyReportHeader from '../components/common/ReadOnlyReportHeader';
const DOC_TYPES = [
    'Boleta Fisica',
    'Boleta Electronica',
    'Factura de Venta',
    'Factura Compra',
    'Boleta Compra',
    'Guia Interna Compra'
];

function DetalleHistorial() {
    const { reportId } = useParams();
    const { currentUser } = useAuth();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [observacionEntrega, setObservacionEntrega] = useState('');

    // Estados para documentos de venta/compra
    const [deliveryDocuments, setDeliveryDocuments] = useState([]);
    const [newDoc, setNewDoc] = useState({ type: DOC_TYPES[0], description: '', number: '' });

    useEffect(() => {
        if (reportId) {
            fetchReport();
        }
    }, [reportId]);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const fetchedReport = await getDiagnosticReportById(reportId);
            setReport(fetchedReport);
        } catch (error) {
            toast.error('Error al cargar el historial del informe.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDeliveryModal = () => {
        setDeliveryDocuments([]);
        setNewDoc({ type: DOC_TYPES[0], description: '', number: '' });
        setIsDeliveryModalOpen(true);
    };

    const handleCloseDeliveryModal = () => {
        setIsDeliveryModalOpen(false);
        setObservacionEntrega('');
        setDeliveryDocuments([]);
    };

    const handleAddDocument = () => {
        if (!newDoc.type || !newDoc.description || !newDoc.number) {
            toast.error('Por favor complete todos los campos del documento.');
            return;
        }
        setDeliveryDocuments([...deliveryDocuments, { ...newDoc, id: Date.now() }]);
        setNewDoc({ type: DOC_TYPES[0], description: '', number: '' });
    };

    const handleRemoveDocument = (id) => {
        setDeliveryDocuments(deliveryDocuments.filter(doc => doc.id !== id));
    };

    const handleDeliverEquipment = async (e) => {
        e.preventDefault();
        try {
            const now = new Date();
            const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
            const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            // Validación para Administradores (rol ADMIN)
            if (currentUser?.rol === 'ADMIN' && deliveryDocuments.length === 0) {
                toast.error('Para los administradores es obligatorio registrar al menos un comprobante.');
                return;
            }

            const updatedData = {
                estado: 'ENTREGADO',
                fechaEntrega: formattedDate,
                horaEntrega: formattedTime,
                tecnicoEntrega: currentUser?.nombre || 'N/A',
                observacionEntrega: observacionEntrega || '',
                documentosVentaCompra: deliveryDocuments
            };

            if (currentUser?.uid) {
                updatedData.tecnicoEntregaId = currentUser.uid;
            }

            await updateDiagnosticReport(reportId, updatedData);
            toast.success('Equipo marcado como entregado exitosamente.');
            handleCloseDeliveryModal();
            fetchReport();
        } catch (error) {
            toast.error('Error al marcar el equipo como entregado.');
            console.error(error);
        }
    };

    const flatHistory = useMemo(() => {
        if (!report) return [];
        return report.diagnosticoPorArea
            ? Object.entries(report.diagnosticoPorArea)
                .flatMap(([areaName, entries]) =>
                    (Array.isArray(entries) ? entries : [entries]).map(entry => ({ ...entry, areaName }))
                )
                .filter(entry => entry.estado === 'TERMINADO')
                .sort((a, b) => {
                    const dateA = new Date(`${a.fecha_fin.split('-').reverse().join('-')}T${a.hora_fin}`);
                    const dateB = new Date(`${b.fecha_fin.split('-').reverse().join('-')}T${b.hora_fin}`);
                    return dateB - dateA;
                })
            : [];
    }, [report]);

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (isLoading) return <div className="text-center p-8">Cargando historial...</div>;
    if (!report) return <div className="text-center p-8 text-red-500">Informe no encontrado.</div>;

    // La acción de entrega solo está disponible si el estado es TERMINADO y no ENTREGADO
    const canDeliver = report.estado === 'TERMINADO';

    const diagnostico = parseFloat(report.diagnostico) || 0;
    const montoServicio = parseFloat(report.montoServicio) || 0;
    const total = parseFloat(report.total) || 0;
    const saldo = parseFloat(report.saldo) || 0;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Link to="/ver-estado" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mr-4" title="Volver a Ver Estado">
                        <FaArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold">Diagnóstico Completo N° {report.reportNumber}</h1>
                </div>
                {canDeliver && currentUser && (currentUser.rol === 'ADMIN' || currentUser.rol === 'SUPERADMIN' || currentUser.rol === 'SUPERUSER') && (
                    <button
                        onClick={handleOpenDeliveryModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                    >
                        <FaCheckCircle className="mr-2" /> Marcar como Entregado
                    </button>
                )}
            </div>

            <ReadOnlyReportHeader
                report={report}
                diagnostico={diagnostico}
                montoServicio={montoServicio}
                total={total}
                saldo={saldo}
                componentItems={report.items || []}
            />

            {(report.hasAdditionalServices || report.additionalServices?.length > 0) && (
                <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-pink-500 mb-2">Servicios Adicionales</h3>
                    <ul className="list-disc list-inside text-sm">
                        {report.additionalServices.map((service, index) => (
                            <li key={index}>{service.description} (S/ {parseFloat(service.amount).toFixed(2)})</li>
                        ))}
                    </ul>
                </div>
            )}

            {(report.documentosVentaCompra && report.documentosVentaCompra.length > 0) && (
                <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-green-600 mb-3">Comprobantes Registrados</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-2">Tipo</th>
                                    <th className="px-4 py-2">Descripción</th>
                                    <th className="px-4 py-2">N° Comprobante</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {report.documentosVentaCompra.map((doc, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2">{doc.type}</td>
                                        <td className="px-4 py-2">{doc.description}</td>
                                        <td className="px-4 py-2">{doc.number}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 mt-6 rounded-lg shadow-md border dark:border-gray-700">
                <h2 className="text-xl font-semibold text-red-500 mb-3">Historial Completo de Intervenciones</h2>
                {flatHistory.length > 0 ? (
                    <div className="space-y-4">
                        {flatHistory.map((entry, index) => (
                            <ReadOnlyAreaHistory key={index} entry={entry} areaName={entry.areaName} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No hay historial de intervenciones para este informe.</p>
                )}
            </div>

            {isDeliveryModalOpen && (
                <Modal onClose={handleCloseDeliveryModal}>
                    <form onSubmit={handleDeliverEquipment} className="space-y-4 p-4">
                        <h2 className="text-xl font-bold">Marcar Equipo como Entregado</h2>
                        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 p-3 rounded-md text-sm">
                            <p><strong>Informe N°:</strong> {report.reportNumber}</p>
                            <p><strong>Cliente:</strong> {report.clientName}</p>
                            <p><strong>Equipo:</strong> {report.tipoEquipo} - {report.marca} {report.modelo}</p>
                            <p className="font-bold text-red-600 mt-2">¡Advertencia! Esta acción marcará el equipo como **ENTREGADO** y no se podrá modificar.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Observación de Entrega (Opcional)</label>
                            <textarea
                                value={observacionEntrega}
                                onChange={(e) => setObservacionEntrega(e.target.value)}
                                rows="3"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Ingresa alguna observación sobre la entrega..."
                            ></textarea>
                        </div>

                        {/* Sección de Documentos */}
                        <div className="border-t pt-4 dark:border-gray-600">
                            <h3 className="text-sm font-bold mb-2">Comprobantes de Venta/Compra {currentUser?.rol === 'ADMIN' && <span className="text-red-500">*</span>}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                                <select
                                    className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    value={newDoc.type}
                                    onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                                >
                                    {DOC_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <input
                                    type="text"
                                    className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    placeholder="Descripción"
                                    value={newDoc.description}
                                    onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                                />
                                <input
                                    type="text"
                                    className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    placeholder="N° Comprobante"
                                    value={newDoc.number}
                                    onChange={(e) => setNewDoc({ ...newDoc, number: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddDocument}
                                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md flex items-center justify-center"
                                >
                                    <FaPlus />
                                </button>
                            </div>

                            {deliveryDocuments.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-800 border rounded-md max-h-40 overflow-y-auto mt-2">
                                    <table className="min-w-full text-xs text-left">
                                        <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-1">Tipo</th>
                                                <th className="px-2 py-1">Desc.</th>
                                                <th className="px-2 py-1">N°</th>
                                                <th className="px-2 py-1"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                            {deliveryDocuments.map(doc => (
                                                <tr key={doc.id}>
                                                    <td className="px-2 py-1">{doc.type}</td>
                                                    <td className="px-2 py-1">{doc.description}</td>
                                                    <td className="px-2 py-1">{doc.number}</td>
                                                    <td className="px-2 py-1 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveDocument(doc.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-3 rounded-md text-sm">
                            <p className="font-semibold mb-2">Información de Entrega:</p>
                            <ul className="space-y-1">
                                <li><strong>Fecha:</strong> {formattedDate}</li>
                                <li><strong>Hora:</strong> {formattedTime}</li>
                                <li><strong>Técnico:</strong> {currentUser?.nombre || 'N/A'}</li>
                            </ul>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button type="button" onClick={handleCloseDeliveryModal} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Confirmar Entrega</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default DetalleHistorial;