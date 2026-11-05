import { notFound } from "next/navigation";
import { AnalyticsBoard } from "@/components/analytics/analytics-board";
import { getChart, type Metadata } from "@/lib/analytics/registry";
import { getAnalyticsMetadata } from "@/lib/database/analytics";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function ChartPage({ params }: { params: Promise<{ grafica: string }> }) {
  const { grafica } = await params;

  if (!getChart(grafica)) notFound();

  let metadata: Metadata = { dates: {}, dimensions: {} };
  let error: string | undefined;

  if (process.env.DATABASE_URL?.trim()) {
    try {
      metadata = await getAnalyticsMetadata();
    }
    catch {
      error = "No se pudieron cargar los filtros. Vuelve a cargar para reintentar.";
    }
  } else {
    error = "Configura la conexión de PostgreSQL para consultar esta gráfica."
  };

  return <AnalyticsBoard metadata={metadata} chartId={grafica} error={error} />;
}
