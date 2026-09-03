export type ViewType = 'dashboard' | 'inventario' | 'formulas' | 'departamentos' | 'produccion' | 'almacen' | 'finanzas';

export type TipoMovimiento = 'ingreso' | 'egreso';

export type CategoriaFinanza =
  | 'empleados'
  | 'agua'
  | 'electricidad'
  | 'gas'
  | 'insumos'
  | 'mantenimiento'
  | 'ventas'
  | 'otros';

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';

export interface MovimientoFinanzaItem {
  id: string;
  tipo: TipoMovimiento;
  categoria: CategoriaFinanza;
  concepto: string;
  monto: number;
  metodo_pago: MetodoPago;
  comprobante_ref?: string;
  responsable?: string;
  fecha: string; // YYYY-MM-DD
  notas?: string;
  created_at?: string;
}

export interface InsumoItem {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costo_unitario: number;
  created_at?: string;
}

export interface FormulaIngrediente {
  id: string;
  cantidad_necesaria: number;
}

export interface FormulaPresentacion {
  gramaje: number;
  bolas_por_paquete: number;
}

export interface FormulaItem {
  id: string;
  nombre: string;
  bolas_por_bandeja: number;
  bandejas_por_lote: number;
  ingredientes: FormulaIngrediente[];
  presentaciones: FormulaPresentacion[];
  created_at?: string;
}

export interface DepartamentoItem {
  id?: string;
  nombre: string;
  slug: string;
  created_at?: string;
}

export interface PaqueteProducido {
  gramaje: number;
  cantidad: number;
  bolas_por_paquete: number;
}

export interface IngredienteUsado {
  nombre: string;
  cantidad: number;
  unidad: string;
  costo: number;
}

export interface LoteItem {
  id: string;
  producto: string;
  departamento_id: string;
  lotes_producidos: number;
  total_bandejas: number;
  total_bolas: number;
  paquetes_producidos: PaqueteProducido[];
  costo_lote: number;
  estado: 'almacen1' | 'almacen2';
  ingredientes_usados: IngredienteUsado[];
  latas?: any;
  created_at?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}
