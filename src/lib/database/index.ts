import "server-only";
import { Pool, type QueryResultRow } from "pg";
import { getDatabaseConfig } from "./config";

const databaseGlobal = globalThis as typeof globalThis & { sitelsegPool?: Pool };

function getPool(): Pool {
  if (!databaseGlobal.sitelsegPool) {
    const pool = new Pool(getDatabaseConfig());
    pool.on("error", () => {
      // No registrar errores crudos: pueden contener datos de conexión o consultas.
      console.error("PostgreSQL: se perdió una conexión inactiva del pool.");
    });
    databaseGlobal.sitelsegPool = pool;
  }
  return databaseGlobal.sitelsegPool;
}

/** Usar placeholders $1, $2… y pasar los valores por separado. */
export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  try {
    return await getPool().query<T>(text, values);
  } catch {
    throw new Error("No se pudo consultar PostgreSQL. Revisa la configuración y disponibilidad de la base.");
  }
}
