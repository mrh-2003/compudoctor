import { collection, getDocs, addDoc, query, orderBy, limit, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const DIAGNOSTICO_COLLECTION = 'diagnosticos';

export const getNextReportNumber = async () => {
    const q = query(collection(db, DIAGNOSTICO_COLLECTION), orderBy('reportNumber', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return 1;
    } else {
        const lastReport = querySnapshot.docs[0].data();
        return lastReport.reportNumber + 1;
    }
};

export const createDiagnosticReport = async (reportData) => {
    const reportNumber = await getNextReportNumber();

    const fullReport = {
        ...reportData,
        reportNumber,
        createdAt: new Date(),
    };

    await addDoc(collection(db, DIAGNOSTICO_COLLECTION), fullReport);
    return reportNumber;
};

export const getAllDiagnosticReports = async () => {
    const reportsCol = collection(db, DIAGNOSTICO_COLLECTION);
    const reportSnapshot = await getDocs(reportsCol);
    return reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDiagnosticReportById = async (reportId) => {
    const reportDocRef = doc(db, DIAGNOSTICO_COLLECTION, reportId);
    const reportDocSnap = await getDoc(reportDocRef);
    if (reportDocSnap.exists()) {
        return { id: reportDocSnap.id, ...reportDocSnap.data() };
    } else {
        return null;
    }
};

export const updateDiagnosticReport = async (reportId, data) => {
    const reportDoc = doc(db, DIAGNOSTICO_COLLECTION, reportId);
    await updateDoc(reportDoc, data);
};

export const deleteDiagnosticReport = async (reportId) => {
    const reportDoc = doc(db, DIAGNOSTICO_COLLECTION, reportId);
    await deleteDoc(reportDoc);
};

export const getAllClientsForSelection = async () => {
    const clientsCollection = collection(db, 'clientes');
    const clientsSnapshot = await getDocs(clientsCollection);
    return clientsSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre, telefono: doc.data().telefono, correo: doc.data().correo }));
};

export const getClientById = async (clientId) => {
  const clientDocRef = doc(db, 'clientes', clientId);
  const clientDocSnap = await getDoc(clientDocRef);
  if (clientDocSnap.exists()) {
    return { id: clientDocSnap.id, ...clientDocSnap.data() };
  } else {
    return null;
  }
};