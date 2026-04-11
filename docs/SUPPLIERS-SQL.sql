-- Suppliers Table Schema
-- Tabla para almacenar el directorio de proveedores de cada complejo residencial

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES public.complexes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_suppliers_complex_id ON public.suppliers(complex_id);
CREATE INDEX idx_suppliers_is_active ON public.suppliers(is_active);
CREATE INDEX idx_suppliers_name ON public.suppliers(name);
CREATE INDEX idx_suppliers_complex_active ON public.suppliers(complex_id, is_active);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see suppliers for their complex
CREATE POLICY suppliers_select_policy ON public.suppliers
  FOR SELECT
  USING (
    complex_id IN (
      SELECT id FROM public.complexes 
      WHERE id = (
        SELECT complex_id FROM public.users 
        WHERE auth.uid() = users.id::uuid
      )
    )
  );

CREATE POLICY suppliers_insert_policy ON public.suppliers
  FOR INSERT
  WITH CHECK (
    complex_id IN (
      SELECT id FROM public.complexes 
      WHERE id = (
        SELECT complex_id FROM public.users 
        WHERE auth.uid() = users.id::uuid
      )
    )
  );

CREATE POLICY suppliers_update_policy ON public.suppliers
  FOR UPDATE
  USING (
    complex_id IN (
      SELECT id FROM public.complexes 
      WHERE id = (
        SELECT complex_id FROM public.users 
        WHERE auth.uid() = users.id::uuid
      )
    )
  );

CREATE POLICY suppliers_delete_policy ON public.suppliers
  FOR DELETE
  USING (
    complex_id IN (
      SELECT id FROM public.complexes 
      WHERE id = (
        SELECT complex_id FROM public.users 
        WHERE auth.uid() = users.id::uuid
      )
    )
  );

-- Test data (optional - comment out in production)
-- INSERT INTO public.suppliers (complex_id, name, category, contact_name, email, phone, tax_id, is_active)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000000', 'Plomería Expresa', 'Servicios', 'Juan García', 'juan@plomeria.com', '+57-300-1234567', '123456789-1', true),
--   ('00000000-0000-0000-0000-000000000000', 'Pinturas y Acabados', 'Materiales', 'María López', 'maria@pinturas.com', '+57-300-2345678', '987654321-1', true);
