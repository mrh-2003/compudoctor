import React from 'react';

const PRINT_ORDER_MAP = [
    { num: 1, id: "procesador", label: "Procesador" },
    { num: 2, id: "placaMadre", label: "Placa Madre" },
    { num: 3, id: "memoriaRam", label: "Memoria RAM" },
    { num: 4, id: "hdd", label: "HDD" },
    { num: 5, id: "ssd", label: "SSD" },
    { num: 6, id: "m2Nvme", label: "M.2 Nvme" },
    { num: 7, id: "tarjetaVideo", label: "Tarj. de video" },
    { num: 8, id: "wifi", label: "WI-FI" },
    { num: 9, id: "bateria", label: "Batería" },
    { num: 10, id: "cargador", label: "Cargador" },
    { num: 11, id: "pantalla", label: "Pantalla" },
    { num: 12, id: "teclado", label: "Teclado" },
    { num: 13, id: "camara", label: "Cámara" },
    { num: 14, id: "microfono", label: "Micrófono" },
    { num: 15, id: "parlantes", label: "Parlantes" },
    { num: 16, id: "auriculares", label: "Auriculares" },
    { num: 17, id: "rj45", label: "RJ 45" },
    { num: 18, id: "hdmi", label: "HDMI" },
    { num: 19, id: "vga", label: "VGA" },
    { num: 20, id: "usb", label: "USB" },
    { num: 21, id: "tipoC", label: "Tipo C" },
    { num: 22, id: "lectora", label: "Lectora" },
    { num: 23, id: "touchpad", label: "Touchpad" },
    { num: 24, id: "bandejas", label: "Bandejas" },
    { num: 25, id: "cables", label: "Cables" },
    { num: 26, id: "rodillos", label: "Rodillos" },
    { num: 27, id: "cabezal", label: "Cabezal de impresión" },
    { num: 28, id: "tinta", label: "Tinta / Cartucho" },
    { num: 29, id: "otros", label: "Otros" },
];

