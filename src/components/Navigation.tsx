import React from 'react';
import { ViewType } from '../types';
import { LayoutDashboard, Layers, FlaskConical, Building2, PlayCircle, PackageCheck, Wallet } from 'lucide-react';
import { motion } from 'motion/react';

interface NavigationProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  counts: {
    insumos: number;
    formulas: number;
    departamentos: number;
    lotes: number;
    lotesPendientes: number;
  };
}

interface NavItemConfig {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  counts,
}) => {
  const items: NavItemConfig[] = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'inventario', label: 'Inventario', icon: Layers, badge: counts.insumos },
    { id: 'formulas', label: 'Fórmulas', icon: FlaskConical, badge: counts.formulas },
    { id: 'departamentos', label: 'Deptos', icon: Building2, badge: counts.departamentos },
    { id: 'produccion', label: 'Producir', icon: PlayCircle },
    { id: 'almacen', label: 'Almacén', icon: PackageCheck, badge: counts.lotesPendientes > 0 ? counts.lotesPendientes : undefined },
    { id: 'finanzas', label: 'Caja & Gastos', icon: Wallet },
  ];

  return (
    <>
      {/* Desktop / Tablet Top Navigation Bar */}
      <nav className="hidden md:block bg-zinc-900/60 border-b border-zinc-800/80 px-6 py-2 sticky top-[57px] z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'text-white bg-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {typeof item.badge !== 'undefined' && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="font-mono text-[11px] bg-zinc-800/80 px-2 py-1 rounded-md text-zinc-400 border border-zinc-700/40">
              Almacén Pro
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/80 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-2 px-2 shadow-2xl">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer flex-1 ${
                  isActive ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200 active:scale-95'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {typeof item.badge !== 'undefined' && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-zinc-950">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium transition-all ${isActive ? 'font-bold text-white' : ''}`}>
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 w-1.5 h-1.5 bg-indigo-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
