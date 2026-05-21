-- Stores the AI-identified body region for full-page letterhead PDFs.
-- Format: JSON { "top": 0.18, "bottom": 0.82, "left": 0.10, "right": 0.90 }
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_body_bbox TEXT;
