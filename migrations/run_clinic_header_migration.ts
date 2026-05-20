import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL não está definida');
        process.exit(1);
    }

    const pool = new Pool({ connectionString });

    try {
        console.log('🔄 Adicionando colunas de cabeçalho na tabela clinics...');

        await pool.query(`
            ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_mode TEXT DEFAULT 'minimal';
            ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_image_file TEXT;
            ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_logo_file TEXT;
            ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_clinic_name TEXT;
            ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_address TEXT;
            ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_phone TEXT;
            ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_email TEXT;
            ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_website TEXT;
            ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_cnpj TEXT;
        `);

        const result = await pool.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'clinics'
            AND column_name LIKE 'header_%'
            ORDER BY column_name
        `);

        console.log('✅ Colunas presentes:', result.rows.map((r) => r.column_name).join(', '));
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
