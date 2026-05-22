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
        console.log("🔄 Adicionando cnpj/website em users...");
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cnpj TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;`);
        console.log("✅ Migration concluída");
    } catch (err) {
        console.error("❌ Falha na migration", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
