import React, { useState, useMemo } from 'react';
import { InsumoItem } from '../../types';
import { Layers, Plus, Search, Edit3, Trash2, X, DollarSign, Package, Filter, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InventarioViewProps {
  inventario: InsumoItem[];
  onSaveInsumo: (insumo: { id?: string; nombre: string; cantidad: number; unidad: string; costo_unitario: number }) => Promise<void>;
  onDeleteInsumo: (id: string) => Promise<void>;
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onOpenExportReport?: () => void;
}

export const InventarioView: React.FC<InventarioViewProps> = ({
  inventario,
  onSaveInsumo,
  onDeleteInsumo,
  isModalOpen,
  onOpenModal,
  onCloseModal,
  onOpenExportReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnidad, setSelectedUnidad] = useState<string>('todos');
  const [editingItem, setEditingItem] = useState<InsumoItem | null>(null);

  // Modal form state
  const [formId, setFormId] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formCantidad, setFormCantidad] = useState('');
  const [formUnidad, setFormUnidad] = useState('kg');
  const [formCosto, setFormCosto] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm state
  const [itemToDelete, setItemToDelete] = useState<InsumoItem | null>(null);

  const filteredItems = useMemo(() => {
    return inventario.filter((item) => {
      const matchSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchUnidad = selectedUnidad === 'todos' || item.unidad.toLowerCase() === selectedUnidad.toLowerCase();
      return matchSearch && matchUnidad;
    });
  }, [inventario, searchTerm, selectedUnidad]);

  const totalValor = useMemo(() => {
    return inventario.reduce((acc, item) => acc + (item.cantidad * item.costo_unitario || 0), 0);
  }, [inventario]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormId('');
    setFormNombre('');
    setFormCantidad('');
    setFormUnidad('kg');
    setFormCosto('');
    onOpenModal();
  };

  const openEditModal = (item: InsumoItem) => {
    setEditingItem(item);
    setFormId(item.id);
    setFormNombre(item.nombre);
    setFormCantidad(item.cantidad.toString());
    setFormUnidad(item.unidad);
    setFormCosto(item.costo_unitario ? item.costo_unitario.toString() : '0');
    onOpenModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) return;

    setIsSaving(true);
    try {
      const id = formId || formNombre.trim().toLowerCase().replace(/\s+/g, '_');
      await onSaveInsumo({
        id,
        nombre: formNombre.trim(),
        cantidad: parseFloat(formCantidad) || 0,
        unidad: formUnidad,
        costo_unitario: parseFloat(formCosto) || 0,
      });
      onCloseModal();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await onDeleteInsumo(itemToDelete.id);
    setItemToDelete(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Inventario de Insumos</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {inventario.length} materias primas
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Valorización estimada: <strong className="text-zinc-200 font-mono">{totalValor.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenExportReport && (
            <button
              onClick={onOpenExportReport}
              id="inventario-btn-export-pdf"
              className="px-3.5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Descargar reporte de inventario en PDF para conteo físico"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Exportar PDF</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID de insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Unit Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {['todos', 'kg', 'L', 'uds', 'g'].map((u) => (
            <button
              key={u}
              onClick={() => setSelectedUnidad(u)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap capitalize ${
                selectedUnidad === u
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              {u === 'todos' ? 'Todas las unidades' : u}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <Package className="w-8 h-8 mx-auto text-zinc-600 stroke-1" />
            <p className="text-xs font-medium">No se encontraron insumos.</p>
            <p className="text-[11px] text-zinc-600">Intenta cambiar la búsqueda o agrega un nuevo insumo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-950/40 text-zinc-400 font-semibold border-b border-zinc-800">
                  <th className="py-3 px-4 font-medium">Nombre / ID</th>
                  <th className="py-3 px-4 font-medium text-right">Cantidad en Stock</th>
                  <th className="py-3 px-4 font-medium text-right">Costo Unitario</th>
                  <th className="py-3 px-4 font-medium text-right">Valor Total</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filteredItems.map((item) => {
                  const valorItem = item.cantidad * (item.costo_unitario || 0);
                  const isLow = item.cantidad <= 5;
                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-100">{item.nombre}</div>
                        <div className="text-[10px] font-mono text-zinc-500">{item.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg ${
                            isLow
                              ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                              : 'text-zinc-200 bg-zinc-800/60'
                          }`}
                        >
                          {item.cantidad} {item.unidad}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                        {item.costo_unitario ? Number(item.costo_unitario).toFixed(2) : '0.00'} Bs.
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-indigo-300">
                        {valorItem.toFixed(2)} Bs.
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="Editar insumo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Agregar / Editar Insumo */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-5 sm:p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {editingItem ? 'Editar Insumo' : 'Nuevo Insumo'}
                  </h3>
                </div>
                <button
                  onClick={onCloseModal}
                  className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Nombre del Insumo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Harina de Trigo, Leche Entera"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Cantidad Actual
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formCantidad}
                      onChange={(e) => setFormCantidad(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Unidad de Medida
                    </label>
                    <select
                      value={formUnidad}
                      onChange={(e) => setFormUnidad(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="kg">Kilogramos (kg)</option>
                      <option value="L">Litros (L)</option>
                      <option value="uds">Unidades (uds)</option>
                      <option value="g">Gramos (g)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Costo Unitario (Bs.)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formCosto}
                      onChange={(e) => setFormCosto(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-medium">
                      Bs. / {formUnidad}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={onCloseModal}
                    className="px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formNombre.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : editingItem ? 'Guardar Cambios' : 'Registrar Insumo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl"
            >
              <h3 className="text-sm font-bold text-white mb-1">¿Eliminar este insumo?</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Se eliminará <strong className="text-zinc-200">"{itemToDelete.nombre}"</strong> del inventario. Esta acción no se puede deshacer.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
