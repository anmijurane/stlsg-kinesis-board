export const TIME_ZONE = "America/Mexico_City";
export const GROUPS = ["Tráfico y uso en el tiempo", "Rutinas y grupos musculares", "Satisfacción y experiencia", "Sedes y ciudades", "Recorridos e interacciones"] as const;
export type Source = "traffic" | "sessions" | "page_views" | "events" | "feedback" | "routine_feedback";
export type ChartKind = "bar" | "line" | "pie" | "heatmap" | "funnel";
export type Filters = Record<string, string>;
export interface Choice { value: string; label: string }
export interface Control { key: string; label: string; options?: Choice[]; dimension?: string; multiple?: boolean; numeric?: boolean }
export interface ChartDefinition { id: string; title: string; group: number; source: Source; kind: ChartKind; description: string; controls: Control[]; defaults: Filters }
const choices = (values: [string, string][]): Choice[] => values.map(([value, label]) => ({ value, label }));
const city: Control = { key: "city", label: "Ciudad", dimension: "cities", multiple: true };
const club: Control = { key: "club", label: "Sede", dimension: "clubs", multiple: true };
const routine: Control = { key: "routine", label: "Rutina", dimension: "routines" };
const level: Control = { key: "level", label: "Nivel", dimension: "levels" };
const day: Control = { key: "day", label: "Día de rutina", dimension: "days" };
const exercise: Control = { key: "exercise", label: "Ejercicio", dimension: "exercises" };
const order: Control = { key: "order", label: "Orden", options: choices([["desc", "Mayor a menor"], ["asc", "Menor a mayor"]]) };
const limit: Control = { key: "limit", label: "Resultados", options: choices([["10", "10"], ["20", "20"], ["all", "Todos"]]) };
const granularity: Control = { key: "granularity", label: "Agrupar por", options: choices([["hour", "Hora"], ["day", "Día"], ["week", "Semana"], ["month", "Mes"]]) };
const minSample: Control = { key: "minSample", label: "Mínimo de respuestas/sesiones", numeric: true };
const percent: Control = { key: "display", label: "Presentación", options: choices([["count", "Recuento"], ["percent", "Porcentaje"]]) };
const metric = (options: [string, string][]): Control => ({ key: "metric", label: "Indicador", options: choices(options) });
const emoji: Control = { key: "emoji", label: "Valoración", dimension: "emojis" };
const definition = (id: string, title: string, group: number, source: Source, kind: ChartKind, description: string, controls: Control[], defaults: Filters = {}): ChartDefinition => {
  const initial = { granularity: "day", order: "desc", limit: "10", display: "count", minSample: "1", ...defaults };
  return { id, title, group, source, kind, description, controls, defaults: Object.fromEntries(Object.entries(initial).filter(([key]) => controls.some((control) => control.key === key))) };
};
export const CHARTS: ChartDefinition[] = [
  definition("trafico", "Volumen y tendencias", 0, "traffic", "line", "Sesiones por fecha de inicio y páginas por fecha de visita. Son series de actividad, no usuarios únicos.", [club, city, granularity, { key: "series", label: "Series", options: choices([["all", "Sesiones y páginas"], ["sessions", "Sesiones"], ["pages", "Páginas vistas"]]) }], { series: "all" }),
  definition("horarios", "Días y horarios pico", 0, "sessions", "heatmap", "Sesiones iniciadas por día de la semana y hora local.", [club, city, { key: "weekdays", label: "Días de semana", multiple: true, options: choices([["1", "Lunes"], ["2", "Martes"], ["3", "Miércoles"], ["4", "Jueves"], ["5", "Viernes"], ["6", "Sábado"], ["7", "Domingo"]]) }, { key: "hourMin", label: "Desde hora (0–23)", numeric: true }, { key: "hourMax", label: "Hasta hora (0–23)", numeric: true }], { hourMin: "0", hourMax: "23" }),
  definition("compromiso", "Duración y compromiso", 0, "sessions", "line", "Cohorte por inicio de sesión. Duración = última actividad − primera actividad; páginas por sesión; rebote = una página O ningún evento. Incluye sesiones largas y muestra la mediana.", [club, city, routine, { key: "durationMin", label: "Duración mínima (min)", numeric: true }, { key: "durationMax", label: "Duración máxima (min)", numeric: true }, granularity, metric([["duration", "Duración: media y mediana (min)"], ["depth", "Páginas por sesión"], ["bounce", "Rebote (%)"]])], { metric: "duration" }),
  definition("rutinas", "Rutinas más consultadas", 1, "page_views", "bar", "Solo páginas de rutina (/routine/). Cuenta consultas o sesiones distintas que consultaron cada rutina; no implica finalización.", [club, city, routine, level, metric([["views", "Consultas"], ["sessions", "Sesiones con consultas"]]), order], { metric: "views" }),
  definition("niveles", "Preferencia por nivel", 1, "page_views", "bar", "Consultas de páginas de rutina por sus cuatro niveles registrados.", [club, city, routine, percent]),
  definition("ejercicios", "Consultas de ejercicios", 1, "events", "bar", "Eventos exercise_view por ejercicio. El orden ascendente incluye ejercicios del catálogo sin consultas.", [club, routine, level, day, exercise, { key: "muscle", label: "Grupo muscular", dimension: "muscles" }, { key: "zone", label: "Zona", dimension: "zones" }, order, limit]),
  definition("grupos-musculares", "Grupos musculares y zonas", 1, "events", "bar", "Consultas de ejercicios por la categoría completa del catálogo. No confirma entrenamiento realizado.", [club, routine, level, day, exercise, { key: "grouping", label: "Agrupación", options: choices([["muscle", "Grupo muscular"], ["zone", "Zona"]]) }], { grouping: "muscle" }),
  definition("dias-rutina", "Actividad por día de rutina", 1, "events", "bar", "Consultas de ejercicios por day_routine. No representa progreso longitudinal de personas.", [club, routine, level, day, metric([["views", "Consultas"], ["sessions", "Sesiones"]]), { key: "breakdown", label: "Desglose", options: choices([["level", "Por nivel"], ["none", "Total"]]) }], { metric: "views", breakdown: "level" }),
  definition("satisfaccion", "Satisfacción general", 2, "feedback", "pie", "CSAT = happy / (happy + neutral + sad). Las reacciones y su evolución usan la fecha del feedback.", [club, city, emoji, { key: "comments", label: "Comentario", options: choices([["all", "Todos"], ["yes", "Con comentario"], ["no", "Sin comentario"]]) }, granularity], { comments: "all" }),
  definition("valoraciones-ejercicios", "Valoraciones de ejercicios", 2, "routine_feedback", "bar", "Liked y disliked vinculados directamente a ejercicios. Disliked se dibuja negativo; no significa dificultad ni queja confirmada.", [club, routine, level, day, exercise, { key: "rating", label: "Valoración", dimension: "ratings" }, minSample, order]),
  definition("comentarios", "Temas de comentarios", 2, "feedback", "bar", "Clasificación aproximada por palabras clave: problemas técnicos → dudas de ejecución → sugerencias → otros/sin clasificar. Reglas revisables, sin servicios externos.", [club, city, emoji, { key: "category", label: "Tema", dimension: "categories" }, { key: "search", label: "Buscar en comentarios" }]),
  definition("satisfaccion-rutinas-sedes", "Satisfacción por rutina y sede", 2, "feedback", "bar", "Sedes: happy / emojis válidos del feedback general. Rutinas: liked / (liked + disliked) de feedback_routine. Fuentes separadas, sin atribución inferida.", [{ key: "mode", label: "Comparar", options: choices([["club", "Sedes · satisfacción general"], ["routine", "Rutinas · aprobación directa"]]) }, club, city, routine, level, minSample, order], { mode: "club" }),
  definition("sedes", "Comparativa de sedes", 3, "sessions", "bar", "Sesiones por inicio; páginas y eventos de esas sesiones. Satisfacción usa fecha de feedback y muestra el número de respuestas.", [city, club, metric([["sessions", "Sesiones"], ["pages", "Páginas vistas"], ["engagement", "Eventos por sesión"], ["satisfaction", "Satisfacción (%)"]]), minSample, order, limit], { metric: "sessions" }),
  definition("ciudades", "Distribución por ciudad", 3, "sessions", "bar", "Sesiones iniciadas en el periodo y actividad de esas sesiones, agrupadas por ciudad.", [city, metric([["sessions", "Sesiones"], ["pages", "Páginas vistas"], ["events", "Eventos"]]), percent], { metric: "sessions" }),
  definition("embudo", "Embudo de consultas y feedback", 4, "sessions", "funnel", "Sesiones → rutina → ejercicio → feedback posterior, en orden temporal dentro de la misma sesión. No mide reproducción ni finalización.", [club, city, routine, level, { key: "feedbackType", label: "Feedback final", options: choices([["all", "Cualquier feedback"], ["general", "General"], ["routine", "De rutina"], ["exercise", "De ejercicio"]]) }], { feedbackType: "all" }),
  definition("ultimo-paso", "Último paso observado", 4, "sessions", "bar", "Último evento registrado de cada sesión; no confirma abandono. Los filtros de rutina/ejercicio seleccionan sesiones y luego se examina su último evento real.", [club, routine, level, day, exercise, { key: "grouping", label: "Agrupación", options: choices([["step", "Último tipo de evento"], ["exercise", "Último ejercicio observado"]]) }, order, limit], { grouping: "step" }),
  definition("interacciones", "Tipos de interacción", 4, "events", "bar", "Frecuencia y evolución de los tipos de evento realmente registrados.", [club, city, { key: "event", label: "Evento", dimension: "events" }, routine, level, day, exercise, { key: "grouping", label: "Agrupación", options: choices([["type", "Por tipo"], ["time", "En el tiempo"]]) }, granularity], { grouping: "type" }),
  definition("sistemas-operativos", "Sistemas operativos", 0, "sessions", "bar", "Sesiones iniciadas por sistema operativo registrado.", [club, city, { key: "os", label: "Sistema operativo", dimension: "systems" }, limit]),
];
export const getChart = (id: string) => CHARTS.find((chart) => chart.id === id);
export const LABELS: Record<string, string> = { muscle_gain: "Ganancia muscular", adaptation: "Adaptación", fat_burning: "Quema de grasa", health: "Salud y bienestar", happy: "Satisfecho", neutral: "Neutral", sad: "Insatisfecho", liked: "Me gusta", disliked: "No me gusta", home: "Inicio", routine_view: "Consulta de rutina", exercise_view: "Consulta de ejercicio", attention_view: "Atención", feedback_routine: "Valoración de rutina", feedback_exercise: "Valoración de ejercicio", demographic_form: "Formulario demográfico", technical: "Problemas técnicos", execution: "Dudas de ejecución", suggestion: "Sugerencias", other: "Otros / sin clasificar" };
export const labelFor = (value: string) => LABELS[value] ?? value;
export interface Metadata { overview?: { sessions: number; pages: number; events: number; feedback: number; satisfaction: number | null }; dates: Partial<Record<Source, string[]>>; dimensions: Record<string, Choice[]> }
export interface Datum { id: string; label: string; value: number; sample: number; series: string; bucket?: string; selection?: string }
export interface CommentRow { id: string; comment: string; emoji: string; category: string; date: string; club: string }
export interface ChartResult { rows: Datum[]; trend?: Datum[]; comments?: CommentRow[]; commentTotal?: number; updatedAt: string; sample: number; unit: string; error?: string }
export function sourceFor(chart: ChartDefinition, filters: Filters): Source {
  if (chart.id === "satisfaccion-rutinas-sedes" && filters.mode === "routine") return "routine_feedback";
  if (chart.id === "sedes" && filters.metric === "satisfaction") return "feedback";
  return chart.source;
}
