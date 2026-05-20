-- Add CRM UF (state) column for legally compliant prescriptions
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_state TEXT;
