import "server-only";
import { query } from "./index";
import type {
  ClubOption,
  GlobalMetrics,
  MetricDistribution,
  SessionFilterOptions,
  SessionSummary,
  SessionsPaginatedResult,
  DemographicFormData,
  EventRecord,
  PageViewWithEvents,
  FeedbackItem,
  SessionDetail,
} from "./types";

interface CountRow {
  count: string | number;
}

/**
 * Obtiene el listado de clubes para los selectores de filtrado.
 */
export async function getAvailableClubs(): Promise<ClubOption[]> {
  try {
    const res = await query<ClubOption>(
      "SELECT id, name, city FROM clubs ORDER BY name ASC"
    );
    return res.rows;
  } catch (err) {
    console.error("Error al obtener clubes:", (err as Error).message);
    return [];
  }
}

/**
 * Obtiene métricas agregadas globales para los indicadores y gráficos del dashboard.
 */
export async function getGlobalMetrics(): Promise<GlobalMetrics | null> {
  try {
    const [
      sessionsRes,
      pageViewsRes,
      eventsRes,
      feedbackRes,
      routinesRes,
      levelsRes,
      clubsRes,
      eventsDistRes,
      osDistRes,
      feedbackDistRes,
    ] = await Promise.all([
      query<CountRow>("SELECT count(*)::int AS count FROM sessions"),
      query<CountRow>("SELECT count(*)::int AS count FROM page_views"),
      query<CountRow>("SELECT count(*)::int AS count FROM events"),
      query<CountRow>("SELECT count(*)::int AS count FROM feedback"),
      query<{ routine: string; count: string | number }>(
        `SELECT routine, count(*)::int AS count
         FROM page_views
         WHERE routine IS NOT NULL
         GROUP BY routine
         ORDER BY count DESC`
      ),
      query<{ label: string; count: string | number }>(
        `SELECT COALESCE(rl.label, 'Nivel ' || pv.level_id) AS label, count(*)::int AS count
         FROM page_views pv
         LEFT JOIN routine_levels rl ON rl.id = pv.level_id
         WHERE pv.level_id IS NOT NULL
         GROUP BY rl.label, pv.level_id
         ORDER BY count DESC`
      ),
      query<{ id: string; name: string; city: string; count: string | number }>(
        `SELECT c.id, c.name, c.city, count(s.id)::int AS count
         FROM clubs c
         JOIN sessions s ON s.club_id = c.id
         GROUP BY c.id, c.name, c.city
         ORDER BY count DESC
         LIMIT 8`
      ),
      query<{ label: string; count: string | number }>(
        `SELECT type::text AS label, count(*)::int AS count
         FROM events
         GROUP BY type
         ORDER BY count DESC`
      ),
      query<{ label: string; count: string | number }>(
        `SELECT COALESCE(user_agent_os, 'Desconocido') AS label, count(*)::int AS count
         FROM sessions
         WHERE user_agent_os IS NOT NULL
         GROUP BY user_agent_os
         ORDER BY count DESC
         LIMIT 6`
      ),
      query<{ emoji: string; count: string | number }>(
        `SELECT emoji::text AS emoji, count(*)::int AS count
         FROM feedback
         GROUP BY emoji
         ORDER BY count DESC`
      ),
    ]);

    const totalSessions = Number(sessionsRes.rows[0]?.count || 0);
    const totalPageViews = Number(pageViewsRes.rows[0]?.count || 0);
    const totalEvents = Number(eventsRes.rows[0]?.count || 0);
    const totalFeedback = Number(feedbackRes.rows[0]?.count || 0);

    const feedbackRows = feedbackDistRes.rows.map((r) => ({
      emoji: r.emoji,
      count: Number(r.count),
      percentage: totalFeedback > 0 ? (Number(r.count) / totalFeedback) * 100 : 0,
    }));

    const happyFeedback = feedbackRows.find((f) => f.emoji === "happy")?.count || 0;
    const positiveFeedbackRatio =
      totalFeedback > 0 ? (happyFeedback / totalFeedback) * 100 : 0;

    const routines: MetricDistribution[] = routinesRes.rows.map((r) => ({
      label: r.routine,
      count: Number(r.count),
      percentage: totalPageViews > 0 ? (Number(r.count) / totalPageViews) * 100 : 0,
    }));

    const routineLevels: MetricDistribution[] = levelsRes.rows.map((r) => ({
      label: r.label,
      count: Number(r.count),
    }));

    const topClubs = clubsRes.rows.map((r) => ({
      id: r.id,
      label: r.name,
      city: r.city,
      count: Number(r.count),
    }));

    const eventsDistribution: MetricDistribution[] = eventsDistRes.rows.map((r) => ({
      label: r.label,
      count: Number(r.count),
      percentage: totalEvents > 0 ? (Number(r.count) / totalEvents) * 100 : 0,
    }));

    const osDistribution: MetricDistribution[] = osDistRes.rows.map((r) => ({
      label: r.label,
      count: Number(r.count),
    }));

    return {
      totalSessions,
      totalPageViews,
      totalEvents,
      totalFeedback,
      positiveFeedbackRatio,
      routines,
      routineLevels,
      topClubs,
      eventsDistribution,
      osDistribution,
      feedbackDistribution: feedbackRows,
    };
  } catch (err) {
    console.error("Error al calcular métricas globales:", (err as Error).message);
    return null;
  }
}

