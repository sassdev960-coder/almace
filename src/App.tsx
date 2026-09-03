import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { ViewType, InsumoItem, FormulaItem, DepartamentoItem, LoteItem, ToastMessage, MovimientoFinanzaItem } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/ToastContainer';
import { ExportReportModal } from './components/ExportReportModal';
import { ShareEmployeeLinkModal } from './components/ShareEmployeeLinkModal';
import { OnboardingTutorialModal } from './components/OnboardingTutorialModal';
import { DashboardView } from './components/views/DashboardView';
import { InventarioView } from './components/views/InventarioView';
import { FormulasView } from './components/views/FormulasView';
import { DepartamentosView } from './components/views/DepartamentosView';
import { ProduccionView } from './components/views/ProduccionView';
import { AlmacenView } from './components/views/AlmacenView';
import { FinanzasView } from './components/views/FinanzasView';
import { OperarioPortalView } from './components/views/OperarioPortalView';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOperarioPortal, setIsOperarioPortal] = useState<boolean>(false);
  const [initialDeptoParam, setInitialDeptoParam] = useState<string | undefined>(undefined);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // State Caches
  const [inventario, setInventario] = useState<InsumoItem[]>([]);
  const [formulas, setFormulas] = useState<FormulaItem[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoItem[]>([]);
  const [lotes, setLotes] = useState<LoteItem[]>([]);
  const [finanzas, setFinanzas] = useState<MovimientoFinanzaItem[]>([]);
  const [isSupabaseFinanzasSynced, setIsSupabaseFinanzasSynced] = useState<boolean>(true);

  // Modals
  const [isInventarioModalOpen, setIsInventarioModalOpen] = useState(false);
  const [isExportReportModalOpen, setIsExportReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Toast Dispatcher
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', title?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check URL params for employee portal link on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const modo = urlParams.get('modo');
      const portal = urlParams.get('portal');
      const depto = urlParams.get('depto');

      if (modo === 'operario' || portal === 'produccion') {
        setIsOperarioPortal(true);
        if (depto) {
          setInitialDeptoParam(depto);
        }
      }
    } catch (e) {
      console.error('Error parsing URL parameters:', e);
    }
  }, []);

  // Auth Check from storage & First time onboarding
  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      const seenTutorial = localStorage.getItem('almacen_pro_tutorial_seen');
      if (!seenTutorial) {
        setIsTutorialOpen(true);
      }
    }
  }, []);

  // Fetch all Supabase tables
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invRes, formRes, depRes, lotRes, finRes] = await Promise.all([
        supabase.from('inventario').select('*'),
        supabase.from('formulas').select('*'),
        supabase.from('departamentos').select('*'),
        supabase.from('lotes').select('*').order('created_at', { ascending: false }),
        supabase.from('finanzas_caja').select('*').order('fecha', { ascending: false }).order('created_at', { ascending: false }),
      ]);

      if (invRes.data) setInventario(invRes.data);
      if (formRes.data) setFormulas(formRes.data);
      if (depRes.data) setDepartamentos(depRes.data);
      if (lotRes.data) setLotes(lotRes.data);

      if (finRes.data && !finRes.error) {
        setFinanzas(finRes.data);
        setIsSupabaseFinanzasSynced(true);
        localStorage.setItem('almacen_pro_finanzas_fallback', JSON.stringify(finRes.data));
      } else {
        // Fallback to local storage if table doesn't exist yet in Supabase
        setIsSupabaseFinanzasSynced(false);
        const local = localStorage.getItem('almacen_pro_finanzas_fallback');
        if (local) {
          try {
            setFinanzas(JSON.parse(local));
          } catch (e) {
            setFinanzas([]);
          }
        }
      }

      if (invRes.error || formRes.error || depRes.error || lotRes.error) {
        const err = invRes.error || formRes.error || depRes.error || lotRes.error;
        console.warn('Advertencia cargando datos de Supabase:', err);
      }
    } catch (e: any) {
      console.error('Error cargando datos de Supabase:', e);
      showToast('Error de conexión con la base de datos Supabase.', 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial load when either admin or operario portal is active
  useEffect(() => {
    if (isAuthenticated || isOperarioPortal) {
      loadAllData();
    }
  }, [isAuthenticated, isOperarioPortal, loadAllData]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setIsOperarioPortal(false);
    showToast('Sesión cerrada correctamente', 'info');
  };

  // --- CRUD: INVENTARIO ---
  const handleSaveInsumo = async (item: {
    id?: string;
    nombre: string;
    cantidad: number;
    unidad: string;
    costo_unitario: number;
  }) => {
    try {
      const { error } = await supabase.from('inventario').upsert(item);
      if (error) throw error;
      showToast(`Insumo "${item.nombre}" guardado con éxito`, 'success', 'Inventario Actualizado');
      await loadAllData();
    } catch (e: any) {
      console.error('Error guardando insumo:', e);
      showToast(e.message || 'Error al guardar insumo', 'error');
      throw e;
    }
  };

  const handleDeleteInsumo = async (id: string) => {
    try {
      const { error } = await supabase.from('inventario').delete().eq('id', id);
      if (error) throw error;
      showToast('Insumo eliminado del catálogo', 'success');
      await loadAllData();
    } catch (e: any) {
      console.error('Error eliminando insumo:', e);
      showToast(e.message || 'Error al eliminar insumo', 'error');
      throw e;
    }
  };

  // --- CRUD: FÓRMULAS ---
  const handleSaveFormula = async (formula: {
    id?: string;
    nombre: string;
    bolas_por_bandeja: number;
    bandejas_por_lote: number;
    ingredientes: any[];
    presentaciones: any[];
  }) => {
    try {
      const { error } = await supabase.from('formulas').upsert(formula);
      if (error) throw error;
      showToast(`Fórmula "${formula.nombre}" guardada con éxito`, 'success', 'Fórmula Actualizada');
      await loadAllData();
    } catch (e: any) {
      console.error('Error guardando fórmula:', e);
      showToast(e.message || 'Error al guardar fórmula', 'error');
      throw e;
    }
  };

  const handleDeleteFormula = async (id: string) => {
    try {
      const { error } = await supabase.from('formulas').delete().eq('id', id);
      if (error) throw error;
      showToast('Fórmula eliminada correctamente', 'success');
      await loadAllData();
    } catch (e: any) {
      console.error('Error eliminando fórmula:', e);
      showToast(e.message || 'Error al eliminar fórmula', 'error');
      throw e;
    }
  };

  // --- CRUD: DEPARTAMENTOS ---
  const handleSaveDepartamento = async (dep: { id?: string; nombre: string; slug: string }) => {
    try {
      const { error } = await supabase.from('departamentos').upsert(dep);
      if (error) throw error;
      showToast(`Departamento "${dep.nombre}" registrado`, 'success', 'Departamento');
      await loadAllData();
    } catch (e: any) {
      console.error('Error guardando departamento:', e);
      showToast(e.message || 'Error al guardar departamento', 'error');
      throw e;
    }
  };

  const handleDeleteDepartamento = async (id: string) => {
    try {
      const { error } = await supabase.from('departamentos').delete().eq('id', id);
      if (error) throw error;
      showToast('Departamento eliminado correctamente', 'success');
      await loadAllData();
    } catch (e: any) {
      console.error('Error eliminando departamento:', e);
      showToast(e.message || 'Error al eliminar departamento', 'error');
      throw e;
    }
  };

  // --- PRODUCCIÓN / CREACIÓN DE LOTES ---
  const handleEjecutarProduccion = async ({
    formulaId,
    cantLotes,
    deptoId,
    presIdx,
  }: {
    formulaId: string;
    cantLotes: number;
    deptoId: string;
    presIdx: number;
  }) => {
    const formula = formulas.find((f) => f.id === formulaId);
    if (!formula) throw new Error('Fórmula no encontrada.');

    const presentacion = formula.presentaciones[presIdx];
    if (!presentacion) throw new Error('Presentación no válida.');

    const totalBandejas = (formula.bandejas_por_lote || 1) * cantLotes;
    const totalBolas = (formula.bolas_por_bandeja || 1) * totalBandejas;
    const maxPaquetes = Math.floor(totalBolas / (presentacion.bolas_por_paquete || 1));

    if (maxPaquetes === 0) {
      throw new Error('No alcanzan las bolas para producir al menos un paquete.');
    }

    // Verificar faltantes
    const faltantes: string[] = [];
    for (const ing of formula.ingredientes) {
      const necesario = ing.cantidad_necesaria * totalBandejas;
      const item = inventario.find((i) => i.id === ing.id);
      if (!item || item.cantidad < necesario) {
        const nom = item ? item.nombre : ing.id;
        const faltan = necesario - (item ? item.cantidad : 0);
        const und = item ? item.unidad : '';
        faltantes.push(`${nom}: faltan ${faltan.toFixed(2)} ${und}`);
      }
    }

    if (faltantes.length > 0) {
      throw new Error('Stock insuficiente:\n' + faltantes.join('\n'));
    }

    // Descontar inventario y computar costos
    let costoTotal = 0;
    const ingredientesUsados: Array<{ nombre: string; cantidad: number; unidad: string; costo: number }> = [];

    for (const ing of formula.ingredientes) {
      const item = inventario.find((i) => i.id === ing.id);
      if (!item) continue;

      const gasto = ing.cantidad_necesaria * totalBandejas;
      const costo = gasto * (item.costo_unitario || 0);
      costoTotal += costo;
      const nuevaCantidad = item.cantidad - gasto;

      ingredientesUsados.push({
        nombre: item.nombre,
        cantidad: gasto,
        unidad: item.unidad,
        costo: costo,
      });

      // Update in Supabase
      const { error: updateErr } = await supabase
        .from('inventario')
        .update({ cantidad: nuevaCantidad })
        .eq('id', item.id);

      if (updateErr) {
        console.error('Error al actualizar inventario:', updateErr);
      }
    }

    // Generar Lote ID
    const loteId = 'L-' + String(lotes.length + 1).padStart(4, '0');
    const nuevoLote = {
      id: loteId,
      producto: formula.nombre,
      departamento_id: deptoId || null,
      lotes_producidos: cantLotes,
      total_bandejas: totalBandejas,
      total_bolas: totalBolas,
      paquetes_producidos: [
        {
          gramaje: presentacion.gramaje,
          cantidad: maxPaquetes,
          bolas_por_paquete: presentacion.bolas_por_paquete,
        },
      ],
      costo_lote: costoTotal,
      estado: 'almacen1',
      ingredientes_usados: ingredientesUsados,
      latas: null,
    };

    const { error: insertErr } = await supabase.from('lotes').insert(nuevoLote);
    if (insertErr) {
      throw new Error('Error al registrar el lote: ' + insertErr.message);
    }

    showToast(`Lote ${loteId} creado y enviado a Almacén 1 (En proceso)`, 'success', 'Producción Registrada');
    await loadAllData();
    if (!isOperarioPortal) {
      setCurrentView('almacen');
    }
  };

  // --- ALMACÉN: CONFIRMAR EMPAQUE ---
  const handleConfirmarEmpaque = async (loteId: string) => {
    try {
      const { error } = await supabase.from('lotes').update({ estado: 'almacen2' }).eq('id', loteId);
      if (error) throw error;
      showToast(`Lote ${loteId} marcado como Empacado (Almacén 2)`, 'success', 'Empaque Confirmado');
      await loadAllData();
    } catch (e: any) {
      console.error('Error confirmando empaque:', e);
      showToast(e.message || 'Error al confirmar empaque', 'error');
      throw e;
    }
  };

  // --- FINANZAS / CAJA & EGRESOS ---
  const handleSaveMovimiento = async (
    mov: Omit<MovimientoFinanzaItem, 'id' | 'created_at'> & { id?: string }
  ) => {
    const newId = mov.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mov-${Date.now()}`);
    const itemToSave: MovimientoFinanzaItem = {
      ...mov,
      id: newId,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('finanzas_caja').upsert(itemToSave);
      if (error) {
        console.warn('Upsert en Supabase no disponible, guardando en respaldo local:', error);
        setIsSupabaseFinanzasSynced(false);
        const updated = [itemToSave, ...finanzas.filter((f) => f.id !== newId)];
        setFinanzas(updated);
        localStorage.setItem('almacen_pro_finanzas_fallback', JSON.stringify(updated));
        showToast(
          `${mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} guardado en almacenamiento local`,
          'success',
          'Caja & Finanzas'
        );
        return;
      }

      setIsSupabaseFinanzasSynced(true);
      showToast(
        `${mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado correctamente en Supabase`,
        'success',
        'Caja & Finanzas'
      );
      await loadAllData();
    } catch (e: any) {
      console.warn('Fallback a almacenamiento local de finanzas:', e);
      setIsSupabaseFinanzasSynced(false);
      const updated = [itemToSave, ...finanzas.filter((f) => f.id !== newId)];
      setFinanzas(updated);
      localStorage.setItem('almacen_pro_finanzas_fallback', JSON.stringify(updated));
      showToast(
        `${mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} guardado localmente`,
        'success',
        'Caja & Finanzas'
      );
    }
  };

  const handleDeleteMovimiento = async (id: string) => {
    try {
      const { error } = await supabase.from('finanzas_caja').delete().eq('id', id);
      if (error) {
        console.warn('Delete en Supabase no disponible:', error);
      }
      const updated = finanzas.filter((f) => f.id !== id);
      setFinanzas(updated);
      localStorage.setItem('almacen_pro_finanzas_fallback', JSON.stringify(updated));
      showToast('Movimiento eliminado correctamente', 'info');
    } catch (e: any) {
      const updated = finanzas.filter((f) => f.id !== id);
      setFinanzas(updated);
      localStorage.setItem('almacen_pro_finanzas_fallback', JSON.stringify(updated));
      showToast('Movimiento eliminado', 'info');
    }
  };

  const lotesPendientes = lotes.filter((l) => l.estado === 'almacen1').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white pb-20 md:pb-8">
      {/* Global Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 1. OPERARIO PORTAL VIEW (Direct access via link ?modo=operario) */}
      {isOperarioPortal && (
        <OperarioPortalView
          formulas={formulas}
          departamentos={departamentos}
          inventario={inventario}
          lotes={lotes}
          initialDepto={initialDeptoParam}
          onRefresh={loadAllData}
          isLoading={isLoading}
          onSwitchToAdmin={() => {
            setIsOperarioPortal(false);
          }}
          onEjecutarProduccion={handleEjecutarProduccion}
        />
      )}

      {/* 2. AUTH MODAL (if not authenticated and not in employee portal) */}
      {!isAuthenticated && !isOperarioPortal && (
        <AuthModal
          onLoginSuccess={() => {
            setIsAuthenticated(true);
            showToast('Bienvenido al panel de administración', 'success');
            const seenTutorial = localStorage.getItem('almacen_pro_tutorial_seen');
            if (!seenTutorial) {
              setIsTutorialOpen(true);
            }
          }}
          onEnterOperarioMode={() => {
            setIsOperarioPortal(true);
            showToast('Acceso a terminal de operarios', 'info');
          }}
        />
      )}

      {/* 3. MAIN ADMIN APP LAYOUT */}
      {isAuthenticated && !isOperarioPortal && (
        <>
          <Header
            currentView={currentView}
            isLoading={isLoading}
            onRefresh={loadAllData}
            onLogout={handleLogout}
            onOpenExportReport={() => setIsExportReportModalOpen(true)}
            onOpenShareLink={() => setIsShareModalOpen(true)}
            onOpenTutorial={() => setIsTutorialOpen(true)}
          />

          <Navigation
            currentView={currentView}
            onSelectView={setCurrentView}
            counts={{
              insumos: inventario.length,
              formulas: formulas.length,
              departamentos: departamentos.length,
              lotes: lotes.length,
              lotesPendientes: lotesPendientes,
            }}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {currentView === 'dashboard' && (
                  <DashboardView
                    inventario={inventario}
                    formulas={formulas}
                    departamentos={departamentos}
                    lotes={lotes}
                    finanzas={finanzas}
                    onNavigate={setCurrentView}
                    onOpenNuevoInsumo={() => {
                      setCurrentView('inventario');
                      setIsInventarioModalOpen(true);
                    }}
                    onOpenExportReport={() => setIsExportReportModalOpen(true)}
                    onOpenTutorial={() => setIsTutorialOpen(true)}
                  />
                )}

                {currentView === 'inventario' && (
                  <InventarioView
                    inventario={inventario}
                    onSaveInsumo={handleSaveInsumo}
                    onDeleteInsumo={handleDeleteInsumo}
                    isModalOpen={isInventarioModalOpen}
                    onOpenModal={() => setIsInventarioModalOpen(true)}
                    onCloseModal={() => setIsInventarioModalOpen(false)}
                    onOpenExportReport={() => setIsExportReportModalOpen(true)}
                  />
                )}

                {currentView === 'formulas' && (
                  <FormulasView
                    formulas={formulas}
                    inventario={inventario}
                    onSaveFormula={handleSaveFormula}
                    onDeleteFormula={handleDeleteFormula}
                  />
                )}

                {currentView === 'departamentos' && (
                  <DepartamentosView
                    departamentos={departamentos}
                    lotes={lotes}
                    onSaveDepartamento={handleSaveDepartamento}
                    onDeleteDepartamento={handleDeleteDepartamento}
                  />
                )}

                {currentView === 'produccion' && (
                  <ProduccionView
                    formulas={formulas}
                    departamentos={departamentos}
                    inventario={inventario}
                    lotes={lotes}
                    onNavigate={setCurrentView}
                    onOpenShareLink={() => setIsShareModalOpen(true)}
                    onEjecutarProduccion={handleEjecutarProduccion}
                  />
                )}

                {currentView === 'almacen' && (
                  <AlmacenView
                    lotes={lotes}
                    departamentos={departamentos}
                    onConfirmarEmpaque={handleConfirmarEmpaque}
                    onOpenExportReport={() => setIsExportReportModalOpen(true)}
                  />
                )}

                {currentView === 'finanzas' && (
                  <FinanzasView
                    movimientos={finanzas}
                    onSaveMovimiento={handleSaveMovimiento}
                    onDeleteMovimiento={handleDeleteMovimiento}
                    isSupabaseSynced={isSupabaseFinanzasSynced}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Export Report PDF Modal */}
          <ExportReportModal
            isOpen={isExportReportModalOpen}
            onClose={() => setIsExportReportModalOpen(false)}
            inventario={inventario}
            lotes={lotes}
            departamentos={departamentos}
            formulas={formulas}
            onShowToast={(type, message, title) => showToast(message, type, title)}
          />

          {/* Share Employee Link Modal */}
          <ShareEmployeeLinkModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            departamentos={departamentos}
            formulas={formulas}
            onShowToast={(type, message, title) => showToast(message, type, title)}
          />

          {/* Interactive Onboarding Tutorial Modal */}
          <OnboardingTutorialModal
            isOpen={isTutorialOpen}
            onClose={() => {
              setIsTutorialOpen(false);
              localStorage.setItem('almacen_pro_tutorial_seen', 'true');
            }}
            onNavigateToView={(view) => {
              setCurrentView(view);
              localStorage.setItem('almacen_pro_tutorial_seen', 'true');
            }}
          />
        </>
      )}
    </div>
  );
}
