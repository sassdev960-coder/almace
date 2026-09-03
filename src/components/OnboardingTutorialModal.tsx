import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Layers,
  FlaskConical,
  Building2,
  PlayCircle,
  PackageCheck,
  Share2,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Wallet
} from 'lucide-react';
import { ViewType } from '../types';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToView?: (view: ViewType) => void;
}

interface StepData {
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  actionText?: string;
  targetView?: ViewType;
  highlights: string[];
  tip?: string;
}

const STEPS: StepData[] = [
  {
    title: '¡Bienvenido a Almacén Pro!',
    badge: 'Inicio & Flujo',
    icon: Sparkles,
    description:
      'Almacén Pro te permite gestionar la cadena completa de producción: desde el control de insumos y formulación de recetas, hasta el registro de lotes y empaque en tiempo real con Supabase.',
    highlights: [
      'Dashboard operativo en vivo con métricas de stock y lotes.',
      'Sincronización instantánea con base de datos en la nube.',
      'Generación de reportes PDF para auditoría física y control diario.'
    ],
    tip: 'Puedes volver a abrir este tutorial en cualquier momento desde el botón de ayuda (?) en la esquina superior.'
  },
  {
    title: 'Paso 1: Configurar Insumos (Materias Primas)',
    badge: 'Materia Prima',
    icon: Layers,
    description:
      'Registra todos los ingredientes base (harina, azúcar, sal, manteca, levadura, etc.), con su unidad de medida (kg, gr, und) y costo unitario para el costeo automático.',
    actionText: 'Ir a Inventario',
    targetView: 'inventario',
    highlights: [
      'Control de stock actual con alertas visuales de nivel bajo.',
      'Cálculo de valor total valorizado de bodega en tiempo real.',
      'Historial de consumo descontado automáticamente en cada lote.'
    ],
    tip: 'Mantener actualizados los costos unitarios garantiza que tus reportes de lote calculen la rentabilidad exacta.'
  },
  {
    title: 'Paso 2: Crear tus Fórmulas Maestras',
    badge: 'Recetas & Rendimiento',
    icon: FlaskConical,
    description:
      'Define las recetas base especificando la cantidad de insumo requerida por bandeja, número de bolas por bandeja y las presentaciones de empaque final.',
    actionText: 'Ir a Fórmulas',
    targetView: 'formulas',
    highlights: [
      'Configuración de bandejas por lote y bolas por bandeja.',
      'Múltiples presentaciones comerciales (ej. 250g, 500g, bolsas de 10 unidades).',
      'Costeo unitario automático por bandeja y por paquete terminado.'
    ],
    tip: 'El sistema calcula automáticamente cuántos paquetes salen de cada tanda según los gramos o bolas configuradas.'
  },
  {
    title: 'Paso 3: Asignar Departamentos / Líneas',
    badge: 'Centros de Producción',
    icon: Building2,
    description:
      'Organiza tus áreas operativas, hornos, líneas de masa o sucursales de destino para clasificar la producción.',
    actionText: 'Ir a Departamentos',
    targetView: 'departamentos',
    highlights: [
      'Clasificación por línea de horneado o sede.',
      'Trazabilidad de qué departamento produjo cada lote.',
      'Filtrado y conteo de producción por sector.'
    ]
  },
  {
    title: 'Paso 4: Planificar y Registrar Producción',
    badge: 'Producción & Stock',
    icon: PlayCircle,
    description:
      'Selecciona la fórmula, cantidad de tandas y presentación. El sistema verificará el stock disponible y descontará los ingredientes automáticamente.',
    actionText: 'Ir a Producción',
    targetView: 'produccion',
    highlights: [
      'Simulador interactivo con cálculo previo de insumos necesarios.',
      'Generación de número de Lote único (ej. L-0001).',
      'Envío automático a Almacén 1 (En proceso).'
    ],
    tip: 'Si falta stock de algún insumo, el sistema te advertirá con exactitud cuánta cantidad falta antes de producir.'
  },
  {
    title: 'Paso 5: Almacén y Confirmación de Empaque',
    badge: 'Trazabilidad Final',
    icon: PackageCheck,
    description:
      'Controla el paso de los lotes en proceso (Almacén 1) hacia producto terminado y empacado (Almacén 2).',
    actionText: 'Ir a Almacén',
    targetView: 'almacen',
    highlights: [
      'Seguimiento visual del estado de cada orden.',
      'Un solo clic para marcar el lote como empacado.',
      'Historial completo de lotes con fecha, costos e insumos consumidos.'
    ]
  },
  {
    title: 'Paso 6: Enlace Directo para Operarios',
    badge: 'Acceso Móvil / QR',
    icon: Share2,
    description:
      'Los empleados de planta pueden registrar tandas desde su propio teléfono o tablet sin tener la contraseña de administrador.',
    highlights: [
      'Comparte el enlace o imprime el código QR en la pared del taller.',
      'Interfaz simplificada y táctil con botones grandes (+ / -).',
      'Protege los datos sensibles de costos y contraseñas del negocio.'
    ],
    tip: 'Haz clic en "Compartir a Empleados" en la barra superior para copiar el enlace o ver el código QR.'
  },
  {
    title: 'Paso 7: Caja y Control de Egresos (Finanzas)',
    badge: 'Finanzas & Caja',
    icon: Wallet,
    description:
      'Registra las entradas y salidas de dinero de tu negocio: pagos a empleados, facturas de agua, luz, gas, compras de insumos y ventas de mostrador.',
    actionText: 'Ir a Caja & Finanzas',
    targetView: 'finanzas',
    highlights: [
      'Arqueo de caja chica en tiempo real con saldo neto.',
      'Desglose rápido de servicios operativos (agua, electricidad, gas de hornos).',
      'Registro de nómina y comprobantes de pago a empleados.'
    ],
    tip: 'Usa los botones de acceso rápido para cargar recibos de luz, agua o gas en menos de 5 segundos.'
  }
];

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onClose,
  onNavigateToView,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStep((s) => s + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleJumpToView = () => {
    if (step.targetView && onNavigateToView) {
      onNavigateToView(step.targetView);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col"
      >
        {/* Top Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-800">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {step.badge}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                {step.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            title="Cerrar tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 flex-1 text-xs">
          <p className="text-sm text-zinc-300 leading-relaxed">
            {step.description}
          </p>

          {/* Highlights */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Puntos Clave:
            </span>
            {step.highlights.map((h, idx) => (
              <div key={idx} className="flex items-start gap-2 text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{h}</span>
              </div>
            ))}
          </div>

          {/* Practical Tip */}
          {step.tip && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300/90 text-[11px] flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Consejo útil:</strong> {step.tip}
              </div>
            </div>
          )}

          {/* Optional Action to Jump into View */}
          {step.targetView && (
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">¿Quieres explorarlo ahora?</span>
              <button
                type="button"
                onClick={handleJumpToView}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-indigo-300 hover:text-indigo-200 border border-zinc-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{step.actionText || 'Ver Módulo'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer & Navigation Controls */}
        <div className="p-4 sm:p-5 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between gap-3">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'w-6 bg-indigo-500'
                    : 'w-2 bg-zinc-800 hover:bg-zinc-700'
                }`}
                title={`Paso ${idx + 1}`}
              />
            ))}
            <span className="text-[11px] text-zinc-500 ml-2 font-mono">
              {currentStep + 1} de {STEPS.length}
            </span>
          </div>

          {/* Next / Back Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20 transition-all"
            >
              <span>{isLast ? '¡Comenzar a Usar!' : 'Siguiente'}</span>
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
