import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Smartphone,
  Building2,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { DepartamentoItem, FormulaItem } from '../types';

interface ShareEmployeeLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  departamentos: DepartamentoItem[];
  formulas: FormulaItem[];
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => void;
}

export const ShareEmployeeLinkModal: React.FC<ShareEmployeeLinkModalProps> = ({
  isOpen,
  onClose,
  departamentos,
  formulas,
  onShowToast,
}) => {
  const [selectedDepto, setSelectedDepto] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  // Build the shareable URL
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set('modo', 'operario');
  if (selectedDepto) {
    params.set('depto', selectedDepto);
  }
  const shareableUrl = `${baseUrl}?${params.toString()}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      onShowToast('success', 'Enlace copiado al portapapeles. Compártelo con los empleados.', 'Enlace Copiado');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback for copy
      const input = document.getElementById('shareable-link-input') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        onShowToast('success', 'Enlace copiado al portapapeles.', 'Enlace Copiado');
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const handleOpenNewTab = () => {
    window.open(shareableUrl, '_blank');
  };

  // QR code encoded url for simple SVG QR rendering or image API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    shareableUrl
  )}&bgcolor=18181b&color=ffffff&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-5 sm:p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Compartir Enlace para Empleados / Operarios
              </h3>
              <p className="text-[11px] text-zinc-400">
                Acceso directo y seguro al registro de producción sin contraseña de administrador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Info Banner */}
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
            <div className="text-[11px] leading-relaxed">
              <strong>¿Cómo funciona?</strong> Al enviar este enlace a los empleados, podrán abrirlo en sus teléfonos o tablets de planta para registrar tandas producidas y descontar inventario en tiempo real, sin tener acceso a editar costos, fórmulas o contraseñas.
            </div>
          </div>

          {/* Optional Department Preselection */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Preseleccionar Departamento / Línea (Opcional):</span>
            </label>
            <select
              value={selectedDepto}
              onChange={(e) => setSelectedDepto(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Cualquier Departamento (El empleado lo elegirá)</option>
              {departamentos.map((d) => (
                <option key={d.id || d.slug} value={d.id || d.slug}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Generated URL Box */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Enlace de Acceso Rápido:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="shareable-link-input"
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs font-mono text-indigo-300 select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* QR Code Toggle & View */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>{showQR ? 'Ocultar Código QR' : 'Mostrar Código QR para escanear'}</span>
              </button>

              <button
                onClick={handleOpenNewTab}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>Probar enlace</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-center space-y-2"
                >
                  <img
                    src={qrCodeUrl}
                    alt="Código QR para empleados"
                    className="w-40 h-40 rounded-lg border border-zinc-800 shadow-md bg-zinc-900"
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Pega este código en la pared de la panadería o taller para que los operarios lo escaneen con su celular.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick instructions list */}
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-1.5 text-[11px] text-zinc-400">
            <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Instrucciones de uso para el equipo:</span>
            </div>
            <p>1. Envía el enlace por <strong>WhatsApp</strong> o <strong>Telegram</strong> al grupo de operarios.</p>
            <p>2. El empleado abre el link en su navegador móvil (pueden añadirlo como icono a su pantalla de inicio).</p>
            <p>3. Selecciona la fórmula, cantidad de tandas y departamento, y presiona <strong>Registrar Producción</strong>.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Enlace</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
