import React from 'react';
import { ViewType } from '../types';
import { RefreshCw, LogOut, FileText, Share2 } from 'lucide-react';

interface HeaderProps {
  currentView: ViewType;
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onOpenExportReport?: () => void;
  onOpenShareLink?: () => void;
}

const VIEW_TITLES: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Resumen ejecutivo de operaciones' },
  inventario: { title: 'Inventario', subtitle: 'Gestión y control de materias primas' },
  formulas: { title: 'Fórmulas', subtitle: 'Recetas maestras y especificaciones' },
  departamentos: { title: 'Departamentos', subtitle: 'Sedes y líneas de distribución' },
  produccion: { title: 'Producción', subtitle: 'Planificación y cálculo de lotes' },
  almacen: { title: 'Almacén', subtitle: 'Control de lotes y estado de empaque' },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  isLoading,
  onRefresh,
  onLogout,
  onOpenExportReport,
  onOpenShareLink,
}) => {
  const info = VIEW_TITLES[currentView] || { title: 'Admin Móvil', subtitle: 'Almacén Pro' };

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-4 py-3 sm:px-6 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Section Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0 font-bold text-sm tracking-wider">
            AP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                {info.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                En línea
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden xs:block">{info.subtitle}</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {onOpenShareLink && (
            <button
              onClick={onOpenShareLink}
              title="Compartir enlace para que empleados registren producción"
              id="header-btn-share-employees"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Compartir a Empleados</span>
            </button>
          )}

          {onOpenExportReport && (
            <button
              onClick={onOpenExportReport}
              title="Descargar reporte PDF para control físico"
              id="header-btn-export-pdf"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Reporte PDF</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Sincronizar datos con Supabase"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

