import { type ChartDefinition, type Filters, type Metadata, sourceFor } from "./registry";
export function defaultsFor(chart: ChartDefinition, metadata: Metadata, input: Filters = {}): Filters {
  const filters = { ...chart.defaults, ...input };
  const dates = metadata.dates[sourceFor(chart, filters)] ?? [];
  const end = dates.at(-1);
  if (!end) return filters;
  const start = new Date(`${end}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  return { ...filters, from: input.from || dates.find((d) => d >= start.toISOString().slice(0, 10)) || dates[0], to: input.to || end };
}
export function validateFilters(chart: ChartDefinition, metadata: Metadata, input: Filters): Filters {
  const allowed = new Set(["from", "to", "selection", "page", ...chart.controls.map((c) => c.key)]);
  const clean: Filters = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key) || typeof value !== "string" || value.length > 500) throw new Error("Filtros no válidos.");
    if (value) clean[key] = value;
  }
  const filters = defaultsFor(chart, metadata, clean);
  if (chart.id === "satisfaccion-rutinas-sedes" && filters.mode !== "routine") { delete filters.routine; delete filters.level; }
  const dates = metadata.dates[sourceFor(chart, filters)] ?? [];
  if (!dates.length) return filters;
  if (!dates.includes(filters.from) || !dates.includes(filters.to) || filters.from > filters.to) throw new Error("Selecciona fechas disponibles y un intervalo válido.");
  for (const control of chart.controls) {
    const value = filters[control.key];
    if (!value) continue;
    const options = control.options || (control.dimension ? metadata.dimensions[control.dimension] || [] : undefined);
    if (options && !(control.multiple ? value.split(",") : [value]).every((v) => options.some((o) => o.value === v))) throw new Error(`Selecciona un valor válido para ${control.label}.`);
    if (control.numeric && (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) > 10_000_000)) throw new Error(`Valor no válido: ${control.label}.`);
  }
  for (const key of ["minSample", "hourMin", "hourMax"]) if (filters[key] && !Number.isInteger(Number(filters[key]))) throw new Error("Valor no válido: se requiere un número entero.");
  if (Number(filters.hourMin || 0) > Number(filters.hourMax || 23) || Number(filters.hourMax || 23) > 23) throw new Error("El intervalo horario debe estar entre 0 y 23.");
  if (filters.durationMax && Number(filters.durationMin || 0) > Number(filters.durationMax)) throw new Error("La duración mínima supera la máxima.");
  if (filters.page && (!/^\d+$/.test(filters.page) || Number(filters.page) < 1 || Number(filters.page) > 100000)) throw new Error("Página no válida.");
  return filters;
}
export function readFilters(chart: ChartDefinition, params: URLSearchParams): Filters {
  const result: Filters = {};
  const prefix = `${chart.id}.`;
  params.forEach((value, key) => { if (key.startsWith(prefix)) result[key.slice(prefix.length)] = value; });
  return result;
}
export function writeFilters(params: URLSearchParams, chart: ChartDefinition, filters: Filters) {
  const next = new URLSearchParams(params);
  for (const key of [...next.keys()]) if (key.startsWith(`${chart.id}.`)) next.delete(key);
  for (const key of ["from", "to", "selection", "page", ...chart.controls.map((c) => c.key)]) if (filters[key]) next.set(`${chart.id}.${key}`, filters[key]);
  return next;
}
