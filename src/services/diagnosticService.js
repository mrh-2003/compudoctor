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
    const reportNumber = await getNextReportNumber();
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const initialTechnician = reportData.tecnicoResponsable;
    const initialTechnicianId = reportData.tecnicoResponsableId;

    const fullReport = {
        ...reportData,
        reportNumber,
        createdAt: now,
        tecnicoActual: initialTechnician,
        tecnicoActualId: initialTechnicianId,
        diagnosticoPorArea: {
            [reportData.area]: [{
                reparacion: '',
                tecnico: initialTechnician,
                tecnicoId: initialTechnicianId,
                ubicacionFisica: '',
                fecha_inicio: formattedDate,
                hora_inicio: formattedTime,
                fecha_fin: '',
                hora_fin: '',
                estado: 'ASIGNADO',
            }],
        },
    };

    await addDoc(collection(db, DIAGNOSTICO_COLLECTION), fullReport);
    return reportNumber;
};


export const getAllDiagnosticReports = async () => {
    const reportsCol = collection(db, DIAGNOSTICO_COLLECTION);
    const q = query(reportsCol, orderBy('reportNumber', 'desc'));  
    const reportSnapshot = await getDocs(q);
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

export const getAllDiagnosticReportsByTechnician = async (technicianId) => {
    const reportsCol = collection(db, DIAGNOSTICO_COLLECTION);

    const qActual = query(
        reportsCol,
        where('tecnicoActualId', '==', technicianId),
        where('estado', 'in', ['PENDIENTE', 'ASIGNADO']),
        orderBy('reportNumber', 'desc')
    );
    const snapshotActual = await getDocs(qActual);
    const reportsActual = snapshotActual.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const qResponsable = query(
        reportsCol,
        where('tecnicoResponsableId', '==', technicianId),
        where('estado', 'in', ['PENDIENTE', 'ASIGNADO']),
        orderBy('reportNumber', 'desc')
    );
    const snapshotResponsable = await getDocs(qResponsable);
    let reportsResponsable = snapshotResponsable.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const allReportsMap = new Map();
    reportsActual.forEach(report => allReportsMap.set(report.id, report));
    reportsResponsable.forEach(report => {
        if (!allReportsMap.has(report.id)) {
            allReportsMap.set(report.id, report);
        }
    });

    return Array.from(allReportsMap.values());
};

export const startDiagnosticReport = async (reportId) => {
    const reportDocRef = doc(db, DIAGNOSTICO_COLLECTION, reportId);
    const reportDocSnap = await getDoc(reportDocRef);

    if (reportDocSnap.exists()) {
        const reportData = reportDocSnap.data();
        if (reportData.estado === 'ASIGNADO') {
            await updateDoc(reportDocRef, {
                estado: 'PENDIENTE',
            });
            return true;
        }
        return reportData.estado === 'PENDIENTE';
    }
    return false;
};

export const getAllDiagnosticReportsByClientId = async (clientId) => {
    const reportsCol = collection(db, DIAGNOSTICO_COLLECTION); 
    const q = query(reportsCol, where('clientId', '==', clientId), orderBy('reportNumber', 'desc')); 
    const querySnapshot = await getDocs(q); 
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};