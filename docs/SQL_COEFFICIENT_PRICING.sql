-- ================================
-- COEFFICIENT PRICING TABLE
-- ================================

-- Create coefficient_pricing table
CREATE TABLE IF NOT EXISTS coefficient_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES residential_complexes(id) ON DELETE CASCADE,
  coefficient NUMERIC(10, 6) NOT NULL,
  meters NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(complex_id, coefficient)
);

-- Create index for efficient queries
-- Compound index: (complex_id, coefficient) ensures specificity to each complex
CREATE INDEX IF NOT EXISTS idx_coefficient_pricing_complex_coefficient 
  ON coefficient_pricing(complex_id, coefficient);


-- ================================
-- MODIFY APARTMENTS TABLE
-- ================================

-- Add coefficient_pricing_id column to apartments table
ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS coefficient_pricing_id UUID REFERENCES coefficient_pricing(id) ON DELETE SET NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_apartments_coefficient_pricing_id 
  ON apartments(coefficient_pricing_id);

-- Remove redundant copropriety_coefficient column (now in coefficient_pricing table)
ALTER TABLE apartments 
DROP COLUMN IF EXISTS copropriety_coefficient;

-- ================================
-- MIGRATION: Populate coefficient_pricing from existing apartments
-- ================================
-- This script groups existing apartments by coefficient and complex,
-- creating pricing records for each combination.
-- NOTE: This assumes copropriety_coefficient still exists at migration time

INSERT INTO coefficient_pricing (complex_id, coefficient, meters, price)
SELECT 
  b.complex_id,
  a.copropriety_coefficient,
  0 as meters,
  0 as price
FROM apartments a
JOIN blocks b ON a.block_id = b.id
WHERE NOT EXISTS (
  SELECT 1 FROM coefficient_pricing cp 
  WHERE cp.complex_id = b.complex_id 
  AND cp.coefficient = a.copropriety_coefficient
)
GROUP BY b.complex_id, a.copropriety_coefficient
ON CONFLICT (complex_id, coefficient) DO NOTHING;

-- Link apartments to their coefficient_pricing records
UPDATE apartments a
SET coefficient_pricing_id = cp.id
FROM coefficient_pricing cp
JOIN blocks b ON a.block_id = b.id
WHERE cp.complex_id = b.complex_id
AND cp.coefficient = a.copropriety_coefficient
AND a.coefficient_pricing_id IS NULL;
