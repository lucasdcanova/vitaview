-- Adds optional clinic extras (CNPJ, website) to the doctor's user record.
-- These show up in the office data card in Minha Clínica and are rendered on
-- the prescription footer when present.
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
