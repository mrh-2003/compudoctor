const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const ALL_MODULES = [
    { id: 'clientes', name: 'Clientes' },
    { id: 'diagnostico', name: 'Diagnóstico' },
    { id: 'ver-estado', name: 'Ver Estado' },
    { id: 'inventario', name: 'Inventario' },
    { id: 'reportes', name: 'Reportes' },
];


exports.createUser = functions.https.onCall(async (request) => {
    const { email, nombre, rol, telefono, especialidad, permissions } = request.data;
    if (!email || !nombre || !rol) {
        throw new functions.https.HttpsError("invalid-argument", "Email, nombre y rol son obligatorios.");
    }
    try {
        const userRecord = await admin.auth().createUser({ email, password: email, displayName: nombre });
        await admin.auth().setCustomUserClaims(userRecord.uid, { rol: rol.toUpperCase() });

        const userData = {
            nombre,
            telefono: telefono || "",
            especialidad: especialidad || "",
            email,
            rol: rol.toUpperCase(),
            permissions: permissions || [], 
            passwordChanged: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("users").doc(userRecord.uid).set(userData);
        return { result: `Usuario ${email} creado.` };
    } catch (error) {
        throw new functions.https.HttpsError("unknown", error.message);
    }
});

exports.deleteUser = functions.https.onCall(async (request) => {
    const { uid } = request.data;
    if (!uid) {
        throw new functions.https.HttpsError("invalid-argument", "UID es requerido.");
    }
    try {
        await admin.auth().deleteUser(uid);
        await db.collection("users").doc(uid).delete();
        return { result: "Usuario eliminado correctamente." };
    } catch (error) {
        throw new functions.https.HttpsError("unknown", "No se pudo eliminar el usuario.");
    }
});

exports.resetUserPassword = functions.https.onCall(async (request) => {
    const { uid, email } = request.data;
    if (!uid || !email) {
        throw new functions.https.HttpsError("invalid-argument", "UID y email son requeridos.");
    }
    try {
        await admin.auth().updateUser(uid, { password: email });
        await db.collection("users").doc(uid).update({ passwordChanged: false });
        return { result: `La contraseña del usuario ${email} ha sido reseteada.` };
    } catch (error) {
        throw new functions.https.HttpsError("unknown", "No se pudo resetear la contraseña.");
    }
});