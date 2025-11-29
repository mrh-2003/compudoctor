import React from 'react';
import MasterCrud from './components/MasterCrud';
import { getFunctionalStates, addFunctionalState, updateFunctionalState, deleteFunctionalState } from '../../services/inventoryService';

function EstadosFuncionales() {
    return (
        <MasterCrud
            title="Maestro de Estados Funcionales"
            fetchItems={getFunctionalStates}
            addItem={addFunctionalState}
            updateItem={updateFunctionalState}
            deleteItem={deleteFunctionalState}
        />
    );
}

export default EstadosFuncionales;
