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
        console.log("🔄 Adicionando header_body_bbox em clinics...");
        await pool.query(`ALTER TABLE clinics ADD COLUMN IF NOT EXISTS header_body_bbox TEXT;`);
        console.log("✅ Migration concluída");
    } catch (err) {
        console.error("❌ Falha na migration", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
