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
        console.log("🔄 Adicionando endereço estruturado em users...");
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cep TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS street TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS number TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS complement TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;`);
        console.log("✅ Migration concluída");
    } catch (err) {
        console.error("❌ Falha na migration", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
