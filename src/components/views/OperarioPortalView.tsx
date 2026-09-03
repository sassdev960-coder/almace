import React, { useState, useMemo, useEffect } from 'react';
import { FormulaItem, DepartamentoItem, InsumoItem, LoteItem } from '../../types';
import {
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Layers,
  Box,
  Building2,
  Calculator,
  Sparkles,
  ArrowRight,
  Clock,
  RefreshCw,
  Lock,
  Search,
  Check,
  Plus,
  Minus,
  ChefHat,
  Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OperarioPortalViewProps {
  formulas: FormulaItem[];
  departamentos: DepartamentoItem[];
  inventario: InsumoItem[];
  lotes: LoteItem[];
  initialDepto?: string;
  onRefresh: () => void;
  isLoading: boolean;
  onSwitchToAdmin: () => void;
  onEjecutarProduccion: (params: {
    formulaId: string;
    cantLotes: number;
    deptoId: string;
    presIdx: number;
  }) => Promise<void>;
}

export const OperarioPortalView: React.FC<OperarioPortalViewProps> = ({
  formulas,
  departamentos,
  inventario,
  lotes,
  initialDepto,
  onRefresh,
  isLoading,
  onSwitchToAdmin,
  onEjecutarProduccion,
}) => {
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('');
  const [cantLotes, setCantLotes] = useState<number>(1);
  const [selectedDeptoId, setSelectedDeptoId] = useState<string>('');
  const [selectedPresIdx, setSelectedPresIdx] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Preselect formula & department
  useEffect(() => {
    if (formulas.length > 0 && !selectedFormulaId) {
      setSelectedFormulaId(formulas[0].id);
    }
  }, [formulas, selectedFormulaId]);

  useEffect(() => {
    if (initialDepto) {
      const match = departamentos.find(
        (d) => d.id === initialDepto || d.slug === initialDepto || d.nombre.toLowerCase() === initialDepto.toLowerCase()
      );
      if (match) {
        setSelectedDeptoId(match.id || match.slug);
        return;
      }
    }
    if (departamentos.length > 0 && !selectedDeptoId) {
      setSelectedDeptoId(departamentos[0].id || departamentos[0].slug);
    }
  }, [departamentos, initialDepto, selectedDeptoId]);

  const selectedFormula = useMemo(() => {
    return formulas.find((f) => f.id === selectedFormulaId) || formulas[0] || null;
  }, [formulas, selectedFormulaId]);

  const selectedDepto = useMemo(() => {
    return (
      departamentos.find((d) => d.id === selectedDeptoId || d.slug === selectedDeptoId) ||
      departamentos[0] ||
      null
    );
  }, [departamentos, selectedDeptoId]);

  const selectedPresentacion = useMemo(() => {
    if (!selectedFormula || !selectedFormula.presentaciones || selectedFormula.presentaciones.length === 0) {
      return null;
    }
    return selectedFormula.presentaciones[selectedPresIdx] || selectedFormula.presentaciones[0];
  }, [selectedFormula, selectedPresIdx]);

  // Production Calculations
  const totalBandejas = useMemo(() => {
    if (!selectedFormula) return 0;
    return (selectedFormula.bandejas_por_lote || 1) * Math.max(1, cantLotes);
  }, [selectedFormula, cantLotes]);

  const totalBolas = useMemo(() => {
    if (!selectedFormula) return 0;
    return (selectedFormula.bolas_por_bandeja || 1) * totalBandejas;
  }, [selectedFormula, totalBandejas]);

  const totalPaquetes = useMemo(() => {
    if (!selectedPresentacion || !selectedPresentacion.bolas_por_paquete) return 0;
    return Math.floor(totalBolas / selectedPresentacion.bolas_por_paquete);
  }, [totalBolas, selectedPresentacion]);

  // Insumos calculation & stock checking
  const insumosCalculados = useMemo(() => {
    if (!selectedFormula || !selectedFormula.ingredientes) return [];

    return selectedFormula.ingredientes.map((ing) => {
      const itemInventario = inventario.find((i) => i.id === ing.id);
      const necesario = ing.cantidad_necesaria * totalBandejas;
      const stockActual = itemInventario ? itemInventario.cantidad : 0;
      const suficiente = stockActual >= necesario;
      const faltante = suficiente ? 0 : necesario - stockActual;

      return {
        id: ing.id,
        nombre: ing.nombre || (itemInventario ? itemInventario.nombre : ing.id),
        cantidadNecesaria: necesario,
        unidad: ing.unidad || (itemInventario ? itemInventario.unidad : ''),
        stockActual,
        suficiente,
        faltante,
      };
    });
  }, [selectedFormula, totalBandejas, inventario]);

  const hayStockSuficiente = useMemo(() => {
    return insumosCalculados.every((i) => i.suficiente);
  }, [insumosCalculados]);

  // Handle execution
  const handleRegistrar = async () => {
    if (!selectedFormula || !selectedDepto) return;
    if (!hayStockSuficiente) {
      setErrorMsg('No hay suficiente stock en inventario para procesar esta cantidad.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onEjecutarProduccion({
        formulaId: selectedFormula.id,
        cantLotes: Math.max(1, cantLotes),
        deptoId: selectedDepto.id || selectedDepto.slug,
        presIdx: selectedPresIdx,
      });
      setCantLotes(1);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al registrar producción.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Recent batches of today
  const recentLotes = useMemo(() => {
    return lotes.slice(0, 5);
  }, [lotes]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-12">
      {/* Top Mobile-Friendly Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20 shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">Registro de Producción</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Modo Operario
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Terminal para personal de planta</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Actualizar datos"
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={onSwitchToAdmin}
              title="Ir al panel de administración"
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden xs:inline">Administrador</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Production Form Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Nueva Orden de Horneada / Tanda</h2>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="whitespace-pre-line">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Formula Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Producto / Fórmula a Producir *
              </label>
              <select
                value={selectedFormulaId}
                onChange={(e) => {
                  setSelectedFormulaId(e.target.value);
                  setSelectedPresIdx(0);
                }}
                className="w-full px-3.5 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
              >
                {formulas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre} ({f.bolas_por_bandeja || 1} bol/band - {f.bandejas_por_lote || 1} band/tanda)
                  </option>
                ))}
              </select>
            </div>

            {/* Department & Batch Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Batches with Big +/- Controls */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Cantidad de Tandas / Lotes *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCantLotes((c) => Math.max(1, c - 1))}
                    className="w-11 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white flex items-center justify-center font-bold text-lg cursor-pointer border border-zinc-700 shrink-0 select-none"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={cantLotes}
                    onChange={(e) => setCantLotes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-center py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-base font-bold font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCantLotes((c) => c + 1)}
                    className="w-11 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white flex items-center justify-center font-bold text-lg cursor-pointer border border-zinc-700 shrink-0 select-none"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Línea / Departamento *</span>
                </label>
                <select
                  value={selectedDeptoId}
                  onChange={(e) => setSelectedDeptoId(e.target.value)}
                  className="w-full px-3.5 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
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
            {selectedFormula && selectedFormula.presentaciones && selectedFormula.presentaciones.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Presentación de Empaque Final
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedFormula.presentaciones.map((pres, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPresIdx(idx)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedPresIdx === idx
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs block text-white">{pres.gramaje} gramos</span>
                        <span className="text-[11px] text-zinc-400">{pres.bolas_por_paquete} bolas / paquete</span>
                      </div>
                      {selectedPresIdx === idx && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Production Yield Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-center">
              <div>
                <span className="text-[10px] text-zinc-400 block font-medium">Bandejas Totales</span>
                <span className="text-base sm:text-lg font-bold font-mono text-white">{totalBandejas}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-medium">Bolas Totales</span>
                <span className="text-base sm:text-lg font-bold font-mono text-white">{totalBolas}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-medium">Paquetes Estimados</span>
                <span className="text-base sm:text-lg font-bold font-mono text-indigo-300">{totalPaquetes}</span>
              </div>
            </div>

            {/* Ingredients Check List */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Insumos Necesarios para esta Orden</span>
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    hayStockSuficiente
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {hayStockSuficiente ? 'Stock Disponible' : 'Stock Insuficiente'}
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {insumosCalculados.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      item.suficiente
                        ? 'bg-zinc-950/80 border-zinc-800/80'
                        : 'bg-rose-950/20 border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.suficiente ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-zinc-200 block">{item.nombre}</span>
                        <span className="text-[10px] text-zinc-400">
                          Stock actual: {Number(item.stockActual).toFixed(2)} {item.unidad}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-zinc-200 font-bold block">
                        {Number(item.cantidadNecesaria).toFixed(2)} {item.unidad}
                      </span>
                      {!item.suficiente && (
                        <span className="text-[10px] text-rose-400 font-medium">
                          Faltan {Number(item.faltante).toFixed(2)} {item.unidad}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Big Action Button */}
            <button
              onClick={handleRegistrar}
              disabled={isProcessing || !hayStockSuficiente}
              className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registrando en Sistema...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  <span>Registrar Producción ({cantLotes} {cantLotes === 1 ? 'Tanda' : 'Tandas'})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent Batches List */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Últimos Lotes Registrados en Planta</span>
            </h3>
            <span className="text-[10px] text-zinc-500">Almacén 1 (En proceso)</span>
          </div>

          {recentLotes.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No hay registros recientes hoy.</p>
          ) : (
            <div className="space-y-2">
              {recentLotes.map((lote) => (
                <div
                  key={lote.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-indigo-400 text-xs bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {lote.id}
                    </span>
                    <div>
                      <span className="font-semibold text-white block">{lote.producto}</span>
                      <span className="text-[10px] text-zinc-400">
                        {lote.lotes_producidos} {lote.lotes_producidos === 1 ? 'tanda' : 'tandas'} ({lote.total_bandejas} bandejas)
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      lote.estado === 'almacen2'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {lote.estado === 'almacen2' ? 'Empacado' : 'Almacén 1'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
