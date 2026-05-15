CREATE TABLE IF NOT EXISTS anamnesis_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_template_id TEXT,
  label TEXT NOT NULL,
  structure TEXT NOT NULL DEFAULT '',
  free_form BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamnesis_templates_user
  ON anamnesis_templates(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_anamnesis_templates_override
  ON anamnesis_templates(user_id, base_template_id)
  WHERE base_template_id IS NOT NULL;
