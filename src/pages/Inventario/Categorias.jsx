import React from 'react';
import MasterCrud from './components/MasterCrud';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../services/inventoryService';

function Categorias() {
    return (
        <MasterCrud
            title="Maestro de Categorías"
            fetchItems={getCategories}
            addItem={addCategory}
            updateItem={updateCategory}
            deleteItem={deleteCategory}
        />
    );
}

export default Categorias;
