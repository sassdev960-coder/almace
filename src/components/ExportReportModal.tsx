import React, { useState } from 'react';
import { InsumoItem, LoteItem, DepartamentoItem, FormulaItem } from '../types';
import { generateOperationalPDFReport, ReportOptions } from '../lib/pdfReportGenerator';
import {
  FileText,
  Download,
  X,
  CheckCircle2,
  Filter,
  Layers,
  Box,
  Building2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventario: InsumoItem[];
  lotes: LoteItem[];
  departamentos: DepartamentoItem[];
  formulas?: FormulaItem[];
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  inventario,
  lotes,
  departamentos,
  formulas,
  onShowToast,
}) => {
  const [includeInventario, setIncludeInventario] = useState(true);
  const [includeLotes, setIncludeLotes] = useState(true);
  const [filtroEstadoLote, setFiltroEstadoLote] = useState<'todos' | 'almacen1' | 'almacen2'>('todos');
  const [filtroDepartamentoId, setFiltroDepartamentoId] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Compute preview metrics
  const valorTotalInventario = inventario.reduce(
    (acc, i) => acc + (Number(i.cantidad) || 0) * (Number(i.costo_unitario) || 0),
    0
  );

  const lotesFiltrados = lotes.filter((l) => {
    if (filtroEstadoLote !== 'todos' && l.estado !== filtroEstadoLote) return false;
    if (filtroDepartamentoId !== 'all') {
      if (
        l.departamento_id !== filtroDepartamentoId &&
        !departamentos.find(
          (d) =>
            (d.id === filtroDepartamentoId || d.slug === filtroDepartamentoId) &&
            (l.departamento_id === d.id || l.departamento_id === d.slug)
        )
      ) {
        return false;
      }
    }
    return true;
  });

  const handleExport = async () => {
    if (!includeInventario && !includeLotes) {
      if (onShowToast) {
        onShowToast('warning', 'Selecciona al menos una sección para incluir en el reporte PDF.', 'Secciones vacías');
      }
      return;
    }

    try {
      setIsGenerating(true);
      // Short delay so button state renders
      await new Promise((resolve) => setTimeout(resolve, 300));

      const result = generateOperationalPDFReport({
        inventario,
        lotes,
        departamentos,
        formulas,
        options: {
          includeInventario,
          includeLotes,
          filtroEstadoLote,
          filtroDepartamentoId,
        },
      });

      if (onShowToast) {
        onShowToast(
          'success',
          `El archivo ${result.filename} se ha descargado correctamente para auditoría física.`,
          'Reporte PDF Generado'
        );
      }
      onClose();
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast('error', 'Ocurrió un error al compilar el documento PDF.', 'Error de Exportación');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePresetSelect = (preset: 'completo' | 'inventario' | 'lotes') => {
    if (preset === 'completo') {
      setIncludeInventario(true);
      setIncludeLotes(true);
      setFiltroEstadoLote('todos');
      setFiltroDepartamentoId('all');
    } else if (preset === 'inventario') {
      setIncludeInventario(true);
      setIncludeLotes(false);
    } else if (preset === 'lotes') {
      setIncludeInventario(false);
      setIncludeLotes(true);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Exportar Reporte PDF para Control Físico
                </h3>
                <p className="text-xs text-zinc-400">
                  Descarga un informe listo para impresión y cotejo manual en planta.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto py-4 space-y-4 pr-1">
            {/* Quick Presets */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-2 block">
                Plantillas rápidas:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetSelect('completo')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    includeInventario && includeLotes
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-bold block truncate">Completo</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Inv. + Lotes</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('inventario')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    includeInventario && !includeLotes
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-bold block truncate">Solo Inventario</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Hojas de conteo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('lotes')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    !includeInventario && includeLotes
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-bold block truncate">Solo Lotes</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Almacén 1 & 2</span>
                </button>
              </div>
            </div>

            {/* Section Toggles */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-3">
              <label className="text-xs font-semibold text-zinc-300 block">
                Secciones incluidas en el documento:
              </label>

              {/* Toggle Inventario */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeInventario}
                  onChange={(e) => setIncludeInventario(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Inventario y Materias Primas
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {inventario.length} registros
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Incluye columnas para cotejo manual: stock de sistema, costo, valor total y casillas en blanco para escribir el conteo físico y diferencias.
                  </p>
                </div>
              </label>

              {/* Toggle Lotes */}
              <label className="flex items-start gap-3 cursor-pointer select-none pt-2 border-t border-zinc-800/60">
                <input
                  type="checkbox"
                  checked={includeLotes}
                  onChange={(e) => setIncludeLotes(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-indigo-400" />
                      Estado de Lotes y Trazabilidad
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {lotesFiltrados.length} lote{lotesFiltrados.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Detalle de lotes en proceso (Almacén 1) y empacados (Almacén 2), con conteo de bandejas, bolas, costos y fechas.
                  </p>
                </div>
              </label>
            </div>

            {/* Filter Sub-Options for Lotes */}
            {includeLotes && (
              <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Filtros para los lotes en el reporte:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Estado Lote */}
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Estado de Lotes:</label>
                    <select
                      value={filtroEstadoLote}
                      onChange={(e: any) => setFiltroEstadoLote(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="todos">Todos los Estados (Alm. 1 & 2)</option>
                      <option value="almacen1">Solo Almacén 1 (En proceso)</option>
                      <option value="almacen2">Solo Almacén 2 (Empacados)</option>
                    </select>
                  </div>

                  {/* Departamento */}
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Departamento:</label>
                    <select
                      value={filtroDepartamentoId}
                      onChange={(e) => setFiltroDepartamentoId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="all">Todos los Departamentos</option>
                      {departamentos.map((d) => (
                        <option key={d.id || d.slug} value={d.id || d.slug}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Document Preview Stats */}
            <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>
                  Listo para imprimir en hoja <strong>A4</strong> con espacio de firmas para auditoría.
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-white shrink-0 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
                PDF
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-confirmar-descarga-pdf"
              onClick={handleExport}
              disabled={isGenerating || (!includeInventario && !includeLotes)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Reporte PDF</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
