-- PQRS Module Database Schema
-- Peticiones, Quejas, Reclamos y Sugerencias (Requests, Complaints, Claims and Suggestions)
-- 
-- This migration creates the PQRS table and related indexes for the residential admin app.

-- Create PQRS Type enum
CREATE TYPE pqrs_type AS ENUM ('PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA');

-- Create PQRS Status enum
CREATE TYPE pqrs_status AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- Create PQRS table
CREATE TABLE IF NOT EXISTS pqrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES residential_complexes(id) ON DELETE CASCADE,
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  type pqrs_type NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status pqrs_status NOT NULL DEFAULT 'PENDING',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Indexes for efficient querying
  CONSTRAINT pqrs_unique_per_complex CHECK (complex_id IS NOT NULL)
);

-- Create indexes for common queries
-- Primary index for cursor-based pagination with status filter
CREATE INDEX IF NOT EXISTS idx_pqrs_complex_status_created_id 
  ON pqrs(complex_id, status, created_at DESC, id DESC);

-- Index for cursor-based pagination without status filter
CREATE INDEX IF NOT EXISTS idx_pqrs_complex_created_id 
  ON pqrs(complex_id, created_at DESC, id DESC);

-- Index for apartment lookups
CREATE INDEX IF NOT EXISTS idx_pqrs_apartment_id 
  ON pqrs(apartment_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_pqrs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pqrs_update_updated_at
  BEFORE UPDATE ON pqrs
  FOR EACH ROW
  EXECUTE FUNCTION update_pqrs_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE pqrs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins of the complex can read PQRS
CREATE POLICY "pqrs_read_admin_only"
  ON pqrs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM complex_members
      WHERE complex_members.complex_id = pqrs.complex_id
        AND complex_members.user_id = auth.uid()
        AND complex_members.role = 'ADMIN'
    )
  );

-- RLS Policy: Only admins of the complex can update PQRS
CREATE POLICY "pqrs_update_admin_only"
  ON pqrs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM complex_members
      WHERE complex_members.complex_id = pqrs.complex_id
        AND complex_members.user_id = auth.uid()
        AND complex_members.role = 'ADMIN'
    )
  );

-- RLS Policy: Only system can insert PQRS (residents create via API, not directly)
CREATE POLICY "pqrs_insert_system_only"
  ON pqrs FOR INSERT
  WITH CHECK (false);

-- Create a view for easier apartment info retrieval
CREATE OR REPLACE VIEW pqrs_with_apartment_info AS
SELECT 
  p.id,
  p.complex_id,
  p.apartment_id,
  p.type,
  p.subject,
  p.description,
  p.status,
  p.admin_response,
  p.created_at,
  p.updated_at,
  CONCAT(b.name, ' - ', a.number) as apartment_info
FROM pqrs p
LEFT JOIN apartments a ON p.apartment_id = a.id
LEFT JOIN blocks b ON a.block_id = b.id;

-- Grant permissions
GRANT SELECT, UPDATE ON pqrs TO authenticated;
GRANT SELECT ON pqrs_with_apartment_info TO authenticated;
GRANT SELECT, UPDATE ON pqrs TO service_role;

-- Sample data (optional, for development/testing)
-- Uncomment to add sample PQRS tickets
--
-- INSERT INTO pqrs (complex_id, apartment_id, type, subject, description, status)
-- VALUES (
--   '550e8400-e29b-41d4-a716-446655440000',
--   'a70e8400-e29b-41d4-a716-446655440001',
--   'QUEJA',
--   'Ruido en las noches',
--   'Los residentes del departamento 502 hacen ruido excesivamente durante las noches.',
--   'PENDING'
-- );
