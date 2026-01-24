import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc, query, orderBy } from 'firebase/firestore'
import { db } from './firebase'
import { logAction } from './logService'

const CLIENTES_COLLECTION = 'clientes'

export const getAllClients = async () => {
  const clientsCol = collection(db, CLIENTES_COLLECTION)
  const q = query(clientsCol, orderBy('nombre'));
  const clientSnapshot = await getDocs(q);
  return clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const createClient = async (clientData) => {
  if (!clientData.tipoPersona) {
    throw new Error("El tipo de persona es obligatorio.")
  }

  // Las validaciones de campos obligatorios deben coincidir con la lógica en Clientes.jsx
  if (clientData.tipoPersona === 'NATURAL') {
    if (!clientData.nombre || !clientData.apellido || !clientData.telefono) {
      throw new Error("Nombre, apellido y teléfono son obligatorios para persona natural.")
    }
  } else if (clientData.tipoPersona === 'JURIDICA') {
    if (!clientData.ruc || !clientData.razonSocial || !clientData.nombre || !clientData.apellido || !clientData.telefono) {
      throw new Error("RUC, Razón Social, Nombre de Contacto, Apellido de Contacto y Teléfono de Contacto son obligatorios para persona jurídica.")
    }
  } else {
    throw new Error("Tipo de persona inválido.")
  }

  const docRef = await addDoc(collection(db, CLIENTES_COLLECTION), {
    ...clientData,
    createdAt: new Date()
  })

  await logAction('CREATE', 'Cliente', clientData, `Registro de cliente: ${clientData.nombre} ${clientData.apellido}`, docRef.id);
}

export const updateClient = async (clientId, data) => {
  const clientDoc = doc(db, CLIENTES_COLLECTION, clientId)
  await updateDoc(clientDoc, data)
  await logAction('UPDATE', 'Cliente', data, `Actualización de cliente`, clientId);
}

export const deleteClient = async (clientId) => {
  const clientDoc = doc(db, CLIENTES_COLLECTION, clientId)
  await deleteDoc(clientDoc)
  await logAction('DELETE', 'Cliente', { id: clientId }, `Eliminación de cliente`, clientId);
}

export const getClientById = async (clientId) => {
  const clientDocRef = doc(db, CLIENTES_COLLECTION, clientId);
  const clientDocSnap = await getDoc(clientDocRef);
  if (clientDocSnap.exists()) {
    return { id: clientDocSnap.id, ...clientDocSnap.data() };
  } else {
    return null;
  }
};