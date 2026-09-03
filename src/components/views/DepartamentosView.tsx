import React, { useState } from 'react';
import { DepartamentoItem, LoteItem } from '../../types';
import { Building2, Plus, Search, Edit3, Trash2, X, Globe, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DepartamentosViewProps {
  departamentos: DepartamentoItem[];
  lotes: LoteItem[];
  onSaveDepartamento: (dep: { id?: string; nombre: string; slug: string }) => Promise<void>;
  onDeleteDepartamento: (id: string) => Promise<void>;
}

export const DepartamentosView: React.FC<DepartamentosViewProps> = ({
  departamentos,
  lotes,
  onSaveDepartamento,
  onDeleteDepartamento,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDep, setEditingDep] = useState<DepartamentoItem | null>(null);
  const [formId, setFormId] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [depToDelete, setDepToDelete] = useState<DepartamentoItem | null>(null);

  const filtered = departamentos.filter(
    (d) =>
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingDep(null);
    setFormId('');
    setFormNombre('');
    setFormSlug('');
    setIsModalOpen(true);
  };

  const openEditModal = (d: DepartamentoItem) => {
    setEditingDep(d);
    setFormId(d.id || '');
    setFormNombre(d.nombre);
    setFormSlug(d.slug);
    setIsModalOpen(true);
  };

  const handleNombreChange = (value: string) => {
    setFormNombre(value);
    if (!editingDep) {
      const slugGenerated = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      setFormSlug(slugGenerated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formSlug.trim()) return;

    setIsSaving(true);
    try {
      const payload: { id?: string; nombre: string; slug: string } = {
        nombre: formNombre.trim(),
        slug: formSlug.trim().toLowerCase().replace(/\s+/g, '-'),
      };
      if (formId) {
        payload.id = formId;
      }
      await onSaveDepartamento(payload);
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!depToDelete || !depToDelete.id) return;
    await onDeleteDepartamento(depToDelete.id);
    setDepToDelete(null);
  };

  const getLotesCount = (depId?: string) => {
    if (!depId) return 0;
    return lotes.filter((l) => l.departamento_id === depId).length;
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Departamentos y Sedes</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {departamentos.length} departamentos
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Líneas de producción, áreas operativas y puntos de distribución de Almacén Pro.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Departamento</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar departamento por nombre o slug..."
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

      {/* Grid of Departments */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl py-16 text-center text-zinc-500 space-y-2">
          <Building2 className="w-8 h-8 mx-auto text-zinc-600 stroke-1" />
          <p className="text-xs font-medium">No se encontraron departamentos.</p>
          <p className="text-[11px] text-zinc-600">Registra sedes o líneas operativas para asignar lotes de producción.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dep) => {
            const count = getLotesCount(dep.id);
            return (
              <motion.div
                key={dep.id || dep.slug}
                layout
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                        {dep.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">{dep.nombre}</h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 mt-0.5">
                          <Globe className="w-3 h-3 text-zinc-500" />
                          /{dep.slug}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(dep)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Editar departamento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDepToDelete(dep)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Eliminar departamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
                  <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
                    <Box className="w-3.5 h-3.5 text-indigo-400" />
                    Lotes asignados:
                  </span>
                  <span className="font-mono font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded-md text-[11px]">
                    {count}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Agregar / Editar Departamento */}
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
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {editingDep ? 'Editar Departamento' : 'Nuevo Departamento'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Nombre del Departamento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Línea Panadería, Sucursal Norte, Planta Central"
                    value={formNombre}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Slug Identificador (para URL o clave interna) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej-linea-panaderia"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Identificador único en minúsculas y separado por guiones.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formNombre.trim() || !formSlug.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Guardando...' : editingDep ? 'Guardar Cambios' : 'Registrar Departamento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {depToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl"
            >
              <h3 className="text-sm font-bold text-white mb-1">¿Eliminar este departamento?</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Se eliminará el departamento <strong className="text-zinc-200">"{depToDelete.nombre}"</strong>.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDepToDelete(null)}
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
