-- Stores the physical paper margins for "preprinted" header mode.
-- Format: JSON { "paperWidthMm": 210, "paperHeightMm": 148.5, "orientation": "landscape",
--                "topMm": 30, "bottomMm": 15, "leftMm": 12, "rightMm": 12 }
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS preprinted_config TEXT;
