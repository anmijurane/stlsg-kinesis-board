import { NextRequest, NextResponse } from "next/server";
import { getChartData } from "@/lib/database/analytics";
import { getChart, type Filters } from "@/lib/analytics/registry";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ grafica: string }> }) {

  const { grafica } = await params;

  if (!getChart(grafica)) return NextResponse.json({ error: "Gráfica no encontrada." }, { status: 404 });

  const filters: Filters = {};

  request.nextUrl.searchParams.forEach((value, key) => { filters[key] = value; });

  const result = await getChartData(grafica, filters);

  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
}
