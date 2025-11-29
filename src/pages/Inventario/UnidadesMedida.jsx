import React from 'react';
import MasterCrud from './components/MasterCrud';
import { getUnitsMeasure, addUnitMeasure, updateUnitMeasure, deleteUnitMeasure } from '../../services/inventoryService';

function UnidadesMedida() {
    return (
        <MasterCrud
            title="Maestro de Unidades de Medida"
            fetchItems={getUnitsMeasure}
            addItem={addUnitMeasure}
            updateItem={updateUnitMeasure}
            deleteItem={deleteUnitMeasure}
        />
    );
}

export default UnidadesMedida;
