import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, createUser, updateUser, deleteUser, resetPassword } from '../services/userService';
import { FaPlus, FaEdit, FaTrash, FaKey } from 'react-icons/fa';
import Modal from '../components/common/Modal';

const ALL_MODULES = [
    { id: 'clientes', name: 'Clientes' },
    { id: 'diagnostico', name: 'Diagnóstico' },
    { id: 'ver-estado', name: 'Ver Estado' },
    { id: 'inventario', name: 'Inventario' },
    { id: 'reportes', name: 'Reportes' },
];

function Usuarios() {
    const { currentUser, loading } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        if (!loading && currentUser) {
            fetchUsers();
        }
    }, [loading, currentUser]);
    
    if (loading) {
        return <div className="text-center p-8">Cargando autenticación...</div>;
    }

    if (!currentUser || (currentUser.rol !== 'SUPERADMIN' && currentUser.rol !== 'ADMIN')) {
        return <div className="text-center p-8 text-red-500">No tienes permiso para acceder a este módulo.</div>;
    }
    
    const canCreate = currentUser.rol === 'SUPERADMIN';
    const canEdit = currentUser.rol === 'SUPERADMIN' || currentUser.rol === 'ADMIN';
    const canDelete = currentUser.rol === 'SUPERADMIN';

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const allUsers = await getAllUsers();
            if (currentUser.rol !== 'SUPERADMIN') {
                setUsers(allUsers.filter(user => user.rol !== 'SUPERADMIN'));
            } else {
                setUsers(allUsers);
            }
        } catch (error) {
            showNotification('Error al cargar usuarios', 'error');
        }
        setIsLoading(false);
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = (userData) => {
        const userToUpdate = { ...editingUser };
        handleCloseModal();
    
        const performSave = async () => {
            try {
                if (userToUpdate && userToUpdate.id) {
                    await updateUser(userToUpdate.id, userData);
                    showNotification('Usuario actualizado con éxito', 'success');
                } else {
                    await createUser(userData);
                    showNotification('Usuario creado con éxito', 'success');
                }
                fetchUsers();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        };
    
        performSave();
    };

    const handleDeleteRequest = (user) => {
        setConfirmation({
            isOpen: true,
            title: 'Eliminar Usuario',
            message: `¿Estás seguro de que quieres eliminar a ${user.nombre}? Esta acción es irreversible.`,
            onConfirm: () => handleDeleteUser(user.id),
        });
    };

    const handleDeleteUser = async (userId) => {
        try {
            await deleteUser(userId);
            showNotification('Usuario eliminado correctamente', 'success');
            fetchUsers();
        } catch (error) {
            showNotification(error.message, 'error');
        }
        setConfirmation({ isOpen: false });
    };

    const handleResetRequest = (user) => {
        setConfirmation({
            isOpen: true,
            title: 'Resetear Contraseña',
            message: `¿Seguro que quieres resetear la contraseña de ${user.nombre}? Se establecerá su email como nueva contraseña.`,
            onConfirm: () => handleResetPassword(user),
        });
    };

    const handleResetPassword = async (user) => {
        try {
            await resetPassword(user.id, user.email);
            showNotification('Contraseña reseteada con éxito', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
        setConfirmation({ isOpen: false });
    };

    if (isLoading) return <div className="text-center p-8">Cargando usuarios...</div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            {notification.message && (
                <Notification message={notification.message} type={notification.type} />
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                {canCreate && (
                    <button onClick={() => handleOpenModal()} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <FaPlus className="mr-2" /> Nuevo Usuario
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Especialidad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">{user.nombre}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.especialidad || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.rol}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center space-x-4">
                                        {canEdit && <button onClick={() => handleOpenModal(user)} className="text-yellow-500 hover:text-yellow-700" title="Editar"><FaEdit /></button>}
                                        {canDelete && user.rol !== 'SUPERADMIN' && <button onClick={() => handleDeleteRequest(user)} className="text-red-500 hover:text-red-700" title="Eliminar"><FaTrash /></button>}
                                        {canEdit && <button onClick={() => handleResetRequest(user)} className="text-indigo-500 hover:text-indigo-700" title="Resetear contraseña"><FaKey /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal onClose={handleCloseModal}>
                    <UserForm
                        currentUser={editingUser}
                        onSave={handleSaveUser}
                        onCancel={handleCloseModal}
                        canEditFully={currentUser.rol === 'SUPERADMIN'}
                    />
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

function UserForm({ currentUser, onSave, onCancel, canEditFully }) {
    const [formData, setFormData] = useState({
        nombre: currentUser?.nombre || '',
        email: currentUser?.email || '',
        telefono: currentUser?.telefono || '',
        especialidad: currentUser?.especialidad || '',
        rol: currentUser?.rol || 'USER',
        permissions: currentUser?.permissions || [],
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handlePermissionsChange = (moduleId) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(moduleId)
                ? prev.permissions.filter(id => id !== moduleId)
                : [...prev.permissions, moduleId]
        }));
    };
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold p-4 border-b dark:border-gray-600">{currentUser ? 'Editar' : 'Crear'} Usuario</h2>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required disabled={!!currentUser} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Especialidad</label>
                    <input type="text" name="especialidad" value={formData.especialidad} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                
                {canEditFully ? (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-1">Rol</label>
                            <select name="rol" value={formData.rol} onChange={handleChange} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600">
                                <option value="USER">User</option>
                                <option value="SUPERUSER">Superuser</option>
                                <option value="ADMIN">Admin</option>
                                <option value="SUPERADMIN">Superadmin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Permisos de Módulos</label>
                            <div className="space-y-2 p-3 border rounded-md dark:border-gray-600">
                                {ALL_MODULES.map(module => (
                                    <label key={module.id} className="flex items-center cursor-pointer">
                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={formData.permissions.includes(module.id)} onChange={() => handlePermissionsChange(module.id)} />
                                        <span className="ml-3 text-sm">{module.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <input type="hidden" name="rol" value={formData.rol} />
                )}
            </div>
            <div className="flex justify-end space-x-2 bg-gray-100 dark:bg-gray-900 p-4 border-t dark:border-gray-600">
                <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
            </div>
        </form>
    );
}

function ConfirmationModal({ title, message, onConfirm, onCancel }) {
    return (
        <Modal onClose={onCancel}>
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <p className="mb-6">{message}</p>
                <div className="flex justify-end space-x-2">
                    <button onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Confirmar</button>
                </div>
            </div>
        </Modal>
    );
}

function Notification({ message, type }) {
    const baseStyle = "p-4 rounded-md fixed top-5 right-5 text-white z-50 shadow-lg";
    const typeStyle = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return <div className={`${baseStyle} ${typeStyle}`}>{message}</div>;
}

export default Usuarios;