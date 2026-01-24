import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './firebase'
import { logAction } from './logService'

const createUserFn = httpsCallable(functions, 'createUser')
const deleteUserFn = httpsCallable(functions, 'deleteUser')
const resetUserPasswordFn = httpsCallable(functions, 'resetUserPassword')

export const getAllUsers = async () => {
	const usersCol = collection(db, 'users')
	const q = query(usersCol, orderBy('nombre'));
	const userSnapshot = await getDocs(q)
	return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const getAllUsersDetailed = async () => {
	const usersCol = collection(db, 'users');
	const userSnapshot = await getDocs(usersCol);
	return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createUser = async (userData) => {
	if (!userData || !userData.email || !userData.nombre || !userData.rol) {
		throw new Error("Datos del usuario incompletos en el cliente.");
	}
	try {
		const result = await createUserFn(userData)
		console.log("Respuesta de la Cloud Function:", result);

		await logAction('CREATE', 'Usuario', userData, `Creación de usuario: ${userData.email}`);
		return result.data
	} catch (error) {
		console.error("Error al llamar la función createUser:", error)
		throw new Error(error.message)
	}
}

export const updateUser = async (userId, data) => {
	const userDoc = doc(db, 'users', userId)
	await updateDoc(userDoc, data)
	await logAction('UPDATE', 'Usuario', data, `Actualización de usuario`, userId);
}

export const deleteUser = async (uid) => {
	try {
		const result = await deleteUserFn({ uid })
		await logAction('DELETE', 'Usuario', { uid }, `Eliminación de usuario`, uid);
		return result.data
	} catch (error) {
		console.error("Error al llamar la función deleteUser:", error)
		throw new Error(error.message)
	}
}

export const resetPassword = async (uid, email) => {
	try {
		const result = await resetUserPasswordFn({ uid, email });
		await logAction('UPDATE', 'Usuario', { uid, email }, `Reset de contraseña de usuario`, uid);
		return result.data;
	} catch (error) {
		console.error("Error al llamar la función resetUserPassword:", error);
		throw new Error(error.message);
	}
}