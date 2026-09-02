import React, { useState } from 'react';
import { FormulaItem, InsumoItem, FormulaIngrediente, FormulaPresentacion } from '../../types';
import { FlaskConical, Plus, Search, Edit3, Trash2, X, ChevronDown, ChevronUp, Package, Sparkles, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FormulasViewProps {
  formulas: FormulaItem[];
  inventario: InsumoItem[];
  onSaveFormula: (formula: FormulaItem) => Promise<void>;
  onDeleteFormula: (id: string) => Promise<void>;
}

export const FormulasView: React.FC<FormulasViewProps> = ({
  formulas,
  inventario,
  onSaveFormula,
  onDeleteFormula,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<FormulaItem | null>(null);
  const [formId, setFormId] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formBolas, setFormBolas] = useState('');
  const [formBandejas, setFormBandejas] = useState('');
  const [formIngredientes, setFormIngredientes] = useState<FormulaIngrediente[]>([
    { id: '', cantidad_necesaria: 0 },
  ]);
  const [formPresentaciones, setFormPresentaciones] = useState<FormulaPresentacion[]>([
    { gramaje: 500, bolas_por_paquete: 10 },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [formulaToDelete, setFormulaToDelete] = useState<FormulaItem | null>(null);

  const filteredFormulas = formulas.filter((f) =>
    f.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingFormula(null);
    setFormId('');
    setFormNombre('');
    setFormBolas('12');
    setFormBandejas('4');
    setFormIngredientes(
      inventario.length > 0 ? [{ id: inventario[0].id, cantidad_necesaria: 0.5 }] : [{ id: '', cantidad_necesaria: 0 }]
    );
    setFormPresentaciones([{ gramaje: 500, bolas_por_paquete: 12 }]);
    setIsModalOpen(true);
  };

  const openEditModal = (f: FormulaItem) => {
    setEditingFormula(f);
    setFormId(f.id);
    setFormNombre(f.nombre);
    setFormBolas(f.bolas_por_bandeja.toString());
    setFormBandejas(f.bandejas_por_lote.toString());
    setFormIngredientes(
      f.ingredientes && f.ingredientes.length > 0
        ? JSON.parse(JSON.stringify(f.ingredientes))
        : [{ id: '', cantidad_necesaria: 0 }]
    );
    setFormPresentaciones(
      f.presentaciones && f.presentaciones.length > 0
        ? JSON.parse(JSON.stringify(f.presentaciones))
        : [{ gramaje: 500, bolas_por_paquete: 12 }]
    );
    setIsModalOpen(true);
  };

  const addIngredienteRow = () => {
    const defaultId = inventario.length > 0 ? inventario[0].id : '';
    setFormIngredientes([...formIngredientes, { id: defaultId, cantidad_necesaria: 0 }]);
  };

  const removeIngredienteRow = (index: number) => {
    if (formIngredientes.length === 1) return;
    setFormIngredientes(formIngredientes.filter((_, idx) => idx !== index));
  };

  const updateIngrediente = (index: number, field: keyof FormulaIngrediente, value: any) => {
    const next = [...formIngredientes];
    next[index] = { ...next[index], [field]: value };
    setFormIngredientes(next);
  };

  const addPresentacionRow = () => {
    setFormPresentaciones([...formPresentaciones, { gramaje: 500, bolas_por_paquete: 10 }]);
  };

  const removePresentacionRow = (index: number) => {
    if (formPresentaciones.length === 1) return;
    setFormPresentaciones(formPresentaciones.filter((_, idx) => idx !== index));
  };

  const updatePresentacion = (index: number, field: keyof FormulaPresentacion, value: any) => {
    const next = [...formPresentaciones];
    next[index] = { ...next[index], [field]: value };
    setFormPresentaciones(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) return;

    const bolas = parseInt(formBolas, 10);
    const bandejas = parseInt(formBandejas, 10);

    const validIngredientes = formIngredientes.filter(
      (ing) => ing.id && Number(ing.cantidad_necesaria) > 0
    );
    const validPresentaciones = formPresentaciones.filter(
      (p) => Number(p.gramaje) > 0 && Number(p.bolas_por_paquete) > 0
    );

    if (validIngredientes.length === 0 || validPresentaciones.length === 0) {
      alert('Debe incluir al menos un ingrediente válido y una presentación.');
      return;
    }

    setIsSaving(true);
    try {
      const id = formId || `${formNombre.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      await onSaveFormula({
        id,
        nombre: formNombre.trim(),
        bolas_por_bandeja: bolas || 1,
        bandejas_por_lote: bandejas || 1,
        ingredientes: validIngredientes,
        presentaciones: validPresentaciones,
      });
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!formulaToDelete) return;
    await onDeleteFormula(formulaToDelete.id);
    setFormulaToDelete(null);
  };

  const getInsumoName = (id: string) => {
    const item = inventario.find((i) => i.id === id);
    return item ? `${item.nombre} (${item.unidad})` : id;
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Recetas y Fórmulas Maestras</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {formulas.length} fórmulas
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configuración de rendimiento por bandeja, lote y especificaciones de empaque.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Fórmula</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por nombre de producto o receta..."
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

      {/* Formulas Cards Grid */}
      {filteredFormulas.length === 0 ? (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl py-16 text-center text-zinc-500 space-y-2">
          <FlaskConical className="w-8 h-8 mx-auto text-zinc-600 stroke-1" />
          <p className="text-xs font-medium">No hay fórmulas registradas.</p>
          <p className="text-[11px] text-zinc-600">Crea una nueva fórmula para estandarizar tus productos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFormulas.map((formula) => {
            const isExpanded = expandedId === formula.id;
            const totalBolasPorLote = formula.bolas_por_bandeja * formula.bandejas_por_lote;

            return (
              <motion.div
                key={formula.id}
                layout
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl hover:border-zinc-700/80 transition-all space-y-4"
              >
                {/* Title & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{formula.nombre}</h3>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{formula.id}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(formula)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="Editar fórmula"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setFormulaToDelete(formula)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      title="Eliminar fórmula"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-center">
                  <div>
                    <span className="block text-[10px] text-zinc-400">Bolas / Band.</span>
                    <span className="font-mono font-bold text-sm text-indigo-300">
                      {formula.bolas_por_bandeja}
                    </span>
                  </div>
                  <div className="border-x border-zinc-800/80">
                    <span className="block text-[10px] text-zinc-400">Band. / Lote</span>
                    <span className="font-mono font-bold text-sm text-indigo-300">
                      {formula.bandejas_por_lote}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-400">Total Bolas/Lote</span>
                    <span className="font-mono font-bold text-sm text-emerald-400">
                      {totalBolasPorLote}
                    </span>
                  </div>
                </div>

                {/* Presentaciones Preview */}
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                    Presentaciones Disponibles:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {formula.presentaciones?.map((p, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                      >
                        <Scale className="w-3 h-3 text-indigo-400" />
                        {p.gramaje}g ({p.bolas_por_paquete} bol/paq)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Toggle Ingredients List */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : formula.id)}
                    className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1 cursor-pointer"
                  >
                    <span>
                      {formula.ingredientes?.length || 0} Ingredientes por bandeja
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-1.5 overflow-hidden"
                      >
                        {formula.ingredientes?.map((ing, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[11px]"
                          >
                            <span className="text-zinc-300 font-medium">
                              {getInsumoName(ing.id)}
                            </span>
                            <span className="font-mono font-bold text-indigo-400">
                              {ing.cantidad_necesaria} por bandeja
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Nueva / Editar Fórmula */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-5 sm:p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {editingFormula ? 'Editar Fórmula' : 'Nueva Fórmula'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pan Hamburguesa Clásico, Pan Molde"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Bolas por bandeja *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="12"
                      value={formBolas}
                      onChange={(e) => setFormBolas(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Bandejas por lote *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="4"
                      value={formBandejas}
                      onChange={(e) => setFormBandejas(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Section: Ingredientes */}
                <div className="pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-200">
                      Ingredientes (cantidad por bandeja)
                    </label>
                    <button
                      type="button"
                      onClick={addIngredienteRow}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Insumo</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formIngredientes.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={ing.id}
                          onChange={(e) => updateIngrediente(idx, 'id', e.target.value)}
                          className="flex-1 px-3 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer truncate"
                        >
                          <option value="">-- Seleccionar Insumo --</option>
                          {inventario.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.nombre} ({i.unidad})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          placeholder="Cant./bandeja"
                          value={ing.cantidad_necesaria || ''}
                          onChange={(e) =>
                            updateIngrediente(idx, 'cantidad_necesaria', parseFloat(e.target.value) || 0)
                          }
                          className="w-28 px-3 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500 text-right"
                        />

                        <button
                          type="button"
                          onClick={() => removeIngredienteRow(idx)}
                          disabled={formIngredientes.length === 1}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Presentaciones */}
                <div className="pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-200">
                      Presentaciones de Empaque
                    </label>
                    <button
                      type="button"
                      onClick={addPresentacionRow}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Presentación</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formPresentaciones.map((pres, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            placeholder="Gramos"
                            value={pres.gramaje || ''}
                            onChange={(e) =>
                              updatePresentacion(idx, 'gramaje', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono">
                            g
                          </span>
                        </div>

                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            placeholder="Bolas / paquete"
                            value={pres.bolas_por_paquete || ''}
                            onChange={(e) =>
                              updatePresentacion(idx, 'bolas_por_paquete', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">
                            bol/paq
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removePresentacionRow(idx)}
                          disabled={formPresentaciones.length === 1}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formNombre.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : editingFormula ? 'Guardar Cambios' : 'Guardar Fórmula'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {formulaToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl"
            >
              <h3 className="text-sm font-bold text-white mb-1">¿Eliminar esta fórmula?</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Se eliminará la fórmula <strong className="text-zinc-200">"{formulaToDelete.nombre}"</strong>.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setFormulaToDelete(null)}
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
