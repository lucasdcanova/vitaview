-- Add prescription/document letterhead configuration to clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_mode TEXT DEFAULT 'minimal';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_image_file TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_logo_file TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_clinic_name TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_address TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_phone TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_email TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_website TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_cnpj TEXT;
