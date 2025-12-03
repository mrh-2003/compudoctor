import React from 'react';

const ReadOnlyAreaHistory = ({ entry, areaName }) => {
    const readOnlyInputProps = {
        readOnly: true,
        disabled: true,
        className: "p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
    };

    const readOnlyCheckboxProps = {
        disabled: true,
        className: "h-4 w-4 mr-2 cursor-not-allowed"
    };

    const readOnlyRadioProps = {
        disabled: true,
        className: "h-4 w-4 mr-1 cursor-not-allowed"
    };

    const commonFieldsReadOnly = (
        <div className="border p-4 rounded-md dark:border-gray-700 space-y-4 bg-gray-50 dark:bg-gray-800">
            <p className="font-bold text-lg text-blue-500 dark:text-blue-400">SERVICIO REALIZADO</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Técnico:</label>
                    <input type="text" value={entry.tecnico || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Ubicación Física:</label>
                    <input type="text" value={entry.ubicacionFisica || 'N/A'} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Fecha Inicio:</label>
                    <input type="text" value={entry.fecha_inicio || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">H. Inicio:</label>
                    <input type="text" value={entry.hora_inicio || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Fecha Fin:</label>
                    <input type="text" value={entry.fecha_fin || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">H. Fin:</label>
                    <input type="text" value={entry.hora_fin || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} />
                </div>
            </div>
            {entry.tec_apoyo && (
                <div>
                    <label className="block text-sm font-medium mb-1">Técnico de Apoyo:</label>
                    <input type="text" value={entry.tec_apoyo} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} />
                </div>
            )}
            {entry.reparacion && (
                <div>
                    <label className="block text-sm font-medium mb-1">Descripción del Trabajo:</label>
                    <textarea value={entry.reparacion} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} rows="3"></textarea>
                </div>
            )}
        </div>
    );

    const renderAreaContent = () => {
        switch (areaName) {
            case 'HARDWARE':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-red-500">ÁREA DE HARDWARE</h2>
                        {commonFieldsReadOnly}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <label className="flex items-center"><input type="checkbox" checked={entry.mant_hardware || false} {...readOnlyCheckboxProps} />Mant. de Hardware</label>
                            <label className="flex items-center"><input type="checkbox" checked={entry.reconstruccion || false} {...readOnlyCheckboxProps} />Reconstrucción</label>
                            <label className="flex items-center"><input type="checkbox" checked={entry.adapt_parlantes || false} {...readOnlyCheckboxProps} />Adapt. de Parlantes</label>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" checked={entry.cambio_teclado || false} {...readOnlyCheckboxProps} />Cambio de Teclado:</label>
                                <input type="text" value={entry.cambio_teclado_codigo || ''} {...readOnlyInputProps} placeholder="Código" className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" checked={entry.cambio_pantalla || false} {...readOnlyCheckboxProps} />Cambio de Pantalla:</label>
                                <input type="text" value={entry.cambio_pantalla_codigo || ''} {...readOnlyInputProps} placeholder="Código" className={`${readOnlyInputProps.className} flex-1`} />
                                <input type="text" value={entry.cambio_pantalla_resolucion || ''} {...readOnlyInputProps} placeholder="Resolución" className={`${readOnlyInputProps.className} flex-1`} />
                                <input type="text" value={entry.cambio_pantalla_hz || ''} {...readOnlyInputProps} placeholder="Hz" className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" checked={entry.cambio_carcasa || false} {...readOnlyCheckboxProps} />Cambio de Carcasa:</label>
                                <input type="text" value={entry.cambio_carcasa_obs || ''} {...readOnlyInputProps} placeholder="Obs." className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" checked={entry.cambio_placa || false} {...readOnlyCheckboxProps} />Cambio de Placa:</label>
                                <input type="text" value={entry.cambio_placa_codigo || ''} {...readOnlyInputProps} placeholder="Código" className={`${readOnlyInputProps.className} flex-1`} />
                                <input type="text" value={entry.cambio_placa_especif || ''} {...readOnlyInputProps} placeholder="Especif." className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" checked={entry.cambio_fuente || false} {...readOnlyCheckboxProps} />Cambio de Fuente:</label>
                                <input type="text" value={entry.cambio_fuente_codigo || ''} {...readOnlyInputProps} placeholder="Código" className={`${readOnlyInputProps.className} flex-1`} />
                                <input type="text" value={entry.cambio_fuente_especif || ''} {...readOnlyInputProps} placeholder="Especif." className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" checked={entry.cambio_video || false} {...readOnlyCheckboxProps} />Cambio de Tarj. Video:</label>
                                <input type="text" value={entry.cambio_video_codigo || ''} {...readOnlyInputProps} placeholder="Código" className={`${readOnlyInputProps.className} flex-1`} />
                                <input type="text" value={entry.cambio_video_especif || ''} {...readOnlyInputProps} placeholder="Especif." className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-48"><input type="checkbox" checked={entry.otros || false} {...readOnlyCheckboxProps} />Otros:</label>
                                <input type="text" value={entry.otros_especif || ''} {...readOnlyInputProps} placeholder="Especificar" className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <p className="font-semibold mb-3">Repotenciación:</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" checked={entry.repoten_ssd || false} {...readOnlyCheckboxProps} />SSD</label>
                                <input type="text" value={entry.repoten_ssd_gb || ''} {...readOnlyInputProps} placeholder="GB" className={`${readOnlyInputProps.className} w-24`} />
                                <input type="text" value={entry.repoten_ssd_serie || ''} {...readOnlyInputProps} placeholder="Serie" className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" checked={entry.repoten_nvme || false} {...readOnlyCheckboxProps} />NVME</label>
                                <input type="text" value={entry.repoten_nvme_gb || ''} {...readOnlyInputProps} placeholder="GB" className={`${readOnlyInputProps.className} w-24`} />
                                <input type="text" value={entry.repoten_nvme_serie || ''} {...readOnlyInputProps} placeholder="Serie" className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" checked={entry.repoten_m2 || false} {...readOnlyCheckboxProps} />M2 SATA</label>
                                <input type="text" value={entry.repoten_m2_gb || ''} {...readOnlyInputProps} placeholder="GB" className={`${readOnlyInputProps.className} w-24`} />
                                <input type="text" value={entry.repoten_m2_serie || ''} {...readOnlyInputProps} placeholder="Serie" className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" checked={entry.repoten_hdd || false} {...readOnlyCheckboxProps} />HDD</label>
                                <input type="text" value={entry.repoten_hdd_gb || ''} {...readOnlyInputProps} placeholder="GB" className={`${readOnlyInputProps.className} w-24`} />
                                <input type="text" value={entry.repoten_hdd_serie || ''} {...readOnlyInputProps} placeholder="Serie" className={`${readOnlyInputProps.className} flex-1`} />
                                <input type="text" value={entry.repoten_hdd_codigo || ''} {...readOnlyInputProps} placeholder="Código" className={`${readOnlyInputProps.className} w-24`} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="flex items-center w-36"><input type="checkbox" checked={entry.repoten_ram || false} {...readOnlyCheckboxProps} />MEMORIA RAM</label>
                                <input type="text" value={entry.repoten_ram_cap || ''} {...readOnlyInputProps} placeholder="Capacidad" className={`${readOnlyInputProps.className} flex-1`} />
                                <input type="text" value={entry.repoten_ram_cod || ''} {...readOnlyInputProps} placeholder="Cód." className={`${readOnlyInputProps.className} flex-1`} />
                            </div>
                        </div>
                    </div>
                );
            case 'SOFTWARE':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-blue-500">ÁREA DE SOFTWARE</h2>
                        {commonFieldsReadOnly}
                        <div className="space-y-3 border p-4 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" checked={entry.backup || false} {...readOnlyCheckboxProps} />Backup de Información:</label><input type="text" value={entry.backup_obs || ''} {...readOnlyInputProps} placeholder="Obs." className={`${readOnlyInputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" checked={entry.clonacion || false} {...readOnlyCheckboxProps} />Clonación de Disco:</label><input type="text" value={entry.clonacion_obs || ''} {...readOnlyInputProps} placeholder="Obs." className={`${readOnlyInputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" checked={entry.formateo || false} {...readOnlyCheckboxProps} />Formateo + Programas:</label><input type="text" value={entry.formateo_obs || ''} {...readOnlyInputProps} placeholder="Obs." className={`${readOnlyInputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" checked={entry.drivers || false} {...readOnlyCheckboxProps} />Instalación de Drivers:</label><input type="text" value={entry.drivers_obs || ''} {...readOnlyInputProps} placeholder="Obs." className={`${readOnlyInputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" checked={entry.act_win || false} {...readOnlyCheckboxProps} />Activación de Windows:</label><input type="text" value={entry.act_win_obs || ''} {...readOnlyInputProps} placeholder="Obs." className={`${readOnlyInputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" checked={entry.act_office || false} {...readOnlyCheckboxProps} />Activación de Office:</label><input type="text" value={entry.act_office_obs || ''} {...readOnlyInputProps} placeholder="Obs." className={`${readOnlyInputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" checked={entry.optimizacion || false} {...readOnlyCheckboxProps} />Optimización de sistema:</label><input type="text" value={entry.optimizacion_obs || ''} {...readOnlyInputProps} placeholder="Obs." className={`${readOnlyInputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" checked={entry.sw_otros || false} {...readOnlyCheckboxProps} />Otros:</label><input type="text" value={entry.sw_otros_spec || ''} {...readOnlyInputProps} placeholder="Especif." className={`${readOnlyInputProps.className} flex-1`} /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" checked={entry.diseno || false} {...readOnlyCheckboxProps} />Inst. de Prog. de Diseño:</label><input type="text" value={entry.diseno_spec || ''} {...readOnlyInputProps} placeholder="Especif." className={`${readOnlyInputProps.className} flex-1`} /></div>
                                <div className="flex items-center gap-2"><label className="flex items-center w-48"><input type="checkbox" checked={entry.ingenieria || false} {...readOnlyCheckboxProps} />Inst. de Prog. de Ing.:</label><input type="text" value={entry.ingenieria_spec || ''} {...readOnlyInputProps} placeholder="Especif." className={`${readOnlyInputProps.className} flex-1`} /></div>
                            </div>
                        </div>
                    </div>
                );
            case 'ELECTRONICA':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-yellow-500">ÁREA DE ELECTRÓNICA</h2>
                        {commonFieldsReadOnly}
                        <div className="space-y-4 border p-4 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            {/* TARJ. VIDEO */}
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input type="checkbox" checked={entry.elec_video || false} {...readOnlyCheckboxProps} />
                                    TARJ. VIDEO
                                </label>
                                {entry.elec_video && (
                                    <div className="ml-6 flex items-center gap-4">
                                        <span className="text-sm font-medium">Reparable:</span>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.elec_video_reparable === 'SI'} {...readOnlyRadioProps} />
                                            SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.elec_video_reparable === 'NO'} {...readOnlyRadioProps} />
                                            NO
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* PLACA */}
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input type="checkbox" checked={entry.elec_placa || false} {...readOnlyCheckboxProps} />
                                    PLACA
                                </label>
                                {entry.elec_placa && (
                                    <div className="ml-6 flex items-center gap-4">
                                        <span className="text-sm font-medium">Reparable:</span>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.elec_placa_reparable === 'SI'} {...readOnlyRadioProps} />
                                            SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.elec_placa_reparable === 'NO'} {...readOnlyRadioProps} />
                                            NO
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* OTRO */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={entry.elec_otro || false} {...readOnlyCheckboxProps} />
                                        OTRO
                                    </label>
                                    {entry.elec_otro && (
                                        <input type="text" value={entry.elec_otro_especif || ''} {...readOnlyInputProps} placeholder="Especificar..." className={`${readOnlyInputProps.className} flex-1`} />
                                    )}
                                </div>
                                {entry.elec_otro && (
                                    <div className="ml-6 flex items-center gap-4">
                                        <span className="text-sm font-medium">Reparable:</span>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.elec_otro_reparable === 'SI'} {...readOnlyRadioProps} />
                                            SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.elec_otro_reparable === 'NO'} {...readOnlyRadioProps} />
                                            NO
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2 border p-4 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <textarea value={entry.elec_codigo || ''} {...readOnlyInputProps} placeholder="Código" className={`${readOnlyInputProps.className} w-full`} rows="2"></textarea>
                            <textarea value={entry.elec_etapa || ''} {...readOnlyInputProps} placeholder="Etapa" className={`${readOnlyInputProps.className} w-full`} rows="2"></textarea>
                            <textarea value={entry.elec_obs || ''} {...readOnlyInputProps} placeholder="Obs" className={`${readOnlyInputProps.className} w-full`} rows="3"></textarea>
                        </div>
                    </div>
                );
            case 'TESTEO':
                return (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-purple-500">ÁREA DE TESTEO</h2>
                        {commonFieldsReadOnly}
                        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 p-3 rounded-md text-sm">
                            <p className="font-semibold mb-1">Instrucciones:</p>
                            <p>Marcar en orden si <strong>FUNCIONA</strong> o <strong>NO FUNCIONA</strong> el periférico testeado.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="space-y-3">
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Procesador:</label>
                                    <input type="text" value={entry.testeo_procesador || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} />
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Video Dedicado:</label>
                                    <input type="text" value={entry.testeo_video_dedicado || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} />
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Memoria Ram:</label>
                                    <input type="text" value={entry.testeo_memoria_ram || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} />
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Disco:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_disco === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_disco === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_disco_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Pantalla:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_pantalla === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_pantalla === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_pantalla_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Batería:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_bateria === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_bateria === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_bateria_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Cargador:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_cargador === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_cargador === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_cargador_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Cámara:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_camara === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_camara === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_camara_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Micrófono:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_microfono === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_microfono === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_microfono_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Auricular:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_auricular === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_auricular === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_auricular_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Parlantes:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_parlantes === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_parlantes === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_parlantes_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Teclado:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_teclado === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_teclado === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_teclado_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Lectora:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_lectora === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_lectora === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_lectora_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Touchpad:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_touchpad === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_touchpad === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_touchpad_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">WiFi:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_wifi === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_wifi === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_wifi_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">RJ45:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_rj45 === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_rj45 === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_rj45_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">USB:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_usb === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_usb === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_usb_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Tipo C:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_tipo_c === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_tipo_c === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_tipo_c_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">HDMI:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_hdmi === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_hdmi === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_hdmi_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">VGA:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_vga === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_vga === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_vga_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-center">
                                    <label className="text-sm font-medium">Otros Testeo:</label>
                                    <div className="flex items-center gap-3 w-full">
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_otros === 'SI'} {...readOnlyRadioProps} />SI
                                        </label>
                                        <label className="flex items-center text-sm">
                                            <input type="radio" checked={entry.testeo_otros === 'NO'} {...readOnlyRadioProps} />NO
                                        </label>
                                        <input type="text" value={entry.testeo_otros_obs || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} flex-1`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="border-t pt-4 dark:border-gray-700">
                            <h3 className="font-bold text-lg mb-3">SERVICIO REALIZADO FINAL</h3>
                            <textarea value={entry.testeo_servicio_final || ''} {...readOnlyInputProps} className={`${readOnlyInputProps.className} w-full`} rows="4"></textarea>
                        </div>
                    </div>
                );
            default:
                return <p>Área no configurada.</p>;
        }
    };

    return (
        <div className="border p-4 rounded-md mt-4 bg-white dark:bg-gray-800 dark:border-gray-600 shadow-md">
            {renderAreaContent()}
        </div>
    );
};

export default ReadOnlyAreaHistory;
