import React, { useState } from 'react';
import { LoteItem, DepartamentoItem } from '../../types';
import {
  PackageCheck,
  Search,
  CheckCircle2,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Box,
  Layers,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Warehouse,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AlmacenViewProps {
  lotes: LoteItem[];
  departamentos: DepartamentoItem[];
  onConfirmarEmpaque: (loteId: string) => Promise<void>;
  onOpenExportReport?: () => void;
}

export const AlmacenView: React.FC<AlmacenViewProps> = ({
  lotes,
  departamentos,
  onConfirmarEmpaque,
  onOpenExportReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'almacen1' | 'almacen2'>('todos');
  const [expandedLoteId, setExpandedLoteId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filtered lotes
  const filteredLotes = lotes.filter((lote) => {
    const matchesSearch =
      lote.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lote.producto.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || lote.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getDeptoNombre = (id: string) => {
    const d = departamentos.find((dep) => dep.id === id || dep.slug === id);
    return d ? d.nombre : id;
  };

  const handleConfirmar = async (loteId: string) => {
    setProcessingId(loteId);
    try {
      await onConfirmarEmpaque(loteId);
    } finally {
      setProcessingId(null);
    }
  };

  const lotesPendientes = lotes.filter((l) => l.estado === 'almacen1').length;
  const lotesEmpacados = lotes.filter((l) => l.estado === 'almacen2').length;

  return (
    <div className="space-y-5">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Control de Almacenes y Lotes
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {lotes.length} lotes
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitorea el inventario de lotes en <strong>Almacén 1 (En proceso)</strong> y confirma su empaque hacia <strong>Almacén 2 (Empacado)</strong>.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenExportReport && (
            <button
              onClick={onOpenExportReport}
              id="almacen-btn-export-pdf"
              className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Descargar reporte PDF del estado de lotes"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exportar PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Status Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar lote por código o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="sm:col-span-6 flex items-center bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
              statusFilter === 'todos' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({lotes.length})
          </button>
          <button
            onClick={() => setStatusFilter('almacen1')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              statusFilter === 'almacen1'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-amber-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Alm. 1 ({lotesPendientes})</span>
          </button>
          <button
            onClick={() => setStatusFilter('almacen2')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              statusFilter === 'almacen2'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-emerald-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Alm. 2 Empacados ({lotesEmpacados})</span>
          </button>
        </div>
      </div>

      {/* Lotes List */}
      {filteredLotes.length === 0 ? (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl py-16 text-center text-zinc-500 space-y-2">
          <Box className="w-8 h-8 mx-auto text-zinc-600 stroke-1" />
          <p className="text-xs font-medium">No se encontraron lotes con los filtros seleccionados.</p>
          <p className="text-[11px] text-zinc-600">Prueba cambiando el filtro de estado o el término de búsqueda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLotes.map((lote) => {
            const isEmpacado = lote.estado === 'almacen2';
            const isExpanded = expandedLoteId === lote.id;
            const paqueteInfo = lote.paquetes_producidos && lote.paquetes_producidos[0];

            return (
              <motion.div
                key={lote.id}
                layout
                className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 sm:p-5 shadow-xl transition-all space-y-3.5"
              >
                {/* Main Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 font-mono font-bold text-xs">
                      {lote.id}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">{lote.producto}</h3>

                        {/* Status Pill */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isEmpacado
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {isEmpacado ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Almacén 2 (Empacado)</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Almacén 1 (En proceso)</span>
                            </>
                          )}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-zinc-500" />
                          {getDeptoNombre(lote.departamento_id)}
                        </span>
                        {lote.created_at && (
                          <span className="text-zinc-500 flex items-center gap-1 font-mono text-[10px]">
                            <Calendar className="w-3 h-3" />
                            {new Date(lote.created_at).toLocaleDateString('es-BO', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right Action: Confirm Empaque */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isEmpacado ? (
                      <button
                        onClick={() => handleConfirmar(lote.id)}
                        disabled={processingId === lote.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {processingId === lote.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Confirmar Empaque</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Empacado y Listo</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Batch Metrics Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Lotes Producidos</span>
                    <span className="font-mono font-bold text-zinc-200">
                      {lote.lotes_producidos} {lote.lotes_producidos === 1 ? 'tanda' : 'tandas'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Bandejas / Bolas</span>
                    <span className="font-mono font-bold text-zinc-200">
                      {lote.total_bandejas} band. ({lote.total_bolas} bol.)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Paquetes Producidos</span>
                    <span className="font-mono font-bold text-indigo-300">
                      {paqueteInfo ? `${paqueteInfo.cantidad} paq. (${paqueteInfo.gramaje}g)` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Costo Total Materia Prima</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {Number(lote.costo_lote || 0).toFixed(2)} Bs.
                    </span>
                  </div>
                </div>

                {/* Expandable Used Ingredients Accordion */}
                {lote.ingredientes_usados && lote.ingredientes_usados.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <button
                      onClick={() => setExpandedLoteId(isExpanded ? null : lote.id)}
                      className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-0.5 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Ver desglose de {lote.ingredientes_usados.length} insumos consumidos</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2.5 space-y-1.5 overflow-hidden"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {lote.ingredientes_usados.map((ing, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px]"
                              >
                                <span className="font-medium text-zinc-300">{ing.nombre}</span>
                                <div className="text-right font-mono">
                                  <span className="text-zinc-400 mr-2">
                                    {Number(ing.cantidad).toFixed(2)} {ing.unidad}
                                  </span>
                                  <span className="text-emerald-400 font-bold">
                                    {Number(ing.costo || 0).toFixed(2)} Bs.
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
