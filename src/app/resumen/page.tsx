import { AnalyticsBoard } from "@/components/analytics/analytics-board";
import { getAnalyticsMetadata } from "@/lib/database/analytics";
import type { Metadata } from "@/lib/analytics/registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Summary() {

  let metadata: Metadata = { dates: {}, dimensions: {} };
  let error: string | undefined;

  if (process.env.DATABASE_URL?.trim()) {
    try { metadata = await getAnalyticsMetadata(); }
    catch { error = "No se pudo consultar la base de datos. Vuelve a cargar para reintentar."; }
  } else {
    error = "Configura la conexión de PostgreSQL para consultar el resumen."
  };

  return <AnalyticsBoard metadata={metadata} error={error} />;
}
