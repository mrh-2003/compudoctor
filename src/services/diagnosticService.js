import { collection, getDocs, addDoc, query, orderBy, limit, doc, getDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';
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
    // REQ 8: Asegura que el reporte tenga la estructura de área y estado inicial
    const reportNumber = await getNextReportNumber();
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const fullReport = {
        ...reportData,
        reportNumber,
        createdAt: now,
        // REQ 8: Establecer el técnico actual como el responsable
        tecnicoActual: reportData.tecnicoResponsable,
        // REQ 8: Inicializar diagnosticoPorArea con el área de destino en PENDIENTE
        diagnosticoPorArea: {
            [reportData.area]: [{
                reparacion: '',
                tecnico: reportData.tecnicoResponsable,
                fecha_inicio: formattedDate,
                hora_inicio: formattedTime,
                fecha_fin: '',
                hora_fin: '',
                estado: 'PENDIENTE',
            }],
        },
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

export const getAllDiagnosticReportsByTechnician = async (technicianName) => {
    const reportsCol = collection(db, DIAGNOSTICO_COLLECTION);
    const q = query(reportsCol, where('tecnicoActual', '==', technicianName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// REQ 7: Función para obtener el conteo de informes pendientes
export const getPendingReportsCountByTechnicianName = async (technicianName) => {
    if (!technicianName) return 0;
    const reportsCol = collection(db, DIAGNOSTICO_COLLECTION);
    
    // Se filtra por tecnicoActual y se hace un filtrado local de estado para ser más eficiente y simple con Firestore.
    const q = query(reportsCol, where('tecnicoActual', '==', technicianName));
    const querySnapshot = await getDocs(q);

    const pendingCount = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.estado === 'PENDIENTE' || data.estado === 'EN PROGRESO';
    }).length;

    return pendingCount;
};