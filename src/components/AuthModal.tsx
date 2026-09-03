import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, Sparkles, ChefHat } from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: () => void;
  onEnterOperarioMode?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess, onEnterOperarioMode }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    setTimeout(() => {
      if (password === 'admin123') {
        localStorage.setItem('admin_auth', 'true');
        onLoginSuccess();
      } else {
        setError(true);
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Almacén Pro</h2>
          <p className="text-xs text-zinc-400 mt-1">Panel de Administración</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              Contraseña de Administrador
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="••••••••"
              autoFocus
              className={`w-full px-3.5 py-2.5 bg-zinc-950/80 border rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-zinc-700/80 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-rose-400 mt-1.5 font-medium"
              >
                Contraseña incorrecta. Intente de nuevo.
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Ingresar como Administrador</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {onEnterOperarioMode && (
          <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
            <button
              type="button"
              onClick={onEnterOperarioMode}
              className="w-full py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-indigo-300 hover:text-indigo-200 border border-zinc-700 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ChefHat className="w-4 h-4 text-indigo-400" />
              <span>¿Eres operario? Registro de Producción</span>
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Acceso seguro protegido</span>
        </div>
      </motion.div>
    </div>
  );
};
