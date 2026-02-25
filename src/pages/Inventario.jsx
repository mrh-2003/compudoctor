import React, { useState, useEffect, useMemo } from 'react';
import {
  getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem,
  getCategories, getFunctionalStates, getUnitsMeasure, getCustomFields
} from '../services/inventoryService';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFileExcel, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import Select from 'react-select';
import * as XLSX from 'xlsx';

function ConfirmationModal({ title, message, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel} maxWidth="max-w-md">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{title}</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex justify-end space-x-2">
          <button onClick={onCancel} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Confirmar</button>
        </div>
      </div>
    </Modal>
  )
}

function Inventario() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Masters Data
  const [categories, setCategories] = useState([]);
  const [functionalStates, setFunctionalStates] = useState([]);
  const [units, setUnits] = useState([]);
  const [customFields, setCustomFields] = useState([]);

  // Filters State
  const [activeFilters, setActiveFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(initialItemState());

  function initialItemState() {
    return {
      categoria: '',
      descripcion: '',
      estado: 'Nuevo', // Nuevo o Usado
      estado_funcional: '',
      cantidad: 1,
      unidad_medida: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      ubicacion: '',
      costo_compra: 0,
      costo_venta: 0,
      fecha_ingreso: new Date().toISOString().split('T')[0],
      observaciones: ''
    };
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, catData, funcData, unitData, customData] = await Promise.all([
        getInventoryItems(),
        getCategories(),
        getFunctionalStates(),
        getUnitsMeasure(),
        getCustomFields()
      ]);
      setItems(invData);
      setCategories(catData);
      setFunctionalStates(funcData);
      setUnits(unitData);
      setCustomFields(customData);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Text search
      const textMatch =
        item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!textMatch) return false;

      // 2. Custom Filters
      for (const [key, value] of Object.entries(activeFilters)) {
        if (value && value !== '') {
          // Si el item no tiene esa llave o no coincide
          if (String(item[key] || '') !== String(value)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [items, searchTerm, activeFilters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validations
    if (!currentItem.descripcion || !currentItem.categoria) {
      return toast.error('Descripción y Categoría son obligatorios');
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateInventoryItem(currentItem.id, currentItem);
        toast.success('Item actualizado');
      } else {
        await addInventoryItem(currentItem);
        toast.success('Item agregado');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const handleDeleteRequest = (item) => {
    setConfirmation({
      isOpen: true,
      title: 'Eliminar Item',
      message: `¿Estás seguro de que quieres eliminar "${item.descripcion}"? Esta acción es irreversible.`,
      onConfirm: () => handleDelete(item.id),
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventoryItem(id);
      toast.success('Eliminado correctamente');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar');
    }
    setConfirmation({ isOpen: false });
  };

  const openNew = () => {
    setCurrentItem(initialItemState());
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const exportToExcel = () => {
    if (filteredItems.length === 0) return toast.error("No hay datos para exportar");

    setIsExporting(true);
    try {
      // Prepare data as Array of Arrays
      const headers = [
        'Descripción', 'Categoría', 'Marca', 'Modelo', 'Serie',
        'Estado', 'Est. Funcional', 'Cantidad', 'Unidad',
        'Ubicación', 'Costo Compra', 'Costo Venta', 'Fecha Ingreso'
      ];

      const rows = filteredItems.map(item => [
        item.descripcion,
        item.categoria,
        item.marca,
        item.modelo,
        item.numero_serie,
        item.estado,
        item.estado_funcional,
        item.cantidad,
        item.unidad_medida,
        item.ubicacion,
        item.costo_compra,
        item.costo_venta,
        item.fecha_ingreso
      ]);

      // Construct final sheet data
      const sheetData = [
        [`Filtro aplicado: ${searchTerm || 'Ninguno'}`], // Row 1
        [], // Row 2 (Spacer)
        headers, // Row 3
        ...rows // Data rows
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");
      XLSX.writeFile(wb, "Inventario.xlsx");
      toast.success("Exportación completada");
    } catch (error) {
      console.error(error);
      toast.error("Error al exportar");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper for React Select options
  const toOptions = (list) => list.map(i => ({ value: i.nombre, label: i.nombre }));

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'var(--bg-select)', // We'll handle this via class or inline check
      borderColor: state.isFocused ? '#3b82f6' : 'var(--border-select)',
      color: 'var(--text-select)',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--bg-select-menu)',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#3b82f6' : 'var(--bg-select-menu)',
      color: state.isFocused ? 'white' : 'var(--text-select)',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--text-select)',
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--text-select)',
    })
  };

  // Since we can't easily use CSS variables inside JS object styles without setup, 
  // we'll use a simple dark mode check or just hardcode colors that work for both or use a wrapper.
  // Better approach: Use classNames prop if supported by the version, or conditional styles based on a dark mode context.
  // Assuming 'dark' class on html/body. We can't easily detect it in JS without a context or hook.
  // Let's use a simple style that looks okay in both or try to detect system preference if context not available.
  // Actually, the user said "currently always white". 
  // Let's use standard gray/white for light and gray-700/white for dark.

  // We will use a wrapper div with CSS variables defined for the select
  const selectWrapperClass = "react-select-container dark:text-white";

  return (
    <div className="p-6">
      {/* Define CSS variables for the select in this scope if possible, or just use standard styles */}
      <style>{`
                .dark .react-select__control {
                    background-color: #374151 !important;
                    border-color: #4b5563 !important;
                }
                .dark .react-select__menu {
                    background-color: #374151 !important;
                }
                .dark .react-select__option {
                    background-color: #374151;
                    color: white;
                }
                .dark .react-select__option--is-focused {
                    background-color: #2563eb !important; 
                }
                .dark .react-select__single-value {
                    color: white !important;
                }
                .dark .react-select__input-container {
                    color: white !important;
                }
            `}</style>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventario General</h1>
        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap border transition-colors ${showFilters ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600'}`}
          >
            <FaFilter /> Filtros
          </button>
          <button
            onClick={exportToExcel}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap"
          >
            <FaFileExcel /> {isExporting ? 'Exportando...' : 'Excel'}
          </button>
          <button
            onClick={openNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap"
          >
            <FaPlus /> Nuevo Item
          </button>
        </div>
      </div>

      {showFilters && customFields.filter(f => f.esFiltro).length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 border rounded-lg dark:bg-gray-800 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all">
          {customFields.filter(f => f.esFiltro).map(f => (
            <div key={f.id} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.nombre}</label>
              {f.tipo === 'select' ? (
                <select
                  className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={activeFilters[f.nombre] || ''}
                  onChange={e => setActiveFilters({ ...activeFilters, [f.nombre]: e.target.value })}
                >
                  <option value="">Todos</option>
                  {f.opciones.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={`Filtrar ${f.nombre}...`}
                  value={activeFilters[f.nombre] || ''}
                  onChange={e => setActiveFilters({ ...activeFilters, [f.nombre]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="flex items-end">
            <button
              onClick={() => setActiveFilters({})}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded dark:bg-red-900 dark:text-red-200"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Marca/Modelo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Costos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ubicación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan="8" className="p-4 text-center">Cargando inventario...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="8" className="p-4 text-center">No se encontraron items.</td></tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.descripcion}</div>
                    <div className="text-xs text-gray-500">S/N: {item.numero_serie || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.categoria}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.marca} {item.modelo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.cantidad > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.cantidad} {item.unidad_medida}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div>C: S/ {parseFloat(item.costo_compra || 0).toFixed(2)}</div>
                    <div>V: S/ {parseFloat(item.costo_venta || 0).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.ubicacion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {item.estado} / {item.estado_funcional}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-4"><FaEdit /></button>
                    <button onClick={() => handleDeleteRequest(item)} className="text-red-600 hover:text-red-900 dark:text-red-400"><FaTrash /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <Modal onClose={() => !isSaving && setIsModalOpen(false)}>
          <div className="p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              {isEditing ? 'Editar Item' : 'Nuevo Item'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Descripción */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium mb-1">Descripción *</label>
                <input
                  type="text"
                  required
                  value={currentItem.descripcion}
                  onChange={(e) => setCurrentItem({ ...currentItem, descripcion: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Categoría (Select from Master) */}
              <div>
                <label className="block text-sm font-medium mb-1">Categoría *</label>
                <Select
                  options={toOptions(categories)}
                  value={currentItem.categoria ? { label: currentItem.categoria, value: currentItem.categoria } : null}
                  onChange={(opt) => setCurrentItem({ ...currentItem, categoria: opt?.value || '' })}
                  classNamePrefix="react-select"
                  placeholder="Seleccione..."
                />
              </div>

              {/* Estado (Nuevo/Usado) */}
              <div>
                <label className="block text-sm font-medium mb-1">Condición</label>
                <select
                  value={currentItem.estado}
                  onChange={(e) => setCurrentItem({ ...currentItem, estado: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="Nuevo">Nuevo</option>
                  <option value="Usado">Usado</option>
                </select>
              </div>

              {/* Estado Funcional (Select from Master) */}
              <div>
                <label className="block text-sm font-medium mb-1">Estado Funcional</label>
                <Select
                  options={toOptions(functionalStates)}
                  value={currentItem.estado_funcional ? { label: currentItem.estado_funcional, value: currentItem.estado_funcional } : null}
                  onChange={(opt) => setCurrentItem({ ...currentItem, estado_funcional: opt?.value || '' })}
                  classNamePrefix="react-select"
                  placeholder="Seleccione..."
                />
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium mb-1">Cantidad</label>
                <input
                  type="number"
                  min="0"
                  value={currentItem.cantidad}
                  onChange={(e) => setCurrentItem({ ...currentItem, cantidad: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Unidad de Medida (Select from Master) */}
              <div>
                <label className="block text-sm font-medium mb-1">Unidad de Medida</label>
                <Select
                  options={toOptions(units)}
                  value={currentItem.unidad_medida ? { label: currentItem.unidad_medida, value: currentItem.unidad_medida } : null}
                  onChange={(opt) => setCurrentItem({ ...currentItem, unidad_medida: opt?.value || '' })}
                  classNamePrefix="react-select"
                  placeholder="Seleccione..."
                />
              </div>

              {/* Marca */}
              <div>
                <label className="block text-sm font-medium mb-1">Marca</label>
                <input
                  type="text"
                  value={currentItem.marca}
                  onChange={(e) => setCurrentItem({ ...currentItem, marca: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Modelo */}
              <div>
                <label className="block text-sm font-medium mb-1">Modelo</label>
                <input
                  type="text"
                  value={currentItem.modelo}
                  onChange={(e) => setCurrentItem({ ...currentItem, modelo: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Número de Serie */}
              <div>
                <label className="block text-sm font-medium mb-1">Número de Serie</label>
                <input
                  type="text"
                  value={currentItem.numero_serie}
                  onChange={(e) => setCurrentItem({ ...currentItem, numero_serie: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium mb-1">Ubicación</label>
                <input
                  type="text"
                  value={currentItem.ubicacion}
                  onChange={(e) => setCurrentItem({ ...currentItem, ubicacion: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Costo Compra */}
              <div>
                <label className="block text-sm font-medium mb-1">Costo Compra (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentItem.costo_compra}
                  onChange={(e) => setCurrentItem({ ...currentItem, costo_compra: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Costo Venta */}
              <div>
                <label className="block text-sm font-medium mb-1">Costo Venta (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentItem.costo_venta}
                  onChange={(e) => setCurrentItem({ ...currentItem, costo_venta: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Fecha Ingreso */}
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Ingreso</label>
                <input
                  type="date"
                  value={currentItem.fecha_ingreso}
                  onChange={(e) => setCurrentItem({ ...currentItem, fecha_ingreso: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Campos Dinámicos (Maestro de Maestros) */}
              {customFields.map(f => (
                <div key={f.id}>
                  <label className="block text-sm font-medium mb-1">{f.nombre}</label>
                  {f.tipo === 'select' ? (
                    <Select
                      options={f.opciones.map(o => ({ label: o, value: o }))}
                      value={currentItem[f.nombre] ? { label: currentItem[f.nombre], value: currentItem[f.nombre] } : null}
                      onChange={(opt) => setCurrentItem({ ...currentItem, [f.nombre]: opt?.value || '' })}
                      classNamePrefix="react-select"
                      placeholder="Seleccione..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={currentItem[f.nombre] || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, [f.nombre]: e.target.value })}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  )}
                </div>
              ))}

              {/* Observaciones */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea
                  value={currentItem.observaciones || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, observaciones: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                  placeholder="Detalles adicionales o comentarios..."
                ></textarea>
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {confirmation.isOpen && (
        <ConfirmationModal
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={() => setConfirmation({ isOpen: false })}
        />
      )}
    </div>
  );
}

export default Inventario;
