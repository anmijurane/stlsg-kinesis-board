"use client";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { ResponsiveFunnel } from "@nivo/funnel";
import type { ChartKind, Datum } from "@/lib/analytics/registry";
const colors = ["#367ef6", "#0a78ba", "#22c0f8", "#7251ad", "#a33f63", "#63758d"];
const theme = { fontFamily: "system-ui, sans-serif", fontSize: 11, text: { fill: "#34445a" }, tooltip: { container: { color: "#1b1c1e", background: "#fff", fontSize: 13 } } };
const fmt = (value: number) => value.toLocaleString("es-MX", { maximumFractionDigits: 2 });
const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export default function NivoChart({ rows, kind, onSelect, unit }: { rows: Datum[]; kind: ChartKind; onSelect: (id: string) => void; unit: string }) {
  const common = { theme, animate: false, colors, margin: { top: 24, right: 24, bottom: 75, left: 85 } };
  if (kind === "line") {
    const series = [...new Set(rows.map((r) => r.series))].map((id) => ({ id, data: rows.filter((r) => r.series === id).map((r) => ({ x: r.id, y: r.value })) }));
    const buckets = [...new Set(rows.map((r) => r.id))].sort();
    const step = Math.max(1, Math.ceil(buckets.length / 6));
    return <ResponsiveLine {...common} data={series} xScale={{ type: "point" }} yScale={{ type: "linear", min: "auto", max: "auto" }} enableSlices="x" enablePoints={buckets.length < 150} pointSize={6} axisBottom={{ tickRotation: -30, tickValues: buckets.filter((_, i) => i % step === 0), format: (value) => String(value).slice(5, 16) }} yFormat={(value) => `${fmt(Number(value))} ${unit}`} onClick={(point) => onSelect(String("points" in point ? point.points[0]?.data.x : point.data.x))} sliceTooltip={({ slice }) => <div className="chart-tooltip"><strong>{String(slice.points[0]?.data.x)}</strong>{slice.points.map((p) => <p key={p.id}>{p.seriesId}: {fmt(Number(p.data.y))} {unit}</p>)}</div>} legends={[{ anchor: "bottom", direction: "row", translateY: 64, itemWidth: 150, itemHeight: 16 }]} role="img" ariaLabel="Evolución temporal; consulta la tabla para seleccionar un intervalo con teclado." />;
  }
  if (kind === "pie") return <ResponsivePie {...common} data={rows.map((r) => ({ id: r.id, label: r.label, value: r.value }))} innerRadius={0.65} padAngle={1} cornerRadius={3} activeOuterRadiusOffset={5} arcLabelsSkipAngle={12} arcLabel={(d) => `${fmt(d.value / Math.max(1, rows.reduce((s,r)=>s+r.value,0)) * 100)}%`} arcLinkLabel={(d) => String(d.label)} margin={{ top: 30, right: 95, bottom: 30, left: 95 }} onClick={(d) => onSelect(String(d.id))} tooltip={({ datum }) => <div className="chart-tooltip">{datum.label}: {fmt(datum.value)} respuestas</div>} role="img" aria-label="Distribución de valoraciones; datos disponibles en la tabla." />;
  if (kind === "heatmap") {
    const ids = [...new Set(rows.map((r) => r.id))].sort((a,b)=>Number(a)-Number(b));
    const hours = [...new Set(rows.map((r) => r.label))].sort((a,b)=>Number(a)-Number(b));
    const data = ids.map((id) => ({ id: weekdays[Number(id)-1], data: hours.map((hour) => ({ x: hour, y: rows.find((r)=>r.id===id && r.label===hour)?.value ?? 0, selection: `${id}:${hour}` })) }));
    return <ResponsiveHeatMap data={data} theme={theme} animate={false} margin={{ top: 20, right: 20, bottom: 50, left: 85 }} axisTop={null} axisBottom={{ format: (h) => `${h} h`, tickRotation: -45, tickValues: hours.filter((_,i)=>i%3===0) }} colors={{ type: "sequential", scheme: "blues" }} emptyColor="#eef3f9" enableLabels={false} onClick={(cell)=>onSelect(cell.data.selection)} tooltip={({cell})=><div className="chart-tooltip">{cell.serieId}, {cell.data.x} h: {fmt(cell.value ?? 0)} sesiones</div>} role="img" ariaLabel="Sesiones por día y hora; consulta la tabla para navegación por teclado." />;
  }
  if (kind === "funnel") return <ResponsiveFunnel {...common} data={rows.map((r) => ({ id: r.id, value: r.value, label: r.label }))} margin={{ top: 15, right: 25, bottom: 15, left: 25 }} labelColor="#fff" valueFormat={(v) => fmt(Number(v))} onClick={(part)=>onSelect(String(part.data.id))} tooltip={({part})=><div className="chart-tooltip">{part.data.label}: {fmt(part.data.value)} sesiones</div>} role="img" ariaLabel="Embudo de sesiones con etapas en orden temporal." />;
  const ids = [...new Set(rows.map((r)=>r.id))];
  const keys = [...new Set(rows.map((r)=>r.series))];
  const data = ids.map((id) => {
    const item: Record<string,string|number> = { id, label: rows.find((r)=>r.id===id)?.label || id };
    for (const key of keys) item[key] = rows.filter((r)=>r.id===id && r.series===key).reduce((sum,r)=>sum+r.value,0);
    return item;
  });
  return <ResponsiveBar {...common} data={[...data].reverse()} keys={keys} indexBy="id" layout="horizontal" padding={0.3} borderRadius={2} enableLabel={false} valueFormat={(v)=>fmt(Number(v))} axisLeft={{ format:(value)=> {const label=String(data.find((r)=>r.id===value)?.label || value);return label.length>20?`${label.slice(0,19)}…`:label;}, tickSize:0, tickPadding:10 }} axisBottom={{ tickValues:4, legend:unit,legendOffset:38,legendPosition:"middle" }} margin={{ top:20,right:25,bottom:55,left:145 }} onClick={(d)=>onSelect(String(d.indexValue))} tooltip={({data,id,value,color})=><div className="chart-tooltip" style={{borderLeft:`3px solid ${color}`}}><strong>{data.label}</strong><p>{id}: {fmt(value)} {unit}</p></div>} role="img" ariaLabel="Comparación de categorías; consulta la tabla para cifras y filtros por teclado." />;
}
