import "server-only";
import { query } from "./index";
import { cache } from "react";
import { getChart, labelFor, sourceFor, type Metadata, type Filters, type ChartResult, type Datum } from "../analytics/registry";
import { validateFilters } from "../analytics/filters";

const CACHE_MS = 300_000;
type CacheEntry<T> = { value: T; expires: number };
interface AnalyticsState {
  metadata?: CacheEntry<Metadata>;
  metadataRequest?: Promise<Metadata>;
  charts: Map<string, CacheEntry<ChartResult>>;
  inFlight: Map<string, Promise<ChartResult>>;
  active: number;
  queue: (() => void)[];
}
const analyticsGlobal = globalThis as typeof globalThis & { sitelsegAnalytics?: AnalyticsState };
const state: AnalyticsState = analyticsGlobal.sitelsegAnalytics ??= { charts: new Map(), inFlight: new Map(), active: 0, queue: [] };
async function loadMetadata(): Promise<Metadata> {
  const result = await query<{ metadata: Metadata }>(`SELECT json_build_object(
    'overview', json_build_object(
      'sessions',(SELECT count(*) FROM sessions),
      'pages',(SELECT count(*) FROM page_views),
      'events',(SELECT count(*) FROM events),
      'feedback',(SELECT count(*) FROM feedback),
      'satisfaction',(SELECT (100.0*count(*) FILTER(WHERE emoji::text='happy')/nullif(count(*) FILTER(WHERE emoji::text IN ('happy','neutral','sad')),0))::float8 FROM feedback)
    ),
    'dates', (SELECT json_object_agg(source, days) FROM (
      SELECT source, json_agg(date_value ORDER BY date_value) days FROM (
        SELECT DISTINCT 'sessions' source, (first_seen_at AT TIME ZONE 'America/Mexico_City')::date::text AS date_value FROM sessions
        UNION SELECT DISTINCT 'page_views', (visited_at AT TIME ZONE 'America/Mexico_City')::date::text FROM page_views
        UNION SELECT DISTINCT 'events', (created_at AT TIME ZONE 'America/Mexico_City')::date::text FROM events
        UNION SELECT DISTINCT 'feedback', (created_at AT TIME ZONE 'America/Mexico_City')::date::text FROM feedback
        UNION SELECT DISTINCT 'routine_feedback', (created_at AT TIME ZONE 'America/Mexico_City')::date::text FROM routine_feedback
      ) d GROUP BY source) dates),
    'dimensions', json_build_object(
      'clubs', (SELECT json_agg(json_build_object('value',id,'label',name || ' · ' || coalesce(city,'Sin ciudad')) ORDER BY name) FROM clubs),
      'cities', (SELECT json_agg(json_build_object('value',city,'label',city) ORDER BY city) FROM (SELECT DISTINCT city FROM clubs WHERE city IS NOT NULL) c),
      'routines', (SELECT json_agg(json_build_object('value',routine,'label',routine)) FROM (SELECT DISTINCT routine::text routine FROM page_views WHERE routine IS NOT NULL) r),
      'levels', (SELECT json_agg(json_build_object('value',id::text,'label',label) ORDER BY id) FROM routine_levels),
      'days', (SELECT json_agg(json_build_object('value',day_routine::text,'label','Día ' || day_routine) ORDER BY day_routine) FROM (SELECT DISTINCT day_routine FROM events WHERE day_routine IS NOT NULL) d),
      'exercises', (SELECT json_agg(json_build_object('value',id,'label',name) ORDER BY name) FROM exercises),
      'muscles', (SELECT json_agg(json_build_object('value',v,'label',v) ORDER BY v) FROM (SELECT DISTINCT muscle_group v FROM exercises WHERE muscle_group IS NOT NULL) d),
      'zones', (SELECT json_agg(json_build_object('value',v,'label',v) ORDER BY v) FROM (SELECT DISTINCT zone v FROM exercises WHERE zone IS NOT NULL) d),
      'events', (SELECT json_agg(json_build_object('value',v,'label',v) ORDER BY v) FROM (SELECT DISTINCT type::text v FROM events) d),
      'systems', (SELECT json_agg(json_build_object('value',v,'label',v) ORDER BY v) FROM (SELECT DISTINCT user_agent_os v FROM sessions WHERE user_agent_os IS NOT NULL) d),
      'emojis', json_build_array(json_build_object('value','happy','label','Satisfecho'),json_build_object('value','neutral','label','Neutral'),json_build_object('value','sad','label','Insatisfecho')),
      'ratings', json_build_array(json_build_object('value','liked','label','Me gusta'),json_build_object('value','disliked','label','No me gusta')),
      'categories', json_build_array(json_build_object('value','technical','label','Problemas técnicos'),json_build_object('value','execution','label','Dudas de ejecución'),json_build_object('value','suggestion','label','Sugerencias'),json_build_object('value','other','label','Otros / sin clasificar'))
    )) metadata`);
  const metadata = result.rows[0].metadata;
  metadata.dates ||= {};
  metadata.dates.traffic = [...new Set([...(metadata.dates.sessions || []), ...(metadata.dates.page_views || [])])].sort();
  for (const [key, choices] of Object.entries(metadata.dimensions)) metadata.dimensions[key] = (choices || []).map((choice) => ({ ...choice, label: labelFor(choice.label) }));
  return metadata;
}