const ReadOnlyReportHeader = React.memo(({ report, diagnostico, montoServicio, total, saldo, componentItems }) => {
    const readOnlyInputProps = {
        readOnly: true,
        className: "w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none",
    };

    const componentItemsMap = componentItems.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
    }, {});

    const getCheckItemData = (id) => {
        const item = componentItemsMap[id];
        const isChecked = item?.checked || false;
        let detailText = (item?.detalles && item.detalles.trim() !== '') ? item.detalles : '';
        return { isChecked, detailText };
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 space-y-6">
            <h2 className="text-xl font-semibold text-blue-500 border-b pb-3 dark:border-gray-700">Datos del Cliente y Equipo (Recepción)</h2>

            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900">
                <p className="font-bold text-lg text-purple-500 dark:text-purple-400">INFORMACIÓN DEL CLIENTE</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="col-span-full">
                        <label className="block text-sm font-medium mb-1">Cliente:</label>
                        <input type="text" value={report.clientName || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Teléfono:</label>
                        <input type="text" value={report.telefono || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha/Hora Ingreso:</label>
                        <input type="text" value={`${report.fecha} ${report.hora}`} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Estado Actual:</label>
                        <input type="text" value={report.estado || 'N/A'} {...readOnlyInputProps} className={`${readOnlyInputProps.className} font-bold ${report.estado === 'ENTREGADO' ? 'text-green-500' : report.estado === 'TERMINADO' ? 'text-orange-500' : 'text-red-500'}`} />
                    </div>
                </div>
            </div>

            {report.estado === 'ENTREGADO' && (
                <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">INFORMACIÓN DE ENTREGA</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Fecha Entrega:</label>
                            <input type="text" value={report.fechaEntrega || 'N/A'} {...readOnlyInputProps} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Hora Entrega:</label>
                            <input type="text" value={report.horaEntrega || 'N/A'} {...readOnlyInputProps} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Entregado Por:</label>
                            <input type="text" value={report.tecnicoEntrega || 'N/A'} {...readOnlyInputProps} />
                        </div>
                        {report.observacionEntrega && (
                            <div className="col-span-full">
                                <label className="block text-sm font-medium mb-1">Observación de Entrega:</label>
                                <textarea value={report.observacionEntrega} {...readOnlyInputProps} rows="2"></textarea>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900">
                <p className="font-bold text-lg text-green-500 dark:text-green-400">INFORMACIÓN DEL EQUIPO</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">¿Enciende?:</label>
                        <input type="text" value={report.canTurnOn || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Equipo:</label>
                        <input type="text" value={report.tipoEquipo || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Marca:</label>
                        <input type="text" value={report.marca || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Modelo:</label>
                        <input type="text" value={report.modelo || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Serie:</label>
                        <input type="text" value={report.serie || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Sistema Operativo:</label>
                        <input type="text" value={report.sistemaOperativo || 'N/A'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Clave Bitlocker:</label>
                        <input type="text" value={report.bitlockerKey ? 'Sí' : 'No'} {...readOnlyInputProps} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Ubicación Física:</label>
                        <input type="text" value={report.ubicacionFisica || 'N/A'} {...readOnlyInputProps} />
                    </div>
                </div>
            </div>

            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900">
                <p className="font-bold text-lg text-cyan-500 dark:text-cyan-400">COMPONENTES Y ACCESORIOS REGISTRADOS</p>
                <div className="columns-1 md:columns-2 lg:columns-3 gap-4 text-sm">
                    {PRINT_ORDER_MAP.map(item => {
                        const { isChecked, detailText } = getCheckItemData(item.id);

                        return (
                            <div key={item.id} className="flex items-center space-x-2 break-inside-avoid mb-2">
                                <div className="flex items-center w-40 flex-shrink-0">
                                    <span className="text-gray-500 text-xs mr-2 font-mono w-4 text-right">{item.num}.</span>
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        readOnly
                                        className="h-4 w-4 mr-2 accent-green-600 pointer-events-none"
                                        style={{ opacity: 1, filter: 'none', accentColor: isChecked ? '#10B981' : '#D1D5DB' }}
                                    />
                                    <label className="font-semibold text-gray-700 dark:text-gray-300 truncate text-sm">
                                        {item.label}:
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    value={detailText || ''}
                                    {...readOnlyInputProps}
                                    className={`${readOnlyInputProps.className} flex-1 truncate text-xs py-1 ${!detailText ? 'text-gray-400 italic' : ''}`}
                                    placeholder=""
                                />
                            </div>
                        );
                    })}
                    {componentItems.length === 0 && (
                        <p className="text-gray-500 col-span-full">No se registraron componentes específicos.</p>
                    )}
                </div>
            </div>

            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900">
                <p className="font-bold text-lg text-orange-500 dark:text-orange-400">DETALLES DE RECEPCIÓN</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-full">
                        <label className="block text-sm font-medium mb-1">Motivo de Ingreso (Servicios):</label>
                        <textarea value={report.motivoIngreso || ''} {...readOnlyInputProps} rows="2"></textarea>
                    </div>
                    <div className="col-span-full">
                        <label className="block text-sm font-medium mb-1">Observaciones de Recepción:</label>
                        <textarea value={report.observaciones || ''} {...readOnlyInputProps} rows="2"></textarea>
                    </div>
                    <div className="col-span-full">
                        <label className="block text-sm font-medium mb-1">Detalles de Pago (Recepción):</label>
                        <input type="text" value={report.detallesPago || ''} {...readOnlyInputProps} />
                    </div>
                </div>
            </div>

            <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-900">
                <p className="font-bold text-lg text-pink-500 dark:text-pink-400">RESUMEN FINANCIERO (BASE)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="hidden lg:block">
                        <label className="block text-sm font-medium mb-1">Costo Diagnóstico (S/)</label>
                        <input type="text" value={diagnostico.toFixed(2)} {...readOnlyInputProps} />
                    </div>
                    {(total - montoServicio - diagnostico) > 0 && (
                        <div className="hidden lg:block">
                            <label className="block text-sm font-medium mb-1">Servicios Adicionales (S/)</label>
                            <input type="text" value={(total - montoServicio - diagnostico).toFixed(2)} {...readOnlyInputProps} />
                        </div>
                    )}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium mb-1">A Cuenta (S/)</label>
                        <input type="text" value={(parseFloat(report.aCuenta) || 0).toFixed(2)} {...readOnlyInputProps} />
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium mb-1">Saldo (S/)</label>
                        <input type="text" value={saldo.toFixed(2)} {...readOnlyInputProps} className={`${readOnlyInputProps.className} font-bold ${saldo > 0 ? 'text-red-500' : 'text-green-500'}`} />
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ReadOnlyReportHeader;
