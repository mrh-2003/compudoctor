import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

// Collection Names
const INVENTORY_COLLECTION = 'inventory_items';
const CATEGORIES_COLLECTION = 'inv_categories';
const FUNCTIONAL_STATES_COLLECTION = 'inv_functional_states';
const UNITS_MEASURE_COLLECTION = 'inv_units_measure';
const CUSTOM_FIELDS_COLLECTION = 'inv_custom_fields';

// --- Generic Master CRUD Helpers ---

const getMasterItems = async (collectionName) => {
    const q = query(collection(db, collectionName), orderBy('nombre', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const addMasterItem = async (collectionName, item) => {
    await addDoc(collection(db, collectionName), item);
};

const updateMasterItem = async (collectionName, id, item) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, item);
};

const deleteMasterItem = async (collectionName, id) => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
};

// --- Specific Master Exports ---

export const getCategories = () => getMasterItems(CATEGORIES_COLLECTION);
export const addCategory = (item) => addMasterItem(CATEGORIES_COLLECTION, item);
export const updateCategory = (id, item) => updateMasterItem(CATEGORIES_COLLECTION, id, item);
export const deleteCategory = (id) => deleteMasterItem(CATEGORIES_COLLECTION, id);

export const getFunctionalStates = () => getMasterItems(FUNCTIONAL_STATES_COLLECTION);
export const addFunctionalState = (item) => addMasterItem(FUNCTIONAL_STATES_COLLECTION, item);
export const updateFunctionalState = (id, item) => updateMasterItem(FUNCTIONAL_STATES_COLLECTION, id, item);
export const deleteFunctionalState = (id) => deleteMasterItem(FUNCTIONAL_STATES_COLLECTION, id);

export const getUnitsMeasure = () => getMasterItems(UNITS_MEASURE_COLLECTION);
export const addUnitMeasure = (item) => addMasterItem(UNITS_MEASURE_COLLECTION, item);
export const updateUnitMeasure = (id, item) => updateMasterItem(UNITS_MEASURE_COLLECTION, id, item);
export const deleteUnitMeasure = (id) => deleteMasterItem(UNITS_MEASURE_COLLECTION, id);

export const getCustomFields = () => getMasterItems(CUSTOM_FIELDS_COLLECTION);
export const addCustomField = (item) => addMasterItem(CUSTOM_FIELDS_COLLECTION, item);
export const updateCustomField = (id, item) => updateMasterItem(CUSTOM_FIELDS_COLLECTION, id, item);
export const deleteCustomField = (id) => deleteMasterItem(CUSTOM_FIELDS_COLLECTION, id);

// --- Inventory Items CRUD ---

export const getInventoryItems = async () => {
    const q = query(collection(db, INVENTORY_COLLECTION), orderBy('fecha_ingreso', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addInventoryItem = async (item) => {
    await addDoc(collection(db, INVENTORY_COLLECTION), item);
};

export const updateInventoryItem = async (id, item) => {
    const docRef = doc(db, INVENTORY_COLLECTION, id);
    await updateDoc(docRef, item);
};

export const deleteInventoryItem = async (id) => {
    const docRef = doc(db, INVENTORY_COLLECTION, id);
    await deleteDoc(docRef);
};
