import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import { getDatabaseConfig } from "../src/lib/database/config";

loadEnvConfig(process.cwd(), true);

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Falta configurar DATABASE_URL en .env.local o en el entorno.");
    process.exitCode = 1;
    return;
  }

  let pool: Pool | undefined;
  try {
    pool = new Pool(getDatabaseConfig());
    pool.on("error", () => {
      console.error("PostgreSQL: se interrumpió una conexión del diagnóstico.");
      process.exitCode = 1;
    });
    await pool.query("SELECT 1");
    console.log("Conexión a PostgreSQL verificada correctamente.");
  } catch {
    console.error("No se pudo conectar a PostgreSQL. Revisa las credenciales, la red y la configuración TLS.");
    process.exitCode = 1;
  } finally {
    await pool?.end();
  }
}

void main();
