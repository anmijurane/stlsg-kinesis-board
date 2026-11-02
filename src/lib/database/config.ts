import type { PoolConfig } from "pg";

// Sin efectos al importar: la conexión se configura solo cuando se solicita.
export function getDatabaseConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString?.trim()) {
    throw new Error("Falta configurar DATABASE_URL en .env.local.");
  }

  return {
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
    query_timeout: 12_000,
    application_name: "sitelseg-analytics",
  };
}
