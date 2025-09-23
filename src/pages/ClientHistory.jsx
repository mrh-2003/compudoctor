import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'

function ClientHistory() {
  const { clientId } = useParams()
  
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center mb-6">
        <Link to="/clientes" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white mr-4" title="Volver a Clientes">
          <FaArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Historial de Atenciones del Cliente {clientId}</h1>
      </div>
      <p>Aquí se listará el historial de servicios para el cliente con ID: {clientId}</p>
    </div>
  )
}

export default ClientHistory