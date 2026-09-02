import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, TrendingUp, TrendingDown, HelpCircle, ArrowRight, X, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

export interface AnomaliaCosto {
  insumoId: string;
  nombre: string;
  unidad: string;
  costoActual: number;
  costoHistorico: number | null;
  variacionPct: number | null;
  tipo: 'alto' | 'bajo' | 'cero' | 'sin_historico';
  impactoTotal: number;
  cantidadNecesaria: number;
}

interface CostWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onGoToInventario?: () => void;
  formulaNombre: string;
  cantLotes: number;
  costoTotalActual: number;
  costoHistoricoPromedioPorTanda: number | null;
  desviacionTandaPct: number | null;
  anomalias: AnomaliaCosto[];
  isProcessing: boolean;
}

export const CostWarningModal: React.FC<CostWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onGoToInventario,
  formulaNombre,
  cantLotes,
  costoTotalActual,
  costoHistoricoPromedioPorTanda,
  desviacionTandaPct,
  anomalias,
  isProcessing,
}) => {
  if (!isOpen) return null;

  const costoActualPorTanda = costoTotalActual / Math.max(1, cantLotes);
  const tieneAltos = anomalias.some((a) => a.tipo === 'alto');
  const tieneBajos = anomalias.some((a) => a.tipo === 'bajo');
  const tieneCero = anomalias.some((a) => a.tipo === 'cero');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-zinc-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 text-left"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Advertencia de Desviación de Costos</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Confirmación Requerida
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Se detectaron insumos con costos <strong className="text-zinc-200">inusualmente diferentes</strong> a su promedio histórico o sin costo registrado para la fórmula <strong className="text-amber-200">{formulaNombre}</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Top comparison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">Costo Actual de la Orden</span>
                  <span className="text-[10px] font-mono text-zinc-500">{cantLotes} {cantLotes === 1 ? 'tanda' : 'tandas'}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-bold font-mono text-white">
                    {costoTotalActual.toFixed(2)} Bs.
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    ({costoActualPorTanda.toFixed(2)} Bs./tanda)
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">Histórico de Fórmula</span>
                  {desviacionTandaPct !== null && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full font-mono flex items-center gap-1 ${
                        desviacionTandaPct > 0
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          : desviacionTandaPct < 0
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      {desviacionTandaPct > 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          +{desviacionTandaPct.toFixed(1)}%
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          {desviacionTandaPct.toFixed(1)}%
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  {costoHistoricoPromedioPorTanda !== null ? (
                    <span className="text-lg font-bold font-mono text-zinc-300">
                      {(costoHistoricoPromedioPorTanda * cantLotes).toFixed(2)} Bs.
                      <span className="text-xs font-mono text-zinc-500 font-normal ml-1.5">
                        ({costoHistoricoPromedioPorTanda.toFixed(2)} Bs./tanda)
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">Primer lote registrado de esta fórmula</span>
                  )}
                </div>
              </div>
            </div>

            {/* Insumos Breakdown with Anomalies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Detalle de Insumos con Variación Inusual ({anomalias.length})</span>
                </h4>
                <div className="flex items-center gap-1 text-[10px]">
                  {tieneAltos && <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">📈 Alto</span>}
                  {tieneBajos && <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">📉 Bajo</span>}
                  {tieneCero && <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">⚠️ 0.00 Bs</span>}
                </div>
              </div>

              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60 divide-y divide-zinc-800/60">
                {anomalias.map((anom) => {
                  const isHigh = anom.tipo === 'alto';
                  const isLow = anom.tipo === 'bajo';
                  const isZero = anom.tipo === 'cero';

                  return (
                    <div key={anom.insumoId} className="p-3 hover:bg-zinc-900/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{anom.nombre}</span>
                            {isHigh && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-mono">
                                <TrendingUp className="w-3 h-3" />
                                +{anom.variacionPct?.toFixed(1)}% Inusualmente Alto
                              </span>
                            )}
                            {isLow && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-mono">
                                <TrendingDown className="w-3 h-3" />
                                {anom.variacionPct?.toFixed(1)}% Inusualmente Bajo
                              </span>
                            )}
                            {isZero && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Sin Costo Registrado (0.00 Bs.)
                              </span>
                            )}
                            {anom.tipo === 'sin_historico' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-700/50 text-zinc-300 border border-zinc-600 flex items-center gap-1">
                                <HelpCircle className="w-3 h-3" />
                                Sin Histórico Previo
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            Uso requerido: <span className="text-zinc-200 font-mono font-medium">{anom.cantidadNecesaria.toFixed(2)} {anom.unidad}</span>
                            {' • '}
                            Impacto en la orden: <span className="text-zinc-200 font-mono font-bold">{anom.impactoTotal.toFixed(2)} Bs.</span>
                          </p>
                        </div>

                        {/* Cost comparison values */}
                        <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-center">
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-500 block uppercase font-sans">Costo Actual</span>
                            <span className={`font-bold ${isHigh ? 'text-rose-300' : isLow ? 'text-cyan-300' : isZero ? 'text-amber-300' : 'text-white'}`}>
                              {anom.costoActual.toFixed(2)} Bs. / {anom.unidad}
                            </span>
                          </div>

                          <div className="text-right border-l border-zinc-800 pl-3">
                            <span className="text-[10px] text-zinc-500 block uppercase font-sans">Promedio Histórico</span>
                            <span className="text-zinc-400">
                              {anom.costoHistorico !== null ? `${anom.costoHistorico.toFixed(2)} Bs. / ${anom.unidad}` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Advisory info */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-100">¿Deseas verificar el inventario antes de continuar?</p>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Si este costo fue un error de tipeo al ingresar la factura en inventario, puedes cancelar ahora y corregirlo en la sección de Inventario para mantener los cálculos contables exactos.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Cancelar y Revisar
              </button>

              {onGoToInventario && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToInventario();
                  }}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-3.5 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Ir a Inventario
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Procesando...</span>
                </span>
              ) : (
                <>
                  <span>Confirmar y Ejecutar Producción</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
