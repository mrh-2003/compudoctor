import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Modal from '../../../components/common/Modal';

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

function WarningModal({ title, message, onClose }) {
    return (
        <Modal onClose={onClose} maxWidth="max-w-md">
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-400">{title}</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300">{message}</p>
                <div className="flex justify-end">
                    <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Entendido</button>
                </div>
            </div>
        </Modal>
    )
}

function MasterCrud({ title, fetchItems, addItem, updateItem, deleteItem }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState({ nombre: '' });
    const [isEditing, setIsEditing] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [warning, setWarning] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await fetchItems();
            setItems(data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = currentItem.nombre.trim();
        if (!name) return toast.error('El nombre es obligatorio');

        // Check for duplicates
        const isDuplicate = items.some(item =>
            item.nombre.toLowerCase() === name.toLowerCase() && item.id !== currentItem.id
        );

        if (isDuplicate) {
            setWarning({
                isOpen: true,
                title: 'Duplicado Detectado',
                message: `El nombre "${name}" ya existe en la lista. Por favor utilice otro nombre.`
            });
            return;
        }

        setIsSaving(true);
        try {
            if (isEditing) {
                await updateItem(currentItem.id, { nombre: name });
                toast.success('Actualizado correctamente');
            } else {
                await addItem({ nombre: name });
                toast.success('Creado correctamente');
            }
            setIsModalOpen(false);
            setCurrentItem({ nombre: '' });
            loadItems();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (item) => {
        setCurrentItem(item);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDeleteRequest = (item) => {
        setConfirmation({
            isOpen: true,
            title: 'Eliminar Registro',
            message: `¿Estás seguro de que quieres eliminar "${item.nombre}"? Esta acción es irreversible.`,
            onConfirm: () => handleDelete(item.id),
        });
    };

    const handleDelete = async (id) => {
        try {
            await deleteItem(id);
            toast.success('Eliminado correctamente');
            loadItems();
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar');
        }
        setConfirmation({ isOpen: false });
    };

    const openNew = () => {
        setCurrentItem({ nombre: '' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
                <button
                    onClick={openNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    <FaPlus /> Nuevo
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="2" className="p-4 text-center">Cargando...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan="2" className="p-4 text-center">No hay registros</td></tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-4"><FaEdit /></button>
                                        <button onClick={() => handleDeleteRequest(item)} className="text-red-600 hover:text-red-900 dark:text-red-400"><FaTrash /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal onClose={() => !isSaving && setIsModalOpen(false)} maxWidth="max-w-md">
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                            {isEditing ? 'Editar' : 'Nuevo'} Registro
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={currentItem.nombre}
                                    onChange={(e) => setCurrentItem({ ...currentItem, nombre: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    autoFocus
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
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
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded flex items-center gap-2"
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

            {warning.isOpen && (
                <WarningModal
                    title={warning.title}
                    message={warning.message}
                    onClose={() => setWarning({ isOpen: false })}
                />
            )}
        </div>
    );
}

export default MasterCrud;