async function sharedMetadata(): Promise<Metadata> {
  if (state.metadata && state.metadata.expires > Date.now()) return state.metadata.value;
  if (state.metadataRequest) return state.metadataRequest;
  const request = loadMetadata().then((value) => {
    state.metadata = { value, expires: Date.now() + CACHE_MS };
    return value;
  });
  state.metadataRequest = request;
  try { return await request; }
  finally { if (state.metadataRequest === request) state.metadataRequest = undefined; }
}
export const getAnalyticsMetadata = cache(sharedMetadata);

// All SQL fragments below are internal constants. Filter values occupy fixed placeholders.
const range = `ts >= ($1::date::timestamp AT TIME ZONE 'America/Mexico_City') AND ts < (($2::date + 1)::timestamp AT TIME ZONE 'America/Mexico_City')`;
const clubConditions = `($3::text[] IS NULL OR c.city = ANY($3)) AND ($4::text[] IS NULL OR s.club_id = ANY($4))`;
const cohort = `SELECT s.*, c.name club_name, c.city FROM sessions s LEFT JOIN clubs c ON c.id=s.club_id WHERE ${clubConditions} AND s.first_seen_at >= ($1::date::timestamp AT TIME ZONE 'America/Mexico_City') AND s.first_seen_at < (($2::date+1)::timestamp AT TIME ZONE 'America/Mexico_City')`;
const dimensions = `($5::text IS NULL OR routine=$5) AND ($6::int IS NULL OR level_id=$6) AND ($7::int IS NULL OR day_routine=$7) AND ($8::text IS NULL OR exercise_id=$8) AND ($9::text IS NULL OR muscle_group=$9) AND ($10::text IS NULL OR zone=$10) AND ($11::text IS NULL OR event_type=$11) AND ($12::text IS NULL OR emoji=$12) AND ($16::text IS NULL OR os=$16) AND ($22::text IS NULL OR rating=$22)`;
const nullFields = `NULL::text routine,NULL::int level_id,NULL::int day_routine,NULL::text exercise_id,NULL::text muscle_group,NULL::text zone,NULL::text event_type,NULL::text emoji,NULL::text comment,NULL::text rating`;
const sources = {
  sessions: `SELECT s.id, s.id session_id,s.first_seen_at ts,s.club_id,c.name club_name,c.city,s.user_agent_os os,${nullFields},extract(epoch FROM s.last_seen_at-s.first_seen_at)/60 duration FROM sessions s LEFT JOIN clubs c ON c.id=s.club_id WHERE ${clubConditions}`,
  page_views: `SELECT p.id,p.session_id,p.visited_at ts,s.club_id,c.name club_name,c.city,s.user_agent_os os,p.routine::text routine,p.level_id,NULL::int day_routine,NULL::text exercise_id,NULL::text muscle_group,NULL::text zone,NULL::text event_type,NULL::text emoji,NULL::text comment,NULL::text rating, p.page_path FROM page_views p JOIN sessions s ON s.id=p.session_id LEFT JOIN clubs c ON c.id=s.club_id WHERE ${clubConditions}`,
  events: `SELECT e.id,e.session_id,e.created_at ts,s.club_id,c.name club_name,c.city,s.user_agent_os os,e.routine::text routine,e.level_id,e.day_routine,e.exercise_id,x.muscle_group,x.zone,e.type::text event_type,NULL::text emoji,NULL::text comment,NULL::text rating,coalesce(x.name,e.exercise_name,'Sin ejercicio') exercise_name FROM events e JOIN sessions s ON s.id=e.session_id LEFT JOIN clubs c ON c.id=s.club_id LEFT JOIN exercises x ON x.id=e.exercise_id WHERE ${clubConditions}`,
  feedback: `SELECT f.id,f.session_id,f.created_at ts,s.club_id,c.name club_name,c.city,s.user_agent_os os,NULL::text routine,NULL::int level_id,NULL::int day_routine,f.exercise_id,NULL::text muscle_group,NULL::text zone,NULL::text event_type,f.emoji::text emoji,f.comment,NULL::text rating FROM feedback f JOIN sessions s ON s.id=f.session_id LEFT JOIN clubs c ON c.id=s.club_id WHERE ${clubConditions}`,
  routine_feedback: `SELECT f.id,f.session_id,f.created_at ts,s.club_id,c.name club_name,c.city,s.user_agent_os os,f.routine::text routine,f.level_id,f.day_routine,f.exercise_id,x.muscle_group,x.zone,f.type::text event_type,NULL::text emoji,NULL::text comment,f.value::text rating,coalesce(x.name,'Sin ejercicio') exercise_name FROM routine_feedback f JOIN sessions s ON s.id=f.session_id LEFT JOIN clubs c ON c.id=s.club_id LEFT JOIN exercises x ON x.id=f.exercise_id WHERE ${clubConditions}`,
};
const bucket = `to_char(date_trunc($25::text,ts AT TIME ZONE 'America/Mexico_City'),'YYYY-MM-DD HH24:MI')`;
const category = `CASE WHEN comment ~* 'error|falla|no carga|no funciona|no abre|no reproduce|pantalla|conexi[oó]n|se traba|bug|video' THEN 'technical' WHEN comment ~* 'c[oó]mo|t[eé]cnica|postura|ejecut|no entiendo|explic|duda|instrucci|movimiento' THEN 'execution' WHEN comment ~* 'sugier|suger|podr[ií]an|deber[ií]an|agregar|a[ñn]adir|mejorar|me gustar[ií]a|propongo' THEN 'suggestion' ELSE 'other' END`;
const baseFilters = `${range} AND ${dimensions}`;
const countRow = (id: string, label = id, value = "count(*)", series = "'Total'") => `SELECT (${id})::text id,(${label})::text label,(${value})::float8 value,count(*)::float8 sample,${series}::text series FROM filtered`;
const sorted = ` ORDER BY CASE WHEN $26='asc' THEN value END ASC,CASE WHEN $26<>'asc' THEN value END DESC,id LIMIT $27::int`;

