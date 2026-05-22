-- Adds an opt-in toggle that lets the clinic use its uploaded logo as the
-- document watermark, replacing the discrete VitaView mark.
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_watermark_use_logo BOOLEAN DEFAULT FALSE;
