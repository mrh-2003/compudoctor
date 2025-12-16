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
    return clientsSnapshot.docs.map(doc => {
        const data = doc.data();
        const clientNameDisplay = data.tipoPersona === 'JURIDICA'
            ? `${data.razonSocial} (RUC: ${data.ruc})`
            : `${data.nombre} ${data.apellido}`;
        return {
            id: doc.id,
            nombre: data.nombre,
            apellido: data.apellido,
            telefono: data.telefono,
            correo: data.correo,
            tipoPersona: data.tipoPersona,
            ruc: data.ruc,
            razonSocial: data.razonSocial,
            display: clientNameDisplay, // Campo para mostrar en el Select
        }
    });
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
            const now = new Date();
            const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
            const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const currentArea = reportData.area; // e.g., 'DIAGNOSTICO', 'REPARACION', etc.

            // Update diagnosticoPorArea array for the current area
            let areaHistory = reportData.diagnosticoPorArea?.[currentArea] || [];

            // If we have history for this area, we update the last entry which should correspond to the current assignment
            // Or if it's a new logic, we make sure we are updating the active record.
            // Assuming the last item in the array is the current incomplete task for that area.
            if (areaHistory.length > 0) {
                const lastIndex = areaHistory.length - 1;
                areaHistory[lastIndex] = {
                    ...areaHistory[lastIndex],
                    fecha_inicio: formattedDate,
                    hora_inicio: formattedTime,
                    estado: 'PENDIENTE' // Sync status in history too
                };
            }

            await updateDoc(reportDocRef, {
                estado: 'PENDIENTE',
                [`diagnosticoPorArea.${currentArea}`]: areaHistory
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
export const addPayment = async (reportId, paymentData) => {
    const reportDocRef = doc(db, DIAGNOSTICO_COLLECTION, reportId);
    const reportDocSnap = await getDoc(reportDocRef);

    if (reportDocSnap.exists()) {
        const reportData = reportDocSnap.data();
        const currentPayments = reportData.pagosRealizado || [];
        const newPayments = [...currentPayments, paymentData];

        const totalPagado = newPayments.reduce((sum, payment) => sum + (parseFloat(payment.monto) || 0), 0);
        const totalPrincipal = (reportData.servicesList || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        const totalAdicional = (reportData.additionalServices || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        const diagnosticoCost = parseFloat(reportData.diagnostico) || 0;
        const totalGeneral = totalPrincipal + totalAdicional + diagnosticoCost;

        const nuevoSaldo = totalGeneral - totalPagado;

        await updateDoc(reportDocRef, {
            pagosRealizado: newPayments,
            aCuenta: totalPagado,
            saldo: nuevoSaldo,
            total: totalGeneral // Ensure total is also updated if needed, though usually fixed.
        });
        return true;
    }
    return false;
};

export const markReportAsPaid = async (reportId, additionalPayment = null, refundDetails = null) => {
    const reportDocRef = doc(db, DIAGNOSTICO_COLLECTION, reportId);
    const reportDocSnap = await getDoc(reportDocRef);

    if (reportDocSnap.exists()) {
        const reportData = reportDocSnap.data();
        let currentPayments = reportData.pagosRealizado || [];

        if (additionalPayment) {
            currentPayments = [...currentPayments, additionalPayment];
        }

        const totalPagado = currentPayments.reduce((sum, payment) => sum + (parseFloat(payment.monto) || 0), 0);

        // Update fields to reflect paid status
        const updates = {
            pagosRealizado: currentPayments,
            aCuenta: totalPagado,
            isPaid: true,
            statusPago: 'PAGADO', // Explicit text status
            fechaPago: new Date().toISOString(),
            saldo: 0, // Force balance to 0 as it is fully paid/settled
        };

        if (refundDetails) {
            updates.detalleDevolucion = refundDetails;
        }

        await updateDoc(reportDocRef, updates);
        return true;
    }
    return false;
};
