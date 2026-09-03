-- ==============================================================================
-- NEVE EXPRESS - ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Incluye: Módulo de Almacenes, Inventario, Fórmulas, Departamentos y Lotes
-- ==============================================================================

-- 1. EXTENSIÓN PARA GENERAR UUIDs (Si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLA: ALMACENES / BODEGAS
-- Permite registrar almacenes dinámicos: Producción, Empaque, Cámaras Frías, etc.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS almacenes (
    id TEXT PRIMARY KEY DEFAULT ('alm_' || substr(md5(random()::text), 1, 10)),
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'general' CHECK (tipo IN ('en_proceso', 'producto_terminado', 'camara_fria', 'materia_prima', 'sucursal', 'general')),
    descripcion TEXT,
    ubicacion TEXT,
    responsable TEXT,
    capacidad_maxima INTEGER DEFAULT 1000,
    temperatura_c NUMERIC(4, 1),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_almacenes_codigo ON almacenes(codigo);
CREATE INDEX IF NOT EXISTS idx_almacenes_tipo ON almacenes(tipo);
CREATE INDEX IF NOT EXISTS idx_almacenes_active ON almacenes(is_active);

-- ==============================================================================
-- 3. TABLA: INVENTARIO (MATERIAS PRIMAS / INSUMOS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inventario (
    id TEXT PRIMARY KEY DEFAULT ('ins_' || substr(md5(random()::text), 1, 10)),
    nombre TEXT NOT NULL,
    cantidad NUMERIC(12, 3) NOT NULL DEFAULT 0,
    unidad TEXT NOT NULL DEFAULT 'kg',
    costo_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 4. TABLA: DEPARTAMENTOS (LÍNEAS OPERATIVAS Y SEDES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS departamentos (
    id TEXT PRIMARY KEY DEFAULT ('dep_' || substr(md5(random()::text), 1, 10)),
    nombre TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 5. TABLA: FÓRMULAS (RECETAS MAESTRAS DE PRODUCCIÓN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS formulas (
    id TEXT PRIMARY KEY DEFAULT ('form_' || substr(md5(random()::text), 1, 10)),
    nombre TEXT NOT NULL,
    bolas_por_bandeja INTEGER NOT NULL DEFAULT 20,
    bandejas_por_lote INTEGER NOT NULL DEFAULT 10,
    ingredientes JSONB NOT NULL DEFAULT '[]'::jsonb,
    presentaciones JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 6. TABLA: LOTES (TANDAS DE PRODUCCIÓN Y SEGUIMIENTO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS lotes (
    id TEXT PRIMARY KEY,
    producto TEXT NOT NULL,
    departamento_id TEXT NOT NULL,
    almacen_id TEXT REFERENCES almacenes(id) ON DELETE SET NULL,
    lotes_producidos INTEGER NOT NULL DEFAULT 1,
    total_bandejas INTEGER NOT NULL DEFAULT 0,
    total_bolas INTEGER NOT NULL DEFAULT 0,
    paquetes_producidos JSONB NOT NULL DEFAULT '[]'::jsonb,
    costo_lote NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'almacen1',
    ingredientes_usados JSONB NOT NULL DEFAULT '[]'::jsonb,
    latas JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Si la tabla lotes ya existía sin la columna almacen_id, se agrega automáticamente:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lotes' AND column_name = 'almacen_id'
    ) THEN
        ALTER TABLE lotes ADD COLUMN almacen_id TEXT REFERENCES almacenes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Índices de lotes
CREATE INDEX IF NOT EXISTS idx_lotes_estado ON lotes(estado);
CREATE INDEX IF NOT EXISTS idx_lotes_depto ON lotes(departamento_id);
CREATE INDEX IF NOT EXISTS idx_lotes_almacen ON lotes(almacen_id);
CREATE INDEX IF NOT EXISTS idx_lotes_created ON lotes(created_at DESC);

-- ==============================================================================
-- 7. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- Permite acceso y sincronización completa desde la app web (anon y authenticated)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE almacenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

-- Políticas para ALMACENES
DROP POLICY IF EXISTS "Permitir acceso publico a almacenes" ON almacenes;
CREATE POLICY "Permitir acceso publico a almacenes" ON almacenes FOR ALL USING (true) WITH CHECK (true);

-- Políticas para INVENTARIO
DROP POLICY IF EXISTS "Permitir acceso publico a inventario" ON inventario;
CREATE POLICY "Permitir acceso publico a inventario" ON inventario FOR ALL USING (true) WITH CHECK (true);

-- Políticas para DEPARTAMENTOS
DROP POLICY IF EXISTS "Permitir acceso publico a departamentos" ON departamentos;
CREATE POLICY "Permitir acceso publico a departamentos" ON departamentos FOR ALL USING (true) WITH CHECK (true);

-- Políticas para FÓRMULAS
DROP POLICY IF EXISTS "Permitir acceso publico a formulas" ON formulas;
CREATE POLICY "Permitir acceso publico a formulas" ON formulas FOR ALL USING (true) WITH CHECK (true);

-- Políticas para LOTES
DROP POLICY IF EXISTS "Permitir acceso publico a lotes" ON lotes;
CREATE POLICY "Permitir acceso publico a lotes" ON lotes FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 8. DATOS INICIALES (SEMILLA / SEED DATA) PARA ALMACENES
-- ==============================================================================
INSERT INTO almacenes (id, codigo, nombre, tipo, descripcion, ubicacion, responsable, capacidad_maxima, temperatura_c, is_active)
VALUES
    (
        'almacen1',
        'ALM-001',
        'Almacén 1 (Producción y En Proceso)',
        'en_proceso',
        'Recepción de bandejas recién salidas de amasado y moldeado para reposo.',
        'Planta Central - Área de Producción',
        'Jefe de Turno de Producción',
        1500,
        18.0,
        TRUE
    ),
    (
        'almacen2',
        'ALM-002',
        'Almacén 2 (Producto Terminado y Empaque)',
        'producto_terminado',
        'Almacenamiento de paquetes sellados y listos para despacho a sucursales.',
        'Planta Central - Área de Despacho',
        'Supervisor de Empaque y Logística',
        3000,
        20.0,
        TRUE
    ),
    (
        'almacen3',
        'CAM-001',
        'Cámara Fría Central (Refrigeración)',
        'camara_fria',
        'Cámara con control térmico para insumos lácteos y productos congelados.',
        'Sector Frío - Bahía 2',
        'Encargado de Frío y Calidad',
        800,
        -18.0,
        TRUE
    ),
    (
        'almacen4',
        'BOD-001',
        'Bodega General de Materias Primas',
        'materia_prima',
        'Almacenamiento de harinas, azúcares, esencias y cajas de embalaje.',
        'Galpón Principal - Sector A',
        'Jefe de Almacén General',
        5000,
        22.0,
        TRUE
    )
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    ubicacion = EXCLUDED.ubicacion,
    responsable = EXCLUDED.responsable;

-- Actualizar lotes existentes para vincularlos con el almacén correspondiente si aplica
UPDATE lotes
SET almacen_id = 'almacen1'
WHERE estado = 'almacen1' AND (almacen_id IS NULL OR almacen_id = '');

UPDATE lotes
SET almacen_id = 'almacen2'
WHERE estado = 'almacen2' AND (almacen_id IS NULL OR almacen_id = '');
