-- Adds a JSON map of per-field suppression so a clinic can declare which
-- prescription elements its custom letterhead already provides — the renderer
-- skips those instead of duplicating them.
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_suppress_fields TEXT;

-- Folds legacy "image" mode (banner image at the top) into the new minimalist
-- mode: the banner now lives in the Cabeçalho slot inside Minimalista. The PDF
-- mode (letterhead) stays separate because its semantics are different
-- (full-page design with content injected into an AI-detected bbox).
UPDATE clinics SET header_mode = 'minimal' WHERE header_mode = 'image';
UPDATE clinics SET header_mode = 'minimal' WHERE header_mode = 'composed';
