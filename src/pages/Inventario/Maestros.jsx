import React, { useState, useEffect } from 'react';
import { getCustomFields, addCustomField, updateCustomField, deleteCustomField } from '../../services/inventoryService';
import { FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

function ConfirmationModal({ title, message, onConfirm, onCancel }) {
    return (
        <Modal onClose={onCancel} maxWidth="max-w-md">
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{title}</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300">{message}</p>
                <div className="flex justify-end space-x-2">
                    <button onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Confirmar</button>
                </div>
            </div>
        </Modal>
    )
}

function Maestros() {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentField, setCurrentField] = useState(initialFieldState());

    // For handling options of type 'select'
    const [newOption, setNewOption] = useState('');

    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    function initialFieldState() {
        return {
            nombre: '',
            tipo: 'input', // 'input' o 'select'
            esFiltro: false,
            opciones: []
        };
    }

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getCustomFields();
            setFields(data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar los campos maestros');
        } finally {
            setLoading(false);
        }
    };

    const handleAddOption = () => {
        if (!newOption.trim()) return;
        if (currentField.opciones.includes(newOption.trim())) {
            toast.error('La opción ya existe');
            return;
        }
        setCurrentField({
            ...currentField,
            opciones: [...currentField.opciones, newOption.trim()]
        });
        setNewOption('');
    };

    const handleRemoveOption = (optToRemove) => {
        setCurrentField({
            ...currentField,
            opciones: currentField.opciones.filter(opt => opt !== optToRemove)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentField.nombre) {
            return toast.error('El nombre es obligatorio');
        }
        if (currentField.tipo === 'select' && currentField.opciones.length === 0) {
            return toast.error('Debe agregar al menos una opción para el tipo Selección');
        }

        setIsSaving(true);
        try {
            if (isEditing) {
                await updateCustomField(currentField.id, {
                    nombre: currentField.nombre,
                    tipo: currentField.tipo,
                    esFiltro: currentField.esFiltro,
                    opciones: currentField.tipo === 'select' ? currentField.opciones : []
                });
                toast.success('Campo maestro actualizado');
            } else {
                await addCustomField({
                    nombre: currentField.nombre,
                    tipo: currentField.tipo,
                    esFiltro: currentField.esFiltro,
                    opciones: currentField.tipo === 'select' ? currentField.opciones : []
                });
                toast.success('Campo maestro creado');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar el campo maestro');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (field) => {
        setCurrentField(field);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDeleteRequest = (field) => {
        setConfirmation({
            isOpen: true,
            title: 'Eliminar Campo Maestro',
            message: `¿Estás seguro de eliminar el campo "${field.nombre}"? Esto no afectará la información ya guardada, pero ya no aparecerá en el formulario.`,
            onConfirm: () => handleDelete(field.id),
        });
    };

    const handleDelete = async (id) => {
        try {
            await deleteCustomField(id);
            toast.success('Eliminado correctamente');
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar');
        }
        setConfirmation({ isOpen: false });
    };

    const openNew = () => {
        setCurrentField(initialFieldState());
        setIsEditing(false);
        setNewOption('');
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Maestro de Maestros (Campos Dinámicos)</h1>
                <button
                    onClick={openNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    <FaPlus /> Añadir Campo
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Es Filtro</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="4" className="p-4 text-center">Cargando...</td></tr>
                        ) : fields.length === 0 ? (
                            <tr><td colSpan="4" className="p-4 text-center">No hay campos maestros registrados.</td></tr>
                        ) : (
                            fields.map((f) => (
                                <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">{f.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {f.tipo === 'select' ? 'Selección (Múltiples opciones)' : 'Campo de Texto'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {f.esFiltro ? <span className="text-green-600 font-bold">Sí</span> : <span className="text-gray-400">No</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(f)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-4"><FaEdit /></button>
                                        <button onClick={() => handleDeleteRequest(f)} className="text-red-600 hover:text-red-900 dark:text-red-400"><FaTrash /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal onClose={() => !isSaving && setIsModalOpen(false)}>
                    <div className="p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                            {isEditing ? 'Editar Campo Maestro' : 'Nuevo Campo Maestro'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre del Campo</label>
                                <input
                                    type="text"
                                    required
                                    value={currentField.nombre}
                                    onChange={(e) => setCurrentField({ ...currentField, nombre: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ej. Color, Procesador, Generación..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo de Campo</label>
                                <select
                                    value={currentField.tipo}
                                    onChange={(e) => setCurrentField({ ...currentField, tipo: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="input">Campo de Texto Libre</option>
                                    <option value="select">Selección de Opciones</option>
                                </select>
                            </div>

                            {currentField.tipo === 'select' && (
                                <div className="border p-4 rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                                    <label className="block text-sm font-medium mb-2">Opciones de Selección</label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={newOption}
                                            onChange={(e) => setNewOption(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                                            className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Nueva opción..."
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddOption}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {currentField.opciones.map((opt, idx) => (
                                            <div key={idx} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full flex items-center gap-2">
                                                <span className="text-sm">{opt}</span>
                                                <button type="button" onClick={() => handleRemoveOption(opt)} className="text-red-500 hover:text-red-700">
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                        {currentField.opciones.length === 0 && (
                                            <p className="text-sm text-gray-500 italic">No hay opciones agregadas.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentField.esFiltro}
                                        onChange={(e) => setCurrentField({ ...currentField, esFiltro: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium">Usar este campo como filtro en el inventario principal</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSaving}
                                    className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            {confirmation.isOpen && (
                <ConfirmationModal
                    title={confirmation.title}
                    message={confirmation.message}
                    onConfirm={confirmation.onConfirm}
                    onCancel={() => setConfirmation({ isOpen: false })}
                />
            )}
        </div>
    );
}

export default Maestros;
