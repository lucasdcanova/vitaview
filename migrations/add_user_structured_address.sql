-- Adds structured address fields to the doctor's user record so the office
-- address can be entered in Minha Clínica and rendered on prescriptions.
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
