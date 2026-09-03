import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Droplets,
  Zap,
  Flame,
  Package,
  Wrench,
  ShoppingBag,
  MoreHorizontal,
  Search,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  Building,
  Receipt,
  X,
  PieChart as PieChartIcon,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MovimientoFinanzaItem, TipoMovimiento, CategoriaFinanza, MetodoPago } from '../../types';

interface FinanzasViewProps {
  movimientos: MovimientoFinanzaItem[];
  onSaveMovimiento: (mov: Omit<MovimientoFinanzaItem, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  onDeleteMovimiento: (id: string) => Promise<void>;
  isSupabaseSynced: boolean;
}

export const CATEGORIAS_CONFIG: Record<
  CategoriaFinanza,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  empleados: {
    label: 'Pago Empleados',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  agua: {
    label: 'Servicio de Agua',
    icon: Droplets,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  electricidad: {
    label: 'Electricidad (Luz)',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  gas: {
    label: 'Servicio de Gas',
    icon: Flame,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  insumos: {
    label: 'Materia Prima / Insumos',
    icon: Package,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  mantenimiento: {
    label: 'Mantenimiento Maquinaria',
    icon: Wrench,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  ventas: {
    label: 'Ventas de Producto',
    icon: ShoppingBag,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  otros: {
    label: 'Otros Gastos / Ingresos',
    icon: MoreHorizontal,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
  },
};

const SQL_TABLE_SCRIPT = `-- Ejecuta este script en el SQL Editor de tu proyecto Supabase:
CREATE TABLE IF NOT EXISTS public.finanzas_caja (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  categoria text NOT NULL,
  concepto text NOT NULL,
  monto numeric NOT NULL CHECK (monto >= 0),
  metodo_pago text NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  comprobante_ref text,
  responsable text,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT finanzas_caja_pkey PRIMARY KEY (id)
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_finanzas_fecha ON public.finanzas_caja(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_finanzas_tipo ON public.finanzas_caja(tipo);
CREATE INDEX IF NOT EXISTS idx_finanzas_categoria ON public.finanzas_caja(categoria);

-- Habilitar permisos
ALTER TABLE public.finanzas_caja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo acceso a finanzas_caja" ON public.finanzas_caja
  FOR ALL USING (true) WITH CHECK (true);
`;

export const FinanzasView: React.FC<FinanzasViewProps> = ({
  movimientos,
  onSaveMovimiento,
  onDeleteMovimiento,
  isSupabaseSynced,
}) => {
  // Filters & State
  const [activeTab, setActiveTab] = useState<'todos' | 'egresos' | 'ingresos' | 'metricas'>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [periodoFilter, setPeriodoFilter] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('mes');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formTipo, setFormTipo] = useState<TipoMovimiento>('egreso');
  const [formCategoria, setFormCategoria] = useState<CategoriaFinanza>('empleados');
  const [formConcepto, setFormConcepto] = useState('');
  const [formMonto, setFormMonto] = useState<string>('');
  const [formMetodoPago, setFormMetodoPago] = useState<MetodoPago>('efectivo');
  const [formResponsable, setFormResponsable] = useState('');
  const [formComprobanteRef, setFormComprobanteRef] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0]);
  const [formNotas, setFormNotas] = useState('');

  // Quick action to open modal with preselected category
  const handleOpenModal = (tipo: TipoMovimiento, cat?: CategoriaFinanza) => {
    setFormTipo(tipo);
    if (cat) {
      setFormCategoria(cat);
    } else {
      setFormCategoria(tipo === 'ingreso' ? 'ventas' : 'empleados');
    }
    setFormConcepto('');
    setFormMonto('');
    setFormMetodoPago('efectivo');
    setFormResponsable('');
    setFormComprobanteRef('');
    setFormFecha(new Date().toISOString().split('T')[0]);
    setFormNotas('');
    setIsModalOpen(true);
  };

  // Date filtering helper
  const filteredByPeriod = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return movimientos.filter((m) => {
      if (periodoFilter === 'todos') return true;

      const movDate = new Date(m.fecha + 'T00:00:00');
      if (periodoFilter === 'hoy') {
        return m.fecha === todayStr;
      }
      if (periodoFilter === 'semana') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return movDate >= oneWeekAgo;
      }
      if (periodoFilter === 'mes') {
        return (
          movDate.getFullYear() === now.getFullYear() &&
          movDate.getMonth() === now.getMonth()
        );
      }
      return true;
    });
  }, [movimientos, periodoFilter]);

  // Combined filtering (Tab, Category, Search)
  const filteredMovimientos = useMemo(() => {
    return filteredByPeriod.filter((m) => {
      // Tab filter
      if (activeTab === 'egresos' && m.tipo !== 'egreso') return false;
      if (activeTab === 'ingresos' && m.tipo !== 'ingreso') return false;

      // Category filter
      if (categoriaFilter !== 'todas' && m.categoria !== categoriaFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchConcepto = m.concepto.toLowerCase().includes(q);
        const matchResp = (m.responsable || '').toLowerCase().includes(q);
        const matchRef = (m.comprobante_ref || '').toLowerCase().includes(q);
        const matchCat = CATEGORIAS_CONFIG[m.categoria]?.label.toLowerCase().includes(q);
        if (!matchConcepto && !matchResp && !matchRef && !matchCat) return false;
      }

      return true;
    });
  }, [filteredByPeriod, activeTab, categoriaFilter, searchQuery]);

  // Overall Financial Calculations based on current period
  const { totalIngresos, totalEgresos, saldoNeto, egresosPorCategoria } = useMemo(() => {
    let ingresos = 0;
    let egresos = 0;
    const catMap: Record<CategoriaFinanza, number> = {
      empleados: 0,
      agua: 0,
      electricidad: 0,
      gas: 0,
      insumos: 0,
      mantenimiento: 0,
      ventas: 0,
      otros: 0,
    };

    filteredByPeriod.forEach((m) => {
      const val = Number(m.monto) || 0;
      if (m.tipo === 'ingreso') {
        ingresos += val;
      } else {
        egresos += val;
        catMap[m.categoria] = (catMap[m.categoria] || 0) + val;
      }
    });

    return {
      totalIngresos: ingresos,
      totalEgresos: egresos,
      saldoNeto: ingresos - egresos,
      egresosPorCategoria: catMap,
    };
  }, [filteredByPeriod]);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(formMonto);
    if (!formConcepto.trim()) {
      alert('Por favor especifica un concepto o descripción para el movimiento.');
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveMovimiento({
        tipo: formTipo,
        categoria: formCategoria,
        concepto: formConcepto.trim(),
        monto: montoNum,
        metodo_pago: formMetodoPago,
        responsable: formResponsable.trim() || undefined,
        comprobante_ref: formComprobanteRef.trim() || undefined,
        fecha: formFecha,
        notas: formNotas.trim() || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert('Error guardando movimiento: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_TABLE_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Helper formatter for money
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 sm:p-6 rounded-2xl border border-zinc-800/80 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wallet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Caja & Finanzas Operativas
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Control de caja chica, flujo de efectivo y egresos (empleados, agua, luz, gas, etc.)
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenModal('ingreso')}
            id="btn-nuevo-ingreso"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ingreso en Caja</span>
          </button>
          <button
            onClick={() => handleOpenModal('egreso')}
            id="btn-nuevo-egreso"
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>- Registrar Egreso</span>
          </button>
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-700/60 cursor-pointer"
            title="Ver script SQL de Supabase"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">SQL Supabase</span>
          </button>
        </div>
      </div>

      {/* Supabase status notice if not synced */}
      {!isSupabaseSynced && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold block sm:inline">Modo Almacenamiento Local Activo: </span>
              <span>
                Los registros se guardan en tu navegador. Para sincronizarlos en Supabase para todos los dispositivos, ejecuta la tabla con el comando SQL.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold shrink-0 transition-colors cursor-pointer border border-amber-500/30"
          >
            Ver SQL
          </button>
        </div>
      )}

      {/* Quick Access Egreso Shortcuts */}
      <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/80">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2.5">
          Egresos Frecuentes (Acceso Rápido):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            onClick={() => handleOpenModal('egreso', 'empleados')}
            className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 flex items-center gap-2 transition-all text-xs font-semibold cursor-pointer active:scale-95"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Pago Empleados</span>
          </button>
          <button
            onClick={() => handleOpenModal('egreso', 'agua')}
            className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 flex items-center gap-2 transition-all text-xs font-semibold cursor-pointer active:scale-95"
          >
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span>Pago de Agua</span>
          </button>
          <button
            onClick={() => handleOpenModal('egreso', 'electricidad')}
            className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 flex items-center gap-2 transition-all text-xs font-semibold cursor-pointer active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Pago de Luz</span>
          </button>
          <button
            onClick={() => handleOpenModal('egreso', 'gas')}
            className="p-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-300 flex items-center gap-2 transition-all text-xs font-semibold cursor-pointer active:scale-95"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Pago de Gas</span>
          </button>
          <button
            onClick={() => handleOpenModal('egreso', 'insumos')}
            className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 flex items-center gap-2 transition-all text-xs font-semibold cursor-pointer active:scale-95"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Materia Prima</span>
          </button>
          <button
            onClick={() => handleOpenModal('egreso', 'mantenimiento')}
            className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 flex items-center gap-2 transition-all text-xs font-semibold cursor-pointer active:scale-95"
          >
            <Wrench className="w-4 h-4 text-purple-400" />
            <span>Mantenimiento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards & Period Filter */}
      <div className="space-y-3">
        {/* Period Selector */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Período:
            </span>
            {(['hoy', 'semana', 'mes', 'todos'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodoFilter(p)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize cursor-pointer ${
                  periodoFilter === p
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {p === 'hoy'
                  ? 'Hoy'
                  : p === 'semana'
                  ? 'Esta Semana'
                  : p === 'mes'
                  ? 'Este Mes'
                  : 'Todo'}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-500 font-mono">
            {filteredMovimientos.length} movimiento(s) registrado(s)
          </span>
        </div>

        {/* 3 Main KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Saldo Neto */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Saldo Neto en Caja
              </span>
              <span
                className={`p-2 rounded-xl ${
                  saldoNeto >= 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                <Wallet className="w-5 h-5" />
              </span>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                saldoNeto >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {formatMoney(saldoNeto)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Ingresos menos egresos en el período
            </p>
          </div>

          {/* Total Ingresos */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                Total Ingresos
              </span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              +{formatMoney(totalIngresos)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Cobros y entradas registradas
            </p>
          </div>

          {/* Total Egresos */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4" />
                Total Egresos
              </span>
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <TrendingDown className="w-5 h-5" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              -{formatMoney(totalEgresos)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Nómina, servicios (luz, agua, gas) y compras
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown by Key Utility / Expense Type */}
      <div className="bg-zinc-900/40 p-4 sm:p-5 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-indigo-400" />
            Desglose de Egresos Principales
          </span>
          <span className="text-[11px] text-zinc-500">
            Total gastado: {formatMoney(totalEgresos)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Empleados */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Nómina Empleados</span>
            </div>
            <div className="text-base font-bold text-white">
              {formatMoney(egresosPorCategoria.empleados)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {totalEgresos > 0
                ? `${Math.round((egresosPorCategoria.empleados / totalEgresos) * 100)}% del gasto`
                : '0%'}
            </div>
          </div>

          {/* Electricidad */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Luz / Electricidad</span>
            </div>
            <div className="text-base font-bold text-white">
              {formatMoney(egresosPorCategoria.electricidad)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {totalEgresos > 0
                ? `${Math.round((egresosPorCategoria.electricidad / totalEgresos) * 100)}% del gasto`
                : '0%'}
            </div>
          </div>

          {/* Gas */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-semibold mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Gas (Hornos)</span>
            </div>
            <div className="text-base font-bold text-white">
              {formatMoney(egresosPorCategoria.gas)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {totalEgresos > 0
                ? `${Math.round((egresosPorCategoria.gas / totalEgresos) * 100)}% del gasto`
                : '0%'}
            </div>
          </div>

          {/* Agua */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-1">
              <Droplets className="w-3.5 h-3.5" />
              <span>Servicio Agua</span>
            </div>
            <div className="text-base font-bold text-white">
              {formatMoney(egresosPorCategoria.agua)}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {totalEgresos > 0
                ? `${Math.round((egresosPorCategoria.agua / totalEgresos) * 100)}% del gasto`
                : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'todos'
                  ? 'bg-zinc-800 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({filteredByPeriod.length})
            </button>
            <button
              onClick={() => setActiveTab('egresos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'egresos'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-zinc-400 hover:text-rose-300'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Egresos & Pagos</span>
            </button>
            <button
              onClick={() => setActiveTab('ingresos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ingresos'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ingresos en Caja</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar concepto, persona..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="todas">Todas las categorías</option>
              <option value="empleados">Pago Empleados</option>
              <option value="agua">Agua</option>
              <option value="electricidad">Electricidad</option>
              <option value="gas">Gas</option>
              <option value="insumos">Insumos</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="ventas">Ventas</option>
              <option value="otros">Otros</option>
            </select>
          </div>
        </div>

        {/* Movements Table / List */}
        {filteredMovimientos.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-zinc-500 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">
              No hay movimientos registrados en este filtro
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Usa los botones superiores para registrar un egreso (pago de empleado, servicios, etc.) o un ingreso de caja.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => handleOpenModal('egreso')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                + Registrar Egreso
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4">Categoría & Concepto</th>
                    <th className="py-3.5 px-4">Beneficiario / Responsable</th>
                    <th className="py-3.5 px-4">Método</th>
                    <th className="py-3.5 px-4 text-right">Monto</th>
                    <th className="py-3.5 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredMovimientos.map((m) => {
                    const catConfig = CATEGORIAS_CONFIG[m.categoria] || CATEGORIAS_CONFIG.otros;
                    const CatIcon = catConfig.icon;
                    const isEgreso = m.tipo === 'egreso';

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-zinc-800/40 transition-colors group"
                      >
                        {/* Fecha */}
                        <td className="py-3 px-4 whitespace-nowrap text-zinc-400 font-mono">
                          {m.fecha}
                        </td>

                        {/* Categoria & Concepto */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${catConfig.bg} ${catConfig.color} border ${catConfig.border}`}
                              title={catConfig.label}
                            >
                              <CatIcon className="w-4 h-4" />
                            </span>
                            <div>
                              <span className="font-semibold text-white block">
                                {m.concepto}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold ${catConfig.color}`}>
                                  {catConfig.label}
                                </span>
                                {m.comprobante_ref && (
                                  <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
                                    Ref: {m.comprobante_ref}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Responsable */}
                        <td className="py-3 px-4 whitespace-nowrap text-zinc-300">
                          {m.responsable ? (
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-zinc-500" />
                              <span>{m.responsable}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>

                        {/* Metodo de Pago */}
                        <td className="py-3 px-4 whitespace-nowrap text-zinc-400 capitalize">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-medium border border-zinc-700/40">
                            {m.metodo_pago}
                          </span>
                        </td>

                        {/* Monto */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <span
                            className={`font-black text-sm ${
                              isEgreso ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {isEgreso ? '-' : '+'}
                            {formatMoney(m.monto)}
                          </span>
                        </td>

                        {/* Borrar */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `¿Deseas eliminar este registro de "${m.concepto}" (${formatMoney(
                                    m.monto
                                  )})?`
                                )
                              ) {
                                onDeleteMovimiento(m.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                            title="Eliminar movimiento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Registrar Movimiento */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-5 sm:p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      formTipo === 'ingreso'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {formTipo === 'ingreso' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {formTipo === 'ingreso'
                        ? 'Nuevo Ingreso en Caja'
                        : 'Registrar Egreso / Pago'}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Movimiento financiero para control contable
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Selector Tipo */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('egreso');
                      if (formCategoria === 'ventas') setFormCategoria('empleados');
                    }}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      formTipo === 'egreso'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Egreso (Gasto/Pago)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('ingreso');
                      setFormCategoria('ventas');
                    }}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      formTipo === 'ingreso'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Ingreso (Entrada)</span>
                  </button>
                </div>

                {/* Categoría */}
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1.5">
                    Categoría del Movimiento
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(Object.keys(CATEGORIAS_CONFIG) as CategoriaFinanza[])
                      .filter((cat) => (formTipo === 'ingreso' ? cat === 'ventas' || cat === 'otros' : cat !== 'ventas'))
                      .map((cat) => {
                        const cfg = CATEGORIAS_CONFIG[cat];
                        const Icon = cfg.icon;
                        const isSelected = formCategoria === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setFormCategoria(cat)}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            <span className="truncate text-[11px]">{cfg.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Concepto y Monto */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-zinc-300 mb-1">
                      Concepto o Descripción <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Quincena Juan, Factura Luz Septiembre, Gas 3 cilindros..."
                      value={formConcepto}
                      onChange={(e) => setFormConcepto(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">
                      Monto ($) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formMonto}
                      onChange={(e) => setFormMonto(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Método de pago, Beneficiario, Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">
                      Método de Pago
                    </label>
                    <select
                      value={formMetodoPago}
                      onChange={(e) => setFormMetodoPago(e.target.value as MetodoPago)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-indigo-500 capitalize"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">
                      Beneficiario / Responsable
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Empleado o Proveedor"
                      value={formResponsable}
                      onChange={(e) => setFormResponsable(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">
                      Fecha del Movimiento
                    </label>
                    <input
                      type="date"
                      value={formFecha}
                      onChange={(e) => setFormFecha(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Comprobante Ref & Notas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">
                      N° Factura / Recibo / Comprobante (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. FAC-1049, Recibo N° 45"
                      value={formComprobanteRef}
                      onChange={(e) => setFormComprobanteRef(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">
                      Observaciones / Notas (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Detalles extra del pago..."
                      value={formNotas}
                      onChange={(e) => setFormNotas(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 rounded-xl text-white font-bold cursor-pointer transition-all shadow-lg ${
                      formTipo === 'ingreso'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    }`}
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar en Caja'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: SQL Script Viewer for Supabase */}
      <AnimatePresence>
        {showSqlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Copy className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Comando SQL para Supabase (Finanzas & Caja)
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Copia y ejecuta este script en el SQL Editor de tu proyecto Supabase
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-zinc-950 border border-zinc-800/90 rounded-xl text-xs font-mono text-zinc-300 overflow-x-auto max-h-72 leading-relaxed">
                  {SQL_TABLE_SCRIPT}
                </pre>
                <button
                  onClick={handleCopySql}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 space-y-1">
                <span className="font-bold text-zinc-300 block">¿Cómo aplicarlo?</span>
                <p>1. Entra a tu proyecto en <strong>supabase.com</strong></p>
                <p>2. En el menú de la izquierda haz clic en <strong>SQL Editor</strong></p>
                <p>3. Haz clic en <strong>New Query</strong>, pega este código y presiona <strong>RUN</strong></p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
