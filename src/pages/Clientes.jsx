import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllClients, createClient, updateClient, deleteClient } from '../services/clientService'
import Modal from '../components/common/Modal'
import { FaPlus, FaEdit, FaTrash, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { FiPlus } from 'react-icons/fi'

function ClientForm({ client, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: client?.nombre || '',
    telefono: client?.telefono || '',
    correo: client?.correo || '',
  })

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  
  const handleSubmit = async (e) => { 
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold p-4 border-b dark:border-gray-600">{client ? 'Editar' : 'Agregar'} Cliente</h2>
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Correo (Opcional)</label>
          <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
        </div>
      </div>
      <div className="flex justify-end space-x-2 bg-gray-100 dark:bg-gray-900 p-4 border-t dark:border-gray-600">
        <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
      </div>
    </form>
  )
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
    )
}

function Notification({ message, type }) {
    const baseStyle = "p-4 rounded-md fixed top-5 right-5 text-white z-50 shadow-lg";
    const typeStyle = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return <div className={`${baseStyle} ${typeStyle}`}>{message}</div>;
}

function Clientes() {
  const { currentUser, loading } = useAuth()
  const [allClients, setAllClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [notification, setNotification] = useState({ message: '', type: '' })
  const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null })

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const canCreate = currentUser && (currentUser.rol === 'SUPERADMIN' || currentUser.rol === 'ADMIN' || currentUser.rol === 'SUPERUSER')
  const canEdit = currentUser && (currentUser.rol === 'SUPERADMIN' || currentUser.rol === 'ADMIN')
  const canDelete = currentUser && currentUser.rol === 'SUPERADMIN'
  const canView = currentUser && ['SUPERADMIN', 'ADMIN', 'SUPERUSER', 'USER'].includes(currentUser.rol)

  useEffect(() => {
    if (!loading && currentUser && canView) {
      fetchClients()
    }
  }, [loading, currentUser])

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const clientsData = await getAllClients()
      setAllClients(clientsData)
    } catch (error) {
      showNotification('Error al cargar clientes', 'error')
    }
    setIsLoading(false)
  }

  const showNotification = (message, type) => {
    setNotification({ message, type })
    setTimeout(() => setNotification({ message: '', type: '' }), 3000)
  }

  const handleOpenModal = (client = null) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClient(null)
  }

  const handleSaveClient = async (clientData) => {
    handleCloseModal()
    try {
      if (editingClient && editingClient.id) {
        await updateClient(editingClient.id, clientData)
        showNotification('Cliente actualizado con éxito', 'success')
      } else {
        await createClient(clientData)
        showNotification('Cliente agregado con éxito', 'success')
      }
      fetchClients()
    } catch (error) {
      showNotification(error.message, 'error')
    }
  }

  const handleDeleteRequest = (client) => {
    setConfirmation({
      isOpen: true,
      title: 'Eliminar Cliente',
      message: `¿Estás seguro de que quieres eliminar a ${client.nombre}? Esta acción es irreversible.`,
      onConfirm: () => handleDeleteClient(client.id),
    })
  }

  const handleDeleteClient = async (clientId) => {
    try {
      await deleteClient(clientId)
      showNotification('Cliente eliminado correctamente', 'success')
      fetchClients()
    } catch (error) {
      showNotification(error.message, 'error')
    }
    setConfirmation({ isOpen: false })
  }

  const filteredClients = useMemo(() => {
    if (!searchTerm) {
      return allClients;
    }
    return allClients.filter(client =>
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allClients, searchTerm]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredClients.slice(startIndex, startIndex + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredClients.length / pageSize);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };


  if (loading) {
    return <div className="text-center p-8">Cargando autenticación...</div>
  }

  if (!canView) {
    return <div className="text-center p-8 text-red-500">No tienes permiso para ver este módulo.</div>
  }

  if (isLoading) return <div className="text-center p-8">Cargando clientes...</div>

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      {notification.message && (
        <Notification message={notification.message} type={notification.type} />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
        {canCreate && (
          <button onClick={() => handleOpenModal()} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center">
            <FaPlus className="mr-2" /> Nuevo Cliente
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Correo</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">{client.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.telefono}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.correo || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-4">
                    <Link to={`/clientes/historial/${client.id}`} className="text-blue-500 hover:text-blue-700" title="Ver historial"><FaEye /></Link>
                    <Link to={`/diagnostico?clientId=${client.id}`} className="text-green-500 hover:text-green-700" title="Agregar servicio"><FiPlus /></Link>
                    {canEdit && <button onClick={() => handleOpenModal(client)} className="text-yellow-500 hover:text-yellow-700" title="Editar"><FaEdit /></button>}
                    {canDelete && <button onClick={() => handleDeleteRequest(client)} className="text-red-500 hover:text-red-700" title="Eliminar"><FaTrash /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-700 dark:text-gray-400">
          Página {currentPage} de {totalPages} ({filteredClients.length} resultados)
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <FaChevronLeft />
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>


      {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <ClientForm
            client={editingClient}
            onSave={handleSaveClient}
            onCancel={handleCloseModal}
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
  )
}

export default Clientes;