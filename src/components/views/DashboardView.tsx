import React, { useMemo } from 'react';
import { InsumoItem, FormulaItem, DepartamentoItem, LoteItem, ViewType } from '../../types';
import { Layers, FlaskConical, Box, Building2, PlayCircle, Plus, CheckCircle2, Clock, ChevronRight, AlertTriangle, DollarSign, ArrowUpRight, Activity, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { LotesPorDepartamentoChart } from './LotesPorDepartamentoChart';

interface DashboardViewProps {
  inventario: InsumoItem[];
  formulas: FormulaItem[];
  departamentos: DepartamentoItem[];
  lotes: LoteItem[];
  onNavigate: (view: ViewType) => void;
  onOpenNuevoInsumo: () => void;
  onOpenExportReport?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inventario,
  formulas,
  departamentos,
  lotes,
  onNavigate,
  onOpenNuevoInsumo,
  onOpenExportReport,
}) => {
  const lotesPendientes = lotes.filter((l) => l.estado === 'almacen1');
  const lotesEmpacados = lotes.filter((l) => l.estado === 'almacen2');
  
  // Calculate total inventory value: sum(cantidad * costo_unitario)
  const valorTotalInventario = useMemo(() => {
    return inventario.reduce((acc, i) => acc + ((Number(i.cantidad) || 0) * (Number(i.costo_unitario) || 0)), 0);
  }, [inventario]);

  // Insumos under minimum threshold (<= 5)
  const insumosBajoStock = useMemo(() => {
    return inventario.filter((i) => (Number(i.cantidad) || 0) <= 5);
  }, [inventario]);

  // Department active in-process lot metrics and badges
  const departamentosConLotes = useMemo(() => {
    return departamentos.map((dep) => {
      const lotesDepto = lotes.filter(
        (l) => l.departamento_id === dep.id || l.departamento_id === dep.slug
      );
      const lotesActivos = lotesDepto.filter((l) => l.estado === 'almacen1').length;
      const lotesEmpacados = lotesDepto.filter((l) => l.estado === 'almacen2').length;
      return {
        ...dep,
        totalLotes: lotesDepto.length,
        lotesActivos,
        lotesEmpacados,
      };
    });
  }, [departamentos, lotes]);

  const stats = [
    {
      id: 'valor-inventario',
      label: 'Valor Total Inventario',
      value: `${valorTotalInventario.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`,
      icon: DollarSign,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      view: 'inventario' as ViewType,
      sublabel: `${inventario.length} materias primas valoradas`,
      isCurrency: true,
      highlight: true,
      badge: 'Valorización',
    },
    {
      id: 'bajo-stock',
      label: 'Insumos bajo mínimo',
      value: insumosBajoStock.length,
      icon: AlertTriangle,
      color: insumosBajoStock.length > 0
        ? 'from-rose-500/20 to-amber-500/20 text-amber-400 border-amber-500/30'
        : 'from-zinc-500/20 to-zinc-600/20 text-zinc-400 border-zinc-700/30',
      view: 'inventario' as ViewType,
      sublabel: insumosBajoStock.length > 0 ? `${insumosBajoStock.length} requieren reposición (≤5)` : 'Stock en niveles óptimos',
      highlight: insumosBajoStock.length > 0,
      badge: insumosBajoStock.length > 0 ? 'Crítico' : 'Óptimo',
    },
    {
      id: 'insumos',
      label: 'Total Insumos',
      value: inventario.length,
      icon: Layers,
      color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30',
      view: 'inventario' as ViewType,
      sublabel: 'En catálogo de materias primas',
    },
    {
      id: 'formulas',
      label: 'Fórmulas Activas',
      value: formulas.length,
      icon: FlaskConical,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
      view: 'formulas' as ViewType,
      sublabel: 'Recetas de producción',
    },
    {
      id: 'lotes',
      label: 'Lotes Totales',
      value: lotes.length,
      icon: Box,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      view: 'almacen' as ViewType,
      sublabel: `${lotesPendientes.length} en proceso / ${lotesEmpacados.length} listos`,
    },
    {
      id: 'deptos',
      label: 'Departamentos',
      value: departamentos.length,
      icon: Building2,
      color: 'from-violet-500/20 to-fuchsia-500/20 text-violet-400 border-violet-500/30',
      view: 'departamentos' as ViewType,
      sublabel: 'Líneas operativas',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Action Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/60 via-zinc-900 to-zinc-900 border border-indigo-500/20 p-5 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            Control de Producción Almacén Pro
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Panel de Operaciones en Tiempo Real
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Monitorea el inventario de materias primas, ejecuta nuevas tandas de producción y controla el empaque de lotes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onOpenExportReport && (
            <button
              onClick={onOpenExportReport}
              id="dashboard-btn-export-pdf"
              className="px-3.5 py-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Exportar reporte de inventario y lotes a PDF"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Exportar PDF</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('produccion')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Nueva Producción</span>
          </button>
          <button
            onClick={onOpenNuevoInsumo}
            className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700 transition-all cursor-pointer"
            title="Añadir insumo rápido"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Insumo</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => onNavigate(stat.view)}
              className={`bg-zinc-900/80 hover:bg-zinc-900 border rounded-2xl p-4 transition-all duration-200 cursor-pointer group relative overflow-hidden shadow-lg flex flex-col justify-between ${
                stat.highlight && stat.id === 'bajo-stock' && insumosBajoStock.length > 0
                  ? 'border-amber-500/40 hover:border-amber-500/60 bg-amber-950/10'
                  : stat.highlight && stat.id === 'valor-inventario'
                  ? 'border-emerald-500/30 hover:border-emerald-500/50'
                  : 'border-zinc-800 hover:border-zinc-700/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300 line-clamp-1">
                    {stat.label}
                  </span>
                  <div className={`p-1.5 sm:p-2 rounded-xl bg-gradient-to-br border ${stat.color} transition-transform group-hover:scale-105 shrink-0`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-bold text-white tracking-tight font-mono ${
                      stat.isCurrency
                        ? 'text-base sm:text-lg text-emerald-300'
                        : 'text-2xl sm:text-3xl'
                    }`}
                  >
                    {stat.value}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="truncate pr-1">{stat.sublabel}</span>
                {stat.badge ? (
                  <span
                    className={`px-1.5 py-0.5 rounded font-semibold text-[9px] shrink-0 font-mono ${
                      stat.id === 'bajo-stock' && insumosBajoStock.length > 0
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : stat.id === 'valor-inventario'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {stat.badge}
                  </span>
                ) : (
                  <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Estado Operativo por Departamento: Lotes Activos en Proceso */}
      <div id="lotes-activos-departamentos" className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Lotes Activos por Departamento</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  <Activity className="w-3 h-3" />
                  {lotesPendientes.length} en proceso total
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Monitoreo en tiempo real de tandas en elaboración (Almacén 1) por área operativa.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('departamentos')}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Ver departamentos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {departamentosConLotes.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500">
            No hay departamentos registrados. Agrega uno en el módulo de Departamentos.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {departamentosConLotes.map((dep) => {
              const tieneActivos = dep.lotesActivos > 0;
              return (
                <div
                  key={dep.id || dep.slug}
                  onClick={() => onNavigate('almacen')}
                  className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between gap-2.5 ${
                    tieneActivos
                      ? 'bg-zinc-950/80 border-amber-500/30 hover:border-amber-500/50 shadow-md shadow-amber-950/20'
                      : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          tieneActivos
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                        }`}
                      >
                        {dep.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                          {dep.nombre}
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-mono block truncate">
                          /{dep.slug}
                        </span>
                      </div>
                    </div>

                    {/* Visual Badge for active in-process lots */}
                    {tieneActivos ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shrink-0 font-mono">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                        </span>
                        <span>{dep.lotesActivos} activo{dep.lotesActivos === 1 ? '' : 's'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/70 text-zinc-400 border border-zinc-700/40 shrink-0 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <span>0 activos</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500">
                    <span>Total: {dep.totalLotes} lote{dep.totalLotes === 1 ? '' : 's'}</span>
                    <span className="text-emerald-400/90 font-medium">
                      {dep.lotesEmpacados} empacado{dep.lotesEmpacados === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Operative Performance: Lotes Producidos por Departamento (Último Mes) */}
      <LotesPorDepartamentoChart
        lotes={lotes}
        departamentos={departamentos}
        onNavigateToProduccion={() => onNavigate('produccion')}
      />

      {/* Main Grid: Últimos Lotes + Alertas / Accesos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table: Últimos Lotes */}
        <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Últimos Lotes Registrados</h3>
            </div>
            <button
              onClick={() => onNavigate('almacen')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lotes.length === 0 ? (
            <div className="py-10 text-center text-zinc-500 text-xs">
              No hay lotes registrados aún. Comienza una nueva producción.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-400 font-semibold border-b border-zinc-800/60 pb-2">
                    <th className="py-2.5 px-3 font-medium">ID Lote</th>
                    <th className="py-2.5 px-3 font-medium">Producto</th>
                    <th className="py-2.5 px-3 font-medium">Bandejas/Bolas</th>
                    <th className="py-2.5 px-3 font-medium text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {lotes.slice(0, 5).map((lote) => {
                    const isEmpacado = lote.estado === 'almacen2';
                    return (
                      <tr key={lote.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-indigo-300">
                          {lote.id}
                        </td>
                        <td className="py-3 px-3 text-zinc-200 font-medium">
                          {lote.producto}
                          {lote.paquetes_producidos && lote.paquetes_producidos.length > 0 && (
                            <span className="block text-[10px] text-zinc-500 font-normal">
                              {lote.paquetes_producidos[0].cantidad} paq. de {lote.paquetes_producidos[0].gramaje}g
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                          {lote.total_bandejas} band. ({lote.total_bolas} bol.)
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                              isEmpacado
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {isEmpacado ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Empacado</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 animate-spin" />
                                <span>Almacén 1</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar Status / Insumos bajos */}
        <div className="space-y-4">
          {/* Low stock card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Stock Crítico</h3>
              </div>
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {insumosBajoStock.length} alerta{insumosBajoStock.length === 1 ? '' : 's'}
              </span>
            </div>

            {insumosBajoStock.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3">Todos los insumos cuentan con stock adecuado.</p>
            ) : (
              <div className="space-y-2.5">
                {insumosBajoStock.slice(0, 4).map((insumo) => (
                  <div
                    key={insumo.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs"
                  >
                    <div>
                      <p className="font-medium text-zinc-200">{insumo.nombre}</p>
                      <p className="text-[10px] text-zinc-500">Costo: {insumo.costo_unitario} Bs/{insumo.unidad}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-400">
                        {insumo.cantidad} {insumo.unidad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulas summary card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Fórmulas Populares</h3>
              </div>
            </div>

            {formulas.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3">No hay fórmulas registradas.</p>
            ) : (
              <div className="space-y-2">
                {formulas.slice(0, 3).map((f) => (
                  <div
                    key={f.id}
                    onClick={() => onNavigate('formulas')}
                    className="p-2.5 rounded-xl bg-zinc-950/40 hover:bg-zinc-800/50 border border-zinc-800/60 transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-zinc-200">{f.nombre}</span>
                      <span className="block text-[10px] text-zinc-500">
                        {f.bolas_por_bandeja} bolas/band • {f.bandejas_por_lote} band/lote
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono font-medium">
                      {f.ingredientes?.length || 0} ing.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Physical Audit and PDF Export Card */}
          {onOpenExportReport && (
            <div className="bg-gradient-to-br from-indigo-950/40 to-zinc-900 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Auditoría y Control Físico</h3>
                  <p className="text-[10px] text-zinc-400">Descarga de hojas de cotejo en planta</p>
                </div>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Genera el documento PDF formal con casillas de conteo manual de insumos y verificación de lotes listos para firmar.
              </p>
              <button
                type="button"
                onClick={onOpenExportReport}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generar Reporte PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