/**
 * Consulta paginada y filtrada de sesiones anónimas.
 */
export async function getFilteredSessions(
  options: SessionFilterOptions
): Promise<SessionsPaginatedResult> {
  const {
    clubId,
    routine,
    hasDemographicForm,
    dateFrom,
    dateTo,
    search,
    page = 1,
    pageSize = 20,
  } = options;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (clubId && clubId.trim()) {
    values.push(clubId.trim());
    conditions.push(`s.club_id = $${values.length}`);
  }

  if (hasDemographicForm) {
    conditions.push(
      `EXISTS (SELECT 1 FROM demographic_forms df WHERE df.session_id = s.id)`
    );
  }

  if (routine && routine.trim()) {
    values.push(routine.trim());
    conditions.push(
      `EXISTS (SELECT 1 FROM page_views pv WHERE pv.session_id = s.id AND pv.routine::text = $${values.length})`
    );
  }

  if (dateFrom && dateFrom.trim()) {
    values.push(dateFrom.trim());
    conditions.push(`s.first_seen_at >= $${values.length}::timestamptz`);
  }

  if (dateTo && dateTo.trim()) {
    values.push(dateTo.trim());
    conditions.push(`s.first_seen_at <= $${values.length}::timestamptz`);
  }

  if (search && search.trim()) {
    const sTerm = search.trim();
    if (/^\d+$/.test(sTerm)) {
      values.push(Number(sTerm));
      conditions.push(`s.id = $${values.length}`);
    } else {
      values.push(`%${sTerm}%`);
      conditions.push(`s.session_ref::text ILIKE $${values.length}`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    // 1. Total de registros que cumplen los filtros
    const countSql = `SELECT count(*)::int AS count FROM sessions s ${whereClause}`;
    const countRes = await query<CountRow>(countSql, values);
    const total = Number(countRes.rows[0]?.count || 0);

    const offset = Math.max(0, (page - 1) * pageSize);
    const limitValues = [...values];
    limitValues.push(pageSize);
    const limitIdx = limitValues.length;
    limitValues.push(offset);
    const offsetIdx = limitValues.length;

    // 2. Consulta de registros paginados
    const listSql = `
      SELECT
        s.id,
        s.session_ref AS "sessionRef",
        s.club_id AS "clubId",
        c.name AS "clubName",
        s.user_agent_device AS "device",
        s.user_agent_os AS "os",
        s.user_agent_browser AS "browser",
        s.first_seen_at::text AS "firstSeenAt",
        s.last_seen_at::text AS "lastSeenAt",
        EXISTS(SELECT 1 FROM demographic_forms df WHERE df.session_id = s.id) AS "hasDemographicForm",
        EXISTS(SELECT 1 FROM feedback f WHERE f.session_id = s.id) AS "hasFeedback",
        (SELECT count(*)::int FROM page_views pv WHERE pv.session_id = s.id) AS "pageViewsCount",
        (SELECT count(*)::int FROM events e WHERE e.session_id = s.id) AS "eventsCount"
      FROM sessions s
      LEFT JOIN clubs c ON c.id = s.club_id
      ${whereClause}
      ORDER BY s.first_seen_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const listRes = await query<SessionSummary>(listSql, limitValues);

    const totalPages = Math.ceil(total / pageSize);

    return {
      sessions: listRes.rows,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (err) {
    console.error("Error al obtener sesiones filtradas:", (err as Error).message);
    return {
      sessions: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Obtiene el detalle completo del recorrido (journey) de una sesión específica:
 * Datos de sesión, formulario demográfico, páginas visitadas y eventos vinculados a cada vista.
 */
export async function getSessionDetail(sessionId: number): Promise<SessionDetail | null> {
  try {
    const sessionRes = await query<SessionSummary>(
      `SELECT
        s.id,
        s.session_ref AS "sessionRef",
        s.club_id AS "clubId",
        c.name AS "clubName",
        s.user_agent_device AS "device",
        s.user_agent_os AS "os",
        s.user_agent_browser AS "browser",
        s.first_seen_at::text AS "firstSeenAt",
        s.last_seen_at::text AS "lastSeenAt",
        EXISTS(SELECT 1 FROM demographic_forms df WHERE df.session_id = s.id) AS "hasDemographicForm",
        EXISTS(SELECT 1 FROM feedback f WHERE f.session_id = s.id) AS "hasFeedback",
        (SELECT count(*)::int FROM page_views pv WHERE pv.session_id = s.id) AS "pageViewsCount",
        (SELECT count(*)::int FROM events e WHERE e.session_id = s.id) AS "eventsCount"
      FROM sessions s
      LEFT JOIN clubs c ON c.id = s.club_id
      WHERE s.id = $1`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      return null;
    }

    const session = sessionRes.rows[0];

    // Formulario demográfico
    const demoRes = await query<DemographicFormData>(
      `SELECT
        id,
        gender::text AS gender,
        age_range::text AS "ageRange",
        membership::text AS membership,
        contact_email AS "contactEmail",
        contact_phone AS "contactPhone",
        created_at::text AS "createdAt"
      FROM demographic_forms
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
      [sessionId]
    );

    // Páginas visitadas
    const pageViewsRes = await query<{
      id: number;
      pagePath: string;
      queryString: string | null;
      routine: string | null;
      levelId: number | null;
      levelLabel: string | null;
      visitedAt: string;
    }>(
      `SELECT
        pv.id,
        pv.page_path AS "pagePath",
        pv.query_string AS "queryString",
        pv.routine::text AS "routine",
        pv.level_id AS "levelId",
        rl.label AS "levelLabel",
        pv.visited_at::text AS "visitedAt"
      FROM page_views pv
      LEFT JOIN routine_levels rl ON rl.id = pv.level_id
      WHERE pv.session_id = $1
      ORDER BY pv.visited_at ASC, pv.id ASC`,
      [sessionId]
    );

    // Eventos de la sesión
    const eventsRes = await query<EventRecord>(
      `SELECT
        e.id,
        e.page_view_id AS "pageViewId",
        e.type::text AS "type",
        e.exercise_id AS "exerciseId",
        e.exercise_name AS "exerciseName",
        e.routine::text AS "routine",
        e.level_id AS "levelId",
        e.day_routine AS "dayRoutine",
        e.created_at::text AS "createdAt"
      FROM events e
      WHERE e.session_id = $1
      ORDER BY e.created_at ASC, e.id ASC`,
      [sessionId]
    );

    // Feedback dejado en la sesión
    const feedbackRes = await query<FeedbackItem>(
      `SELECT
        f.id,
        f.emoji::text AS "emoji",
        f.exercise_id AS "exerciseId",
        e.name AS "exerciseName",
        f.comment AS "comment",
        f.created_at::text AS "createdAt"
      FROM feedback f
      LEFT JOIN exercises e ON e.id = f.exercise_id
      WHERE f.session_id = $1
      ORDER BY f.created_at ASC`,
      [sessionId]
    );

    // Asociar eventos anidados a cada page_view
    const eventsByPageViewId = new Map<number, EventRecord[]>();
    const unattachedEvents: EventRecord[] = [];

    for (const ev of eventsRes.rows) {
      if (ev.pageViewId) {
        const list = eventsByPageViewId.get(ev.pageViewId) || [];
        list.push(ev);
        eventsByPageViewId.set(ev.pageViewId, list);
      } else {
        unattachedEvents.push(ev);
      }
    }

    const pageViews: PageViewWithEvents[] = pageViewsRes.rows.map((pv) => ({
      ...pv,
      events: eventsByPageViewId.get(pv.id) || [],
    }));

    return {
      session,
      demographicForm: demoRes.rows[0] || null,
      pageViews,
      unattachedEvents,
      feedbacks: feedbackRes.rows,
    };
  } catch (err) {
    console.error("Error al obtener detalle de sesión:", (err as Error).message);
    return null;
  }
}
