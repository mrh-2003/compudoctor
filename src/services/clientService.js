import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc, query, orderBy } from 'firebase/firestore'
import { db } from './firebase'

const CLIENTES_COLLECTION = 'clientes'

export const getAllClients = async () => {
  const clientsCol = collection(db, CLIENTES_COLLECTION)
  const q = query(clientsCol, orderBy('nombre'));
  const clientSnapshot = await getDocs(q);
  return clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const createClient = async (clientData) => {
  if (!clientData || !clientData.nombre || !clientData.telefono) {
    throw new Error("Nombre y teléfono son obligatorios.")
  }
  await addDoc(collection(db, CLIENTES_COLLECTION), {
    ...clientData,
    createdAt: new Date()
  })
}

export const updateClient = async (clientId, data) => {
  const clientDoc = doc(db, CLIENTES_COLLECTION, clientId)
  await updateDoc(clientDoc, data)
}

export const deleteClient = async (clientId) => {
  const clientDoc = doc(db, CLIENTES_COLLECTION, clientId)
  await deleteDoc(clientDoc)
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