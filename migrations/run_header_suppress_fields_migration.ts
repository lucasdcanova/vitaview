import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("❌ DATABASE_URL não está definida");
        process.exit(1);
    }
    const pool = new Pool({ connectionString });
    try {
        console.log("🔄 Adicionando header_suppress_fields + migrando image/composed → minimal...");
        await pool.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_suppress_fields TEXT;`);
        const image = await pool.query(`UPDATE clinics SET header_mode = 'minimal' WHERE header_mode = 'image' RETURNING id;`);
        const composed = await pool.query(`UPDATE clinics SET header_mode = 'minimal' WHERE header_mode = 'composed' RETURNING id;`);
        console.log(`✅ Migration concluída — ${image.rowCount} image, ${composed.rowCount} composed → minimal`);
    } catch (err) {
        console.error("❌ Falha na migration", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
