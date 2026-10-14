CREATE TABLE IF NOT EXISTS movimientos (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL,
    descripcion VARCHAR(150) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    fecha DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_tipo_check CHECK (tipo IN ('ingreso', 'gasto'))
);

CREATE INDEX IF NOT EXISTS idx_movimientos_fecha
ON movimientos (fecha DESC, id DESC);

-- Compatibilidad con instalaciones creadas antes de agregar created_at.
ALTER TABLE movimientos
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Compatibilidad con instalaciones creadas antes de agregar la restriccion de tipo.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'movimientos_tipo_check'
    ) THEN
        ALTER TABLE movimientos
        ADD CONSTRAINT movimientos_tipo_check CHECK (tipo IN ('ingreso', 'gasto'));
    END IF;
END $$;