async function runChart(id: string, filters: Filters): Promise<ChartResult> {
  const chart = getChart(id);
  if (!chart) throw new Error("Gráfica no válida.");
  const metadata = await getAnalyticsMetadata();
  const f = validateFilters(chart, metadata, filters);
  const updatedAt = new Date().toISOString();
  if (!f.from || !f.to) return { rows: [], updatedAt, sample: 0, unit: "registros" };
  const list = (value?: string) => value ? value.split(",") : null;
  const v = [f.from,f.to,list(f.city),list(f.club),f.routine||null,f.level||null,f.day||null,f.exercise||null,f.muscle||null,f.zone||null,f.event||null,f.emoji||null,f.comments||"all",f.search||null,f.category||null,f.os||null,f.durationMin||null,f.durationMax||null,list(f.weekdays),f.hourMin||0,f.hourMax||23,f.rating||null,f.mode||null,f.metric||null,f.granularity||"day",f.order||"desc",f.limit==="all"||!chart.controls.some((c)=>c.key==="limit")?null:Number(f.limit||10),Number(f.minSample||1),f.grouping||null,f.breakdown||null,f.feedbackType||"all",f.selection||null];
  // Every statement references all fixed parameters, so pg can infer their types consistently.
  const parameters = `args AS (SELECT $1::text,$2::text,$3::text[],$4::text[],$5::text,$6::int,$7::int,$8::text,$9::text,$10::text,$11::text,$12::text,$13::text,$14::text,$15::text,$16::text,$17::float8,$18::float8,$19::int[],$20::int,$21::int,$22::text,$23::text,$24::text,$25::text,$26::text,$27::int,$28::int,$29::text,$30::text,$31::text,$32::text)`;
  const source = sourceFor(chart, f);
  const base = sources[source === "traffic" ? "sessions" : source];
  let extra = "";
  let sql = "";
  let unit = "registros";
  if (id === "rutinas" || id === "niveles") extra = ` AND page_path LIKE '/routine/%'`;
  if (["ejercicios","grupos-musculares","dias-rutina"].includes(id)) extra = ` AND event_type='exercise_view'`;
  if (id === "valoraciones-ejercicios") extra = ` AND event_type='feedback_exercise' AND exercise_id IS NOT NULL`;
  if (id === "satisfaccion-rutinas-sedes" && f.mode === "routine") extra = ` AND event_type='feedback_routine'`;
  if (["satisfaccion","comentarios"].includes(id)) extra += ` AND ($13='all' OR ($13='yes' AND nullif(trim(comment),'') IS NOT NULL) OR ($13='no' AND nullif(trim(comment),'') IS NULL))`;
  let cte = `WITH ${parameters},base AS (${base}),filtered AS (SELECT *,${category} category FROM base WHERE ${baseFilters}${extra})`;
  switch (id) {
    case "trafico": {
      cte = `WITH ${parameters},base AS (SELECT ts,'Sesiones' series FROM (${sources.sessions}) a UNION ALL SELECT ts,'Páginas vistas' FROM (${sources.page_views}) b),filtered AS (SELECT * FROM base WHERE ${range} AND ($24::text IS NULL))`;
      sql = `SELECT ${bucket} id,${bucket} label,count(*)::float8 value,count(*)::float8 sample,series FROM filtered WHERE ($32::text IS NULL OR ${bucket}=$32) AND (${f.series === "sessions" ? "series='Sesiones'" : f.series === "pages" ? "series='Páginas vistas'" : "true"}) GROUP BY 1,2,5 ORDER BY 1`;
      break;
    }
    case "horarios":
      sql = `SELECT extract(isodow FROM ts AT TIME ZONE 'America/Mexico_City')::int::text id,extract(hour FROM ts AT TIME ZONE 'America/Mexico_City')::int::text label,count(*)::float8 value,count(*)::float8 sample,'Sesiones' series FROM filtered WHERE ($19::int[] IS NULL OR extract(isodow FROM ts AT TIME ZONE 'America/Mexico_City')::int=ANY($19)) AND extract(hour FROM ts AT TIME ZONE 'America/Mexico_City') BETWEEN $20 AND $21 AND ($32::text IS NULL OR extract(isodow FROM ts AT TIME ZONE 'America/Mexico_City')::int::text || ':' || extract(hour FROM ts AT TIME ZONE 'America/Mexico_City')::int::text=$32) GROUP BY 1,2 ORDER BY 1,2`;
      break;
    case "compromiso": {
      cte = `WITH ${parameters},cohort AS (${cohort}),base AS (SELECT s.*,s.first_seen_at ts,extract(epoch FROM last_seen_at-first_seen_at)/60 duration,(SELECT count(*) FROM page_views p WHERE p.session_id=s.id) pages,(SELECT count(*) FROM events e WHERE e.session_id=s.id) events FROM cohort s WHERE ($5::text IS NULL OR EXISTS(SELECT 1 FROM page_views p WHERE p.session_id=s.id AND p.routine::text=$5))),filtered AS (SELECT * FROM base WHERE ($17::float8 IS NULL OR duration >= $17) AND ($18::float8 IS NULL OR duration <= $18))`;
      const expression = f.metric === "bounce" ? "100.0*count(*) FILTER(WHERE pages=1 OR events=0)/nullif(count(*),0)" : f.metric === "depth" ? "avg(pages)" : "avg(duration)";
      sql = `SELECT ${bucket} id,${bucket} label,(${expression})::float8 value,count(*)::float8 sample,'${f.metric === "duration" ? "Media" : "Total"}' series FROM filtered WHERE ($32::text IS NULL OR ${bucket}=$32) GROUP BY 1,2`;
      if (f.metric === "duration") sql += ` UNION ALL SELECT ${bucket},${bucket},percentile_cont(0.5) WITHIN GROUP(ORDER BY duration)::float8,count(*)::float8,'Mediana' FROM filtered WHERE ($32::text IS NULL OR ${bucket}=$32) GROUP BY 1,2`;
      sql += " ORDER BY 1";
      unit = f.metric === "duration" ? "minutos" : f.metric === "bounce" ? "%" : "páginas/sesión";
      break;
    }
    case "rutinas":
      sql = countRow("routine", "routine", f.metric === "sessions" ? "count(distinct session_id)" : "count(*)") + ` WHERE routine IS NOT NULL AND ($32::text IS NULL OR routine=$32) GROUP BY routine${sorted}`;
      break;
    case "niveles":
      sql = `SELECT rl.id::text id,rl.label, count(f.id)::float8 value,count(f.id)::float8 sample,coalesce(f.routine,'Sin rutina') series FROM routine_levels rl LEFT JOIN filtered f ON f.level_id=rl.id WHERE ($6::int IS NULL OR rl.id=$6) AND ($32::text IS NULL OR rl.id::text=$32) GROUP BY rl.id,rl.label,f.routine ORDER BY rl.id`;
      break;
    case "ejercicios":
      sql = `SELECT x.id,x.name label,count(f.id)::float8 value,count(f.id)::float8 sample,'Consultas' series FROM exercises x LEFT JOIN filtered f ON f.exercise_id=x.id WHERE ($8::text IS NULL OR x.id=$8) AND ($9::text IS NULL OR x.muscle_group=$9) AND ($10::text IS NULL OR x.zone=$10) AND ($32::text IS NULL OR x.id=$32) GROUP BY x.id,x.name${sorted}`;
      break;
    case "grupos-musculares": {
      const dimension = f.grouping === "zone" ? "coalesce(zone,'Sin catalogar')" : "coalesce(muscle_group,'Sin catalogar')";
      sql = countRow(dimension) + ` WHERE ($32::text IS NULL OR ${dimension}=$32) GROUP BY 1,2 ORDER BY value DESC`;
      break;
    }
    case "dias-rutina":
      sql = countRow("day_routine", "'Día ' || day_routine",f.metric === "sessions" ? "count(distinct session_id)" : "count(*)",f.breakdown === "level" ? "coalesce('Nivel ' || level_id,'Sin nivel')" : "'Total'") + ` WHERE day_routine IS NOT NULL AND ($32::text IS NULL OR day_routine::text=$32) GROUP BY 1,2,5 ORDER BY 1`;
      break;
    case "satisfaccion":
      sql = countRow("emoji") + ` WHERE emoji IN ('happy','neutral','sad') AND ($32::text IS NULL OR emoji=$32) GROUP BY emoji ORDER BY emoji`;
      break;
    case "valoraciones-ejercicios":
      sql = `SELECT exercise_id id,max(exercise_name) label,(count(*) FILTER(WHERE rating='liked'))::float8 value,count(*)::float8 sample,'Me gusta' series FROM filtered WHERE ($32::text IS NULL OR exercise_id=$32) GROUP BY exercise_id HAVING count(*) >= $28 UNION ALL SELECT exercise_id,max(exercise_name),-(count(*) FILTER(WHERE rating='disliked'))::float8,count(*)::float8,'No me gusta' FROM filtered WHERE ($32::text IS NULL OR exercise_id=$32) GROUP BY exercise_id HAVING count(*) >= $28 ORDER BY ${f.order === "asc" ? "value ASC" : "value DESC"},id`;
      break;
    case "comentarios":
      sql = countRow("category") + ` WHERE nullif(trim(comment),'') IS NOT NULL AND ($14::text IS NULL OR strpos(lower(comment),lower($14))>0) AND ($15::text IS NULL OR category=$15) AND ($32::text IS NULL OR category=$32) GROUP BY category ORDER BY value DESC`;
      break;
    case "satisfaccion-rutinas-sedes": {
      const grouping = f.mode === "routine" ? "routine" : "coalesce(club_id,'Sin sede')";
      const label = f.mode === "routine" ? "routine" : "coalesce(club_name,'Sin sede')";
      const positive = f.mode === "routine" ? "rating='liked'" : "emoji='happy'";
      const valid = f.mode === "routine" ? "rating IN ('liked','disliked')" : "emoji IN ('happy','neutral','sad')";
      sql = countRow(grouping,label,`100.0*count(*) FILTER(WHERE ${positive})/nullif(count(*),0)`)+` WHERE ${valid} AND ($32::text IS NULL OR (${grouping})=$32) GROUP BY 1,2 HAVING count(*) >= $28${sorted}`;
      unit = "%"; break;
    }
    case "sedes":
    case "ciudades": {
      const group = id === "sedes" ? "coalesce(club_id,'Sin sede')" : "coalesce(city,'Sin ciudad')";
      const label = id === "sedes" ? "coalesce(club_name,'Sin sede')" : group;
      if (f.metric !== "satisfaction") {
        cte = `WITH ${parameters},cohort AS (${cohort}),filtered AS (SELECT s.*,(SELECT count(*) FROM page_views p WHERE p.session_id=s.id) pages,(SELECT count(*) FROM events e WHERE e.session_id=s.id) events FROM cohort s)`;
      }
      const measure = f.metric === "pages" ? "sum(pages)" : f.metric === "events" ? "sum(events)" : f.metric === "engagement" ? "avg(events)" : f.metric === "satisfaction" ? "100.0*count(*) FILTER(WHERE emoji='happy')/nullif(count(*),0)" : "count(*)";
      sql = countRow(group,label,measure)+` WHERE ($32::text IS NULL OR (${group})=$32)${f.metric === "satisfaction" ? " AND emoji IN ('happy','neutral','sad')" : ""} GROUP BY 1,2 HAVING count(*) >= $28${id === "ciudades" ? " ORDER BY value DESC" : sorted}`;
      unit = f.metric === "engagement" ? "eventos/sesión" : f.metric === "satisfaction" ? "%" : f.metric === "pages" ? "páginas" : f.metric === "events" ? "eventos" : "sesiones";
      break;
    }
    case "embudo": {
      cte = `WITH ${parameters},cohort AS MATERIALIZED (${cohort}),journey_events AS MATERIALIZED (SELECT e.session_id,e.created_at,e.type FROM events e JOIN cohort s ON s.id=e.session_id WHERE e.created_at>=s.first_seen_at AND e.type::text IN ('routine_view','exercise_view') AND ($5::text IS NULL OR e.routine::text=$5) AND ($6::int IS NULL OR e.level_id=$6)),routine_step AS (SELECT s.id,min(e.created_at) routine_at FROM cohort s LEFT JOIN journey_events e ON e.session_id=s.id AND e.type::text='routine_view' GROUP BY s.id),exercise_step AS MATERIALIZED (SELECT r.id,r.routine_at,min(e.created_at) exercise_at FROM routine_step r LEFT JOIN journey_events e ON e.session_id=r.id AND e.type::text='exercise_view' AND e.created_at>=r.routine_at GROUP BY r.id,r.routine_at),feedback_sessions AS (SELECT x.id FROM exercise_step x JOIN feedback f ON f.session_id=x.id AND f.created_at>=x.exercise_at WHERE $31 IN ('all','general') UNION SELECT x.id FROM exercise_step x JOIN routine_feedback f ON f.session_id=x.id AND f.created_at>=x.exercise_at WHERE ($31='all' OR ($31='routine' AND f.type::text='feedback_routine') OR ($31='exercise' AND f.type::text='feedback_exercise')) AND ($5::text IS NULL OR f.routine::text=$5) AND ($6::int IS NULL OR f.level_id=$6)),journey AS (SELECT x.*,f.id IS NOT NULL has_feedback FROM exercise_step x LEFT JOIN feedback_sessions f ON f.id=x.id),filtered AS (SELECT * FROM journey WHERE $32::text IS NULL OR CASE $32 WHEN '1' THEN true WHEN '2' THEN routine_at IS NOT NULL WHEN '3' THEN exercise_at IS NOT NULL WHEN '4' THEN has_feedback ELSE false END)`;
      sql = `SELECT '1' id,'Sesiones' label,count(*)::float8 value,count(*)::float8 sample,'Sesiones' series FROM filtered UNION ALL SELECT '2','Consulta de rutina',count(*) FILTER(WHERE routine_at IS NOT NULL)::float8,count(*)::float8,'Sesiones' FROM filtered UNION ALL SELECT '3','Consulta de ejercicio',count(*) FILTER(WHERE exercise_at IS NOT NULL)::float8,count(*)::float8,'Sesiones' FROM filtered UNION ALL SELECT '4','Feedback posterior',count(*) FILTER(WHERE has_feedback)::float8,count(*)::float8,'Sesiones' FROM filtered ORDER BY id`;
      unit = "sesiones"; break;
    }
    case "ultimo-paso": {
      cte = `WITH ${parameters},cohort AS (${cohort}),selected AS (SELECT s.* FROM cohort s WHERE ($5::text IS NULL AND $6::int IS NULL AND $7::int IS NULL AND $8::text IS NULL) OR EXISTS(SELECT 1 FROM events e WHERE e.session_id=s.id AND ($5::text IS NULL OR e.routine::text=$5) AND ($6::int IS NULL OR e.level_id=$6) AND ($7::int IS NULL OR e.day_routine=$7) AND ($8::text IS NULL OR e.exercise_id=$8))),filtered AS (SELECT s.id,coalesce(e.type::text,'Sin eventos') event_type,coalesce(e.exercise_id,'Sin ejercicio') exercise_id,coalesce(x.name,e.exercise_name,'Sin ejercicio') exercise_name FROM selected s LEFT JOIN LATERAL(SELECT * FROM events e WHERE e.session_id=s.id AND ($29<>'exercise' OR e.exercise_id IS NOT NULL) ORDER BY e.created_at DESC,e.id DESC LIMIT 1)e ON true LEFT JOIN exercises x ON x.id=e.exercise_id)`;
      const dimension = f.grouping === "exercise" ? "exercise_id" : "event_type";
      sql = countRow(dimension,f.grouping === "exercise" ? "exercise_name" : dimension)+` WHERE ($32::text IS NULL OR ${dimension}=$32) GROUP BY 1,2${sorted}`;
      unit = "sesiones"; break;
    }
    case "interacciones":
      sql = f.grouping === "time" ? countRow(bucket,bucket,"count(*)","event_type")+` WHERE ($32::text IS NULL OR ${bucket}=$32) GROUP BY 1,2,5 ORDER BY 1` : countRow("event_type")+` WHERE ($32::text IS NULL OR event_type=$32) GROUP BY event_type ORDER BY value DESC`;
      break;
    case "sistemas-operativos":
      sql = countRow("coalesce(os,'Desconocido')")+` WHERE ($32::text IS NULL OR coalesce(os,'Desconocido')=$32) GROUP BY os${sorted}`;
      break;
  }
  if (sql.endsWith(sorted)) sql = `SELECT * FROM (${sql.slice(0, -sorted.length)}) ranked${sorted}`;
  const result = await query<Datum>(`${cte} ${sql}`,v);
  let rows = result.rows.map((r) => ({ ...r, label: labelFor(r.label), series: labelFor(r.series) }));
  const sample = id === "embudo" ? rows[0]?.sample || 0 : rows.reduce((total,r) => total + (r.series === "Mediana" || r.series === "No me gusta" ? 0 : r.sample),0);
  if (f.display === "percent") {
    const total = rows.reduce((sum,r) => sum+r.value,0);
    rows = rows.map((r) => ({ ...r, value: total ? r.value/total*100 : 0 }));
    unit = "%";
  }
  const data: ChartResult = { rows, sample, unit, updatedAt };
  if (id === "satisfaccion") {
    data.trend = (await query<Datum>(`${cte} SELECT ${bucket} id,${bucket} label,(100.0*count(*) FILTER(WHERE emoji='happy')/nullif(count(*),0))::float8 value,count(*)::float8 sample,'Satisfacción (%)' series FROM filtered WHERE emoji IN ('happy','neutral','sad') AND ($32::text IS NULL OR emoji=$32) GROUP BY 1,2 ORDER BY 1`,v)).rows;
  }
  if (id === "comentarios") {
    const commentWhere = `nullif(trim(comment),'') IS NOT NULL AND ($14::text IS NULL OR strpos(lower(comment),lower($14))>0) AND ($15::text IS NULL OR category=$15) AND ($32::text IS NULL OR category=$32)`;
    const comments = await query<{id:string;comment:string;emoji:string;category:string;date:string;club:string;total:string}>(`${cte} SELECT id::text,comment,emoji,category,to_char(ts AT TIME ZONE 'America/Mexico_City','YYYY-MM-DD HH24:MI') date,coalesce(club_name,'Sin sede') club,count(*) OVER()::text total FROM filtered WHERE ${commentWhere} ORDER BY ts DESC,id DESC LIMIT 20 OFFSET $33::int`,[...v,(Number(f.page||1)-1)*20]);
    data.comments = comments.rows.map((row) => ({ id: row.id, comment: row.comment, emoji: row.emoji, category: row.category, date: row.date, club: row.club }));
    data.commentTotal = Number(comments.rows[0]?.total || sample);
  }
  return data;
}
async function limitedChart(id: string, filters: Filters, key: string): Promise<ChartResult> {
  if (state.active >= 3) await new Promise<void>((resolve) => state.queue.push(resolve));
  else state.active++;
  try {
    const value = await runChart(id, filters);
    if (state.charts.size >= 128) state.charts.delete(state.charts.keys().next().value!);
    state.charts.set(key, { value, expires: Date.now() + CACHE_MS });
    return value;
  } finally {
    const next = state.queue.shift();
    if (next) next(); else state.active--;
  }
}
export async function getChartData(id: string, filters: Filters): Promise<ChartResult> {
  if (!process.env.DATABASE_URL?.trim()) return { rows: [], sample: 0, unit: "registros", updatedAt: new Date().toISOString(), error: "Los datos no están disponibles. Configura la conexión y vuelve a cargar." };
  try {
    const key = JSON.stringify([id, Object.entries(filters).sort(([a],[b]) => a.localeCompare(b))]);
    const cached = state.charts.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    state.charts.delete(key);
    let pending = state.inFlight.get(key);
    if (!pending) {
      pending = limitedChart(id, filters, key);
      state.inFlight.set(key, pending);
    }
    try { return await pending; }
    finally { if (state.inFlight.get(key) === pending) state.inFlight.delete(key); }
  }
  catch (error) {
    const message = error instanceof Error && /Selecciona|Filtros|Valor no válido|intervalo horario|duración mínima|Página no válida/.test(error.message) ? error.message : "No se pudo consultar esta gráfica. Vuelve a intentarlo.";
    return { rows: [], sample: 0, unit: "registros", updatedAt: new Date().toISOString(), error: message };
  }
}
