import React, { useState, useMemo } from 'react';
import { FormulaItem, DepartamentoItem, InsumoItem, LoteItem, ViewType } from '../../types';
import { PlayCircle, CheckCircle2, AlertTriangle, Scale, Layers, Box, Building2, Calculator, Sparkles, ArrowRight, Warehouse, TrendingUp, TrendingDown, HelpCircle, AlertCircle, Info, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CostWarningModal, AnomaliaCosto } from '../CostWarningModal';

interface ProduccionViewProps {
  formulas: FormulaItem[];
  departamentos: DepartamentoItem[];
  inventario: InsumoItem[];
  lotes?: LoteItem[];
  onNavigate?: (view: ViewType) => void;
  onOpenShareLink?: () => void;
  onEjecutarProduccion: (params: {
    formulaId: string;
    cantLotes: number;
    deptoId: string;
    presIdx: number;
  }) => Promise<void>;
}

export const ProduccionView: React.FC<ProduccionViewProps> = ({
  formulas,
  departamentos,
  inventario,
  lotes = [],
  onNavigate,
  onOpenShareLink,
  onEjecutarProduccion,
}) => {
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('');
  const [cantLotes, setCantLotes] = useState<number>(1);
  const [selectedDeptoId, setSelectedDeptoId] = useState<string>('');
  const [selectedPresIdx, setSelectedPresIdx] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State for the cost deviation warning modal
  const [isCostWarningOpen, setIsCostWarningOpen] = useState(false);

  // Pick first formula and department by default if available
  const selectedFormula = useMemo(() => {
    return formulas.find((f) => f.id === selectedFormulaId) || formulas[0] || null;
  }, [formulas, selectedFormulaId]);

  // Sync formula selection
  const formulaId = selectedFormula ? selectedFormula.id : '';
  const selectedDepto = useMemo(() => {
    return departamentos.find((d) => d.id === selectedDeptoId) || departamentos[0] || null;
  }, [departamentos, selectedDeptoId]);
  const deptoId = selectedDepto ? (selectedDepto.id || selectedDepto.slug) : '';

  const selectedPresentacion = useMemo(() => {
    if (!selectedFormula || !selectedFormula.presentaciones || selectedFormula.presentaciones.length === 0) {
      return null;
    }
    return selectedFormula.presentaciones[selectedPresIdx] || selectedFormula.presentaciones[0];
  }, [selectedFormula, selectedPresIdx]);

  // Real-time calculations
  const calcData = useMemo(() => {
    if (!selectedFormula || !selectedPresentacion) {
      return {
        totalBandejas: 0,
        totalBolas: 0,
        maxPaquetes: 0,
        costoEstimado: 0,
        stockChecks: [],
        hasFaltantes: false,
      };
    }

    const totalBandejas = (selectedFormula.bandejas_por_lote || 1) * Math.max(1, cantLotes);
    const totalBolas = (selectedFormula.bolas_por_bandeja || 1) * totalBandejas;
    const maxPaquetes = Math.floor(totalBolas / (selectedPresentacion.bolas_por_paquete || 1));

    let costoEstimado = 0;
    let hasFaltantes = false;

    const stockChecks = (selectedFormula.ingredientes || []).map((ing) => {
      const necesario = ing.cantidad_necesaria * totalBandejas;
      const item = inventario.find((i) => i.id === ing.id);
      const stockDisponible = item ? item.cantidad : 0;
      const costoUnitario = item ? (item.costo_unitario || 0) : 0;
      const subtotalCosto = necesario * costoUnitario;
      costoEstimado += subtotalCosto;

      const isSufficient = stockDisponible >= necesario;
      if (!isSufficient) hasFaltantes = true;

      return {
        id: ing.id,
        nombre: item ? item.nombre : ing.id,
        unidad: item ? item.unidad : '',
        necesario,
        stockDisponible,
        falta: Math.max(0, necesario - stockDisponible),
        isSufficient,
        costoUnitario,
        subtotalCosto,
      };
    });

    return {
      totalBandejas,
      totalBolas,
      maxPaquetes,
      costoEstimado,
      stockChecks,
      hasFaltantes,
    };
  }, [selectedFormula, selectedPresentacion, cantLotes, inventario]);

  // Historical cost analysis and anomaly detection
  const costAnalysis = useMemo(() => {
    if (!selectedFormula) {
      return {
        anomalias: [] as AnomaliaCosto[],
        hasAnomalias: false,
        costoHistoricoPromedioPorTanda: null as number | null,
        desviacionTandaPct: null as number | null,
        detallesInsumos: [] as Array<{
          id: string;
          nombre: string;
          unidad: string;
          costoUnitario: number;
          costoHistorico: number | null;
          variacionPct: number | null;
          tipo: 'alto' | 'bajo' | 'cero' | 'normal' | 'sin_historico';
        }>,
      };
    }

    // 1. Calculate historical batch average for this formula from past lotes
    const lotesFormula = lotes.filter(
      (l) => l.producto?.toLowerCase().trim() === selectedFormula.nombre?.toLowerCase().trim()
    );

    let costoHistoricoPromedioPorTanda: number | null = null;
    let desviacionTandaPct: number | null = null;

    if (lotesFormula.length > 0) {
      const totalCostoHist = lotesFormula.reduce((acc, l) => acc + (l.costo_lote || 0), 0);
      const totalTandasHist = lotesFormula.reduce((acc, l) => acc + Math.max(1, l.lotes_producidos || 1), 0);
      if (totalTandasHist > 0) {
        costoHistoricoPromedioPorTanda = totalCostoHist / totalTandasHist;
        const costoActualPorTanda = calcData.costoEstimado / Math.max(1, cantLotes);
        if (costoHistoricoPromedioPorTanda > 0) {
          desviacionTandaPct =
            ((costoActualPorTanda - costoHistoricoPromedioPorTanda) / costoHistoricoPromedioPorTanda) * 100;
        }
      }
    }

    // 2. Calculate historical unit cost for each ingredient across all previous lots
    const anomalias: AnomaliaCosto[] = [];
    const detallesInsumos = calcData.stockChecks.map((item) => {
      let totalGastoInsumo = 0;
      let totalCantInsumo = 0;

      lotes.forEach((l) => {
        (l.ingredientes_usados || []).forEach((ing) => {
          if (
            ing.nombre?.toLowerCase().trim() === item.nombre?.toLowerCase().trim() ||
            (ing as any).id === item.id
          ) {
            totalGastoInsumo += Number(ing.costo || 0);
            totalCantInsumo += Number(ing.cantidad || 0);
          }
        });
      });

      const costoHistorico = totalCantInsumo > 0 ? totalGastoInsumo / totalCantInsumo : null;
      let variacionPct: number | null = null;
      let tipo: 'alto' | 'bajo' | 'cero' | 'normal' | 'sin_historico' = 'normal';

      if (item.costoUnitario === 0) {
        tipo = 'cero';
      } else if (costoHistorico !== null && costoHistorico > 0) {
        variacionPct = ((item.costoUnitario - costoHistorico) / costoHistorico) * 100;
        // Flag as anomaly if deviation is >= 20% or <= -20%
        if (variacionPct >= 20) {
          tipo = 'alto';
        } else if (variacionPct <= -20) {
          tipo = 'bajo';
        } else {
          tipo = 'normal';
        }
      } else {
        tipo = 'sin_historico';
      }

      if (tipo === 'alto' || tipo === 'bajo' || tipo === 'cero') {
        anomalias.push({
          insumoId: item.id,
          nombre: item.nombre,
          unidad: item.unidad,
          costoActual: item.costoUnitario,
          costoHistorico,
          variacionPct,
          tipo,
          impactoTotal: item.subtotalCosto,
          cantidadNecesaria: item.necesario,
        });
      }

      return {
        id: item.id,
        nombre: item.nombre,
        unidad: item.unidad,
        costoUnitario: item.costoUnitario,
        costoHistorico,
        variacionPct,
        tipo,
      };
    });

    const hasBatchDeviation = desviacionTandaPct !== null && Math.abs(desviacionTandaPct) >= 20;
    const hasAnomalias = anomalias.length > 0 || hasBatchDeviation;

    return {
      anomalias,
      hasAnomalias,
      costoHistoricoPromedioPorTanda,
      desviacionTandaPct,
      detallesInsumos,
    };
  }, [selectedFormula, lotes, calcData, cantLotes]);

  // Actual execution after validation / user confirmation
  const executeProduction = async () => {
    if (!selectedFormula) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onEjecutarProduccion({
        formulaId: selectedFormula.id,
        cantLotes: Math.max(1, cantLotes),
        deptoId: deptoId,
        presIdx: selectedPresIdx,
      });
      // Reset lotes count & close modal
      setCantLotes(1);
      setIsCostWarningOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al ejecutar la producción');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedFormula) {
      setErrorMsg('Debe seleccionar una fórmula válida.');
      return;
    }
    if (!deptoId) {
      setErrorMsg('Debe seleccionar un departamento.');
      return;
    }
    if (!selectedPresentacion || calcData.maxPaquetes === 0) {
      setErrorMsg('No alcanzan las bolas para generar al menos un paquete.');
      return;
    }
    if (calcData.hasFaltantes) {
      setErrorMsg('No hay suficiente stock de insumos para procesar este lote.');
      return;
    }

    // Check if there are cost anomalies to show warning dialog before executing
    if (costAnalysis.hasAnomalias) {
      setIsCostWarningOpen(true);
      return;
    }

    // No anomalies, execute directly
    await executeProduction();
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Planificador de Producción</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configura y simula el cálculo automático de bandejas, bolas, paquetes y verificación de stock con control inteligente de costos.
          </p>
        </div>

        {onOpenShareLink && (
          <button
            type="button"
            onClick={onOpenShareLink}
            className="px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Compartir Enlace a Empleados</span>
          </button>
        )}
      </div>

      {formulas.length === 0 || departamentos.length === 0 ? (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400 space-y-3">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Configuración Inicial Requerida</h3>
          <p className="text-xs max-w-md mx-auto text-zinc-400">
            Para iniciar una orden de producción necesitas tener registradas al menos una fórmula y un departamento.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Form Configuration */}
          <div className="lg:col-span-6 space-y-4 bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl shadow-xl">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              Parámetros de la Orden
            </h3>

            {/* Select Formula */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Fórmula / Producto a Producir *
              </label>
              <select
                value={selectedFormulaId || (selectedFormula ? selectedFormula.id : '')}
                onChange={(e) => {
                  setSelectedFormulaId(e.target.value);
                  setSelectedPresIdx(0);
                }}
                className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {formulas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre} ({f.bandejas_por_lote} band/lote • {f.bolas_por_bandeja} bol/band)
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Batches & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Cantidad Lotes *
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCantLotes(Math.max(1, cantLotes - 1))}
                    className="px-2.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-l-xl border-y border-l border-zinc-700 text-xs font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cantLotes}
                    onChange={(e) => setCantLotes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full text-center py-2.5 bg-zinc-950/80 border-y border-zinc-700 text-xs text-white font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCantLotes(cantLotes + 1)}
                    className="px-2.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-r-xl border-y border-r border-zinc-700 text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Departamento *
                </label>
                <select
                  value={selectedDeptoId || deptoId}
                  onChange={(e) => setSelectedDeptoId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {departamentos.map((d) => (
                    <option key={d.id || d.slug} value={d.id || d.slug}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Packaging Presentation */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Presentación de Empaque *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedFormula?.presentaciones?.map((pres, idx) => {
                  const isSelected = selectedPresIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPresIdx(idx)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-inner'
                          : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{pres.gramaje} Gramos</span>
                        <Scale className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-zinc-600'}`} />
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                        {pres.bolas_por_paquete} bolas / paquete
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 whitespace-pre-line">{errorMsg}</div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Calculated Yield, Cost Intelligence & Stock Availability */}
          <div className="lg:col-span-6 space-y-4">
            {/* Live Yield Summary Cards */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-400" />
                  Rendimiento y Costos Calculados
                </h3>

                {/* Batch Cost comparison pill if historical data exists */}
                {costAnalysis.desviacionTandaPct !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono flex items-center gap-1 border ${
                      costAnalysis.desviacionTandaPct >= 20
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : costAnalysis.desviacionTandaPct <= -20
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {costAnalysis.desviacionTandaPct >= 20 ? (
                      <>
                        <TrendingUp className="w-3 h-3" />
                        +{costAnalysis.desviacionTandaPct.toFixed(1)}% vs Prom.
                      </>
                    ) : costAnalysis.desviacionTandaPct <= -20 ? (
                      <>
                        <TrendingDown className="w-3 h-3" />
                        {costAnalysis.desviacionTandaPct.toFixed(1)}% vs Prom.
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Costo Normal ({costAnalysis.desviacionTandaPct > 0 ? '+' : ''}{costAnalysis.desviacionTandaPct.toFixed(1)}%)
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-medium">Bandejas</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-indigo-300">
                    {calcData.totalBandejas}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-medium">Bolas Totales</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-indigo-300">
                    {calcData.totalBolas}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                  <span className="text-[10px] text-indigo-300 block font-bold">Paquetes Finales</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-white">
                    {calcData.maxPaquetes}
                  </span>
                </div>
              </div>

              {/* Total Estimated Cost Bar */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-zinc-400 block">Costo Estimado de Materia Prima:</span>
                    {costAnalysis.costoHistoricoPromedioPorTanda !== null && (
                      <span className="text-[11px] text-zinc-500 block font-mono">
                        Promedio histórico: {(costAnalysis.costoHistoricoPromedioPorTanda * cantLotes).toFixed(2)} Bs. ({(costAnalysis.costoHistoricoPromedioPorTanda).toFixed(2)} Bs./tanda)
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white text-base block">
                      {calcData.costoEstimado.toFixed(2)} Bs.
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 block">
                      ({(calcData.costoEstimado / Math.max(1, cantLotes)).toFixed(2)} Bs./tanda)
                    </span>
                  </div>
                </div>

                {/* Pre-warning banner if anomalies exist */}
                {costAnalysis.hasAnomalias && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-300"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-[11px]">
                        <strong>Variación de costos:</strong> {costAnalysis.anomalias.length} insumo(s) con costo inusual.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCostWarningOpen(true)}
                      className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-bold border border-amber-500/40 transition-colors cursor-pointer shrink-0"
                    >
                      Revisar Alerta
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Required Stock Verification with Cost Status Badges */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Verificación de Insumos y Costos
                </h3>
                {calcData.hasFaltantes ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Stock Insuficiente
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Stock Completo
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {calcData.stockChecks.map((item) => {
                  const detalleInsumo = costAnalysis.detallesInsumos.find((d) => d.id === item.id);
                  const isHigh = detalleInsumo?.tipo === 'alto';
                  const isLow = detalleInsumo?.tipo === 'bajo';
                  const isZero = detalleInsumo?.tipo === 'cero';

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border text-xs transition-colors ${
                        !item.isSufficient
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                          : isHigh
                          ? 'bg-rose-950/20 border-rose-500/30 text-zinc-300'
                          : isLow
                          ? 'bg-cyan-950/20 border-cyan-500/30 text-zinc-300'
                          : isZero
                          ? 'bg-amber-950/20 border-amber-500/30 text-zinc-300'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-white">{item.nombre}</span>

                            {/* Individual Cost Badges */}
                            {isHigh && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5">
                                <TrendingUp className="w-2.5 h-2.5" />
                                +{detalleInsumo?.variacionPct?.toFixed(0)}%
                              </span>
                            )}
                            {isLow && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-0.5">
                                <TrendingDown className="w-2.5 h-2.5" />
                                {detalleInsumo?.variacionPct?.toFixed(0)}%
                              </span>
                            )}
                            {isZero && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                0.00 Bs
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            <span>Disp: {item.stockDisponible} {item.unidad}</span>
                            <span>•</span>
                            <span className="font-mono">
                              {item.costoUnitario > 0 ? `${item.costoUnitario.toFixed(2)} Bs./${item.unidad}` : 'Sin costo unitario'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold block text-zinc-200">
                            -{item.necesario.toFixed(2)} {item.unidad}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-400 block">
                            {item.subtotalCosto.toFixed(2)} Bs.
                          </span>
                          {!item.isSufficient && (
                            <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                              Faltan: {item.falta.toFixed(2)} {item.unidad}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Execution Button */}
              <button
                type="submit"
                disabled={isProcessing || calcData.hasFaltantes || calcData.maxPaquetes === 0}
                className={`w-full mt-4 py-3 px-4 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  costAnalysis.hasAnomalias
                    ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 shadow-amber-600/25'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-600/25'
                } disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed`}
              >
                {isProcessing ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Descontando Stock y Creando Lote...</span>
                  </span>
                ) : costAnalysis.hasAnomalias ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Revisar y Enviar a Almacén 1 (En proceso)</span>
                  </>
                ) : (
                  <>
                    <span>Procesar y Enviar a Almacén 1 (En proceso)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Cost Deviation Warning Modal */}
      <CostWarningModal
        isOpen={isCostWarningOpen}
        onClose={() => setIsCostWarningOpen(false)}
        onConfirm={executeProduction}
        onGoToInventario={onNavigate ? () => onNavigate('inventario') : undefined}
        formulaNombre={selectedFormula ? selectedFormula.nombre : ''}
        cantLotes={cantLotes}
        costoTotalActual={calcData.costoEstimado}
        costoHistoricoPromedioPorTanda={costAnalysis.costoHistoricoPromedioPorTanda}
        desviacionTandaPct={costAnalysis.desviacionTandaPct}
        anomalias={costAnalysis.anomalias}
        isProcessing={isProcessing}
      />
    </div>
  );
};


