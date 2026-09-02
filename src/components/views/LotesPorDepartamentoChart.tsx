import React, { useState, useMemo } from 'react';
import { LoteItem, DepartamentoItem } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, TrendingUp, Award, Calendar, Layers, Box } from 'lucide-react';

interface LotesPorDepartamentoChartProps {
  lotes: LoteItem[];
  departamentos: DepartamentoItem[];
  onNavigateToProduccion?: () => void;
}

type TimeRange = 'month' | 'week' | 'all';

const COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
];

export const LotesPorDepartamentoChart: React.FC<LotesPorDepartamentoChartProps> = ({
  lotes,
  departamentos,
  onNavigateToProduccion,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  // Filter lotes according to selected time range
  const filteredLotes = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return lotes.filter((lote) => {
      if (!lote.created_at) return true; // Include if no created_at exists for sample data
      const createdAtMs = new Date(lote.created_at).getTime();
      if (isNaN(createdAtMs)) return true;

      if (timeRange === 'week') {
        return now - createdAtMs <= 7 * oneDay;
      }
      if (timeRange === 'month') {
        return now - createdAtMs <= 30 * oneDay;
      }
      return true; // 'all'
    });
  }, [lotes, timeRange]);

  // Aggregate data by department
  const chartData = useMemo(() => {
    // Map existing departments
    const deptMap = new Map<string, {
      id: string;
      nombre: string;
      slug: string;
      totalLotes: number;
      totalBandejas: number;
      totalBolas: number;
      costoTotal: number;
      lotesEmpacados: number;
      lotesEnProceso: number;
    }>();

    // Initialize all departments with 0 so all lines are represented
    departamentos.forEach((d) => {
      const key = d.id || d.slug;
      deptMap.set(key, {
        id: d.id || d.slug,
        nombre: d.nombre,
        slug: d.slug,
        totalLotes: 0,
        totalBandejas: 0,
        totalBolas: 0,
        costoTotal: 0,
        lotesEmpacados: 0,
        lotesEnProceso: 0,
      });
    });

    // Aggregate lotes
    filteredLotes.forEach((lote) => {
      const deptoId = lote.departamento_id;
      // Match by ID, slug, or find in map
      let matchedEntry = deptMap.get(deptoId);
      if (!matchedEntry) {
        // Try finding by slug
        const foundDep = departamentos.find((d) => d.slug === deptoId || d.id === deptoId);
        if (foundDep) {
          matchedEntry = deptMap.get(foundDep.id || foundDep.slug);
        }
      }

      const lotesCount = Number(lote.lotes_producidos) || 1;
      const bandejasCount = Number(lote.total_bandejas) || 0;
      const bolaspCount = Number(lote.total_bolas) || 0;
      const costo = Number(lote.costo_lote) || 0;

      if (matchedEntry) {
        matchedEntry.totalLotes += lotesCount;
        matchedEntry.totalBandejas += bandejasCount;
        matchedEntry.totalBolas += bolaspCount;
        matchedEntry.costoTotal += costo;
        if (lote.estado === 'almacen2') {
          matchedEntry.lotesEmpacados += lotesCount;
        } else {
          matchedEntry.lotesEnProceso += lotesCount;
        }
      } else {
        // Unmapped department name
        const customKey = deptoId || 'General';
        const existing = deptMap.get(customKey);
        if (existing) {
          existing.totalLotes += lotesCount;
          existing.totalBandejas += bandejasCount;
          existing.totalBolas += bolaspCount;
          existing.costoTotal += costo;
        } else {
          deptMap.set(customKey, {
            id: customKey,
            nombre: customKey,
            slug: customKey.toLowerCase(),
            totalLotes: lotesCount,
            totalBandejas: bandejasCount,
            totalBolas: bolaspCount,
            costoTotal: costo,
            lotesEmpacados: lote.estado === 'almacen2' ? lotesCount : 0,
            lotesEnProceso: lote.estado === 'almacen1' ? lotesCount : 0,
          });
        }
      }
    });

    return Array.from(deptMap.values()).sort((a, b) => b.totalLotes - a.totalLotes);
  }, [departamentos, filteredLotes]);

  // General KPIs from chartData
  const totalLotesPeriodo = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.totalLotes, 0);
  }, [chartData]);

  const totalBandejasPeriodo = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.totalBandejas, 0);
  }, [chartData]);

  const deptoLider = useMemo(() => {
    if (chartData.length === 0 || chartData[0].totalLotes === 0) return null;
    return chartData[0];
  }, [chartData]);

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900/95 border border-zinc-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs min-w-[190px]">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-zinc-800">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
            <span className="font-semibold text-white">{data.nombre}</span>
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-400 font-sans">Lotes Producidos:</span>
              <span className="font-bold text-indigo-300 text-sm">{data.totalLotes}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-400 font-sans">Bandejas Totales:</span>
              <span className="text-emerald-400">{data.totalBandejas}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-400 font-sans">Bolas Totales:</span>
              <span className="text-cyan-400">{data.totalBolas}</span>
            </div>
            {data.costoTotal > 0 && (
              <div className="flex justify-between items-center text-zinc-300 pt-1 border-t border-zinc-800/80">
                <span className="text-zinc-400 font-sans">Costo Estimado:</span>
                <span className="text-amber-400 font-bold">{data.costoTotal.toFixed(0)} Bs.</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="grafico-lotes-departamento" className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Lotes Producidos por Departamento</h3>
              <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Calendar className="w-3 h-3" />
                {timeRange === 'month' ? 'Último Mes' : timeRange === 'week' ? 'Últimos 7 días' : 'Histórico'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Rendimiento y volumen de tandas operativas registradas por línea de producción.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto shrink-0">
          <button
            id="filtro-mes"
            onClick={() => setTimeRange('month')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              timeRange === 'month'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Último Mes
          </button>
          <button
            id="filtro-semana"
            onClick={() => setTimeRange('week')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              timeRange === 'week'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            7 Días
          </button>
          <button
            id="filtro-todos"
            onClick={() => setTimeRange('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              timeRange === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todo
          </button>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Total Lotes</p>
            <p className="text-lg font-bold text-white font-mono">{totalLotesPeriodo}</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Box className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Bandejas Totales</p>
            <p className="text-lg font-bold text-emerald-400 font-mono">{totalBandejasPeriodo}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Depto. Líder</p>
            <p className="text-xs font-bold text-amber-400 truncate max-w-[120px]">
              {deptoLider ? deptoLider.nombre : 'Sin registros'}
            </p>
            {deptoLider && (
              <span className="text-[10px] text-zinc-500 font-mono">
                {deptoLider.totalLotes} lote{deptoLider.totalLotes === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="w-full pt-2">
        {chartData.length === 0 || totalLotesPeriodo === 0 ? (
          <div className="py-12 text-center rounded-xl bg-zinc-950/40 border border-zinc-800/60 space-y-2">
            <TrendingUp className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">
              No se registran lotes producidos en el período seleccionado.
            </p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Inicia una tanda de producción o cambia el filtro temporal para ver datos anteriores.
            </p>
            {onNavigateToProduccion && (
              <button
                onClick={onNavigateToProduccion}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <span>Ir a Producción</span>
              </button>
            )}
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="nombre"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={35}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                <Bar
                  dataKey="totalLotes"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                  animationDuration={800}
                >
                  {chartData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart Legend / Department Summary Badges */}
      {chartData.length > 0 && totalLotesPeriodo > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
          {chartData.map((d, index) => (
            <div
              key={d.id}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[11px]"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-zinc-300 font-medium">{d.nombre}:</span>
              <span className="text-white font-mono font-bold">{d.totalLotes} tot.</span>
              {d.lotesEnProceso > 0 ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                  {d.lotesEnProceso} en proceso
                </span>
              ) : (
                <span className="text-zinc-500 text-[10px]">({d.totalBandejas} band.)</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
