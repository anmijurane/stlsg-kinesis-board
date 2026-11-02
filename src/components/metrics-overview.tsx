import type { GlobalMetrics, MetricDistribution } from "@/lib/database/types";

const number = (value: number) => value.toLocaleString("es-MX");
const ROUTINES: Record<string, string> = { muscle_gain: "Ganancia muscular", adaptation: "Adaptación", fat_burning: "Quema de grasa", health: "Salud y bienestar" };
const EVENTS: Record<string, string> = { routine_view: "Vista de rutina", exercise_view: "Vista de ejercicio", attention_view: "Atención", home: "Inicio", feedback: "Valoración general", feedback_routine: "Valoración de rutina", feedback_exercise: "Valoración de ejercicio", demographic_form: "Formulario demográfico", other: "Otros" };
const SENTIMENTS: Record<string, string> = { happy: "Satisfecho", neutral: "Neutral", sad: "Insatisfecho", null: "Sin valoración" };

export function MetricsSummary({ metrics }: { metrics: GlobalMetrics | null }) {
  const items = [
    { label: "Sesiones", value: metrics ? number(metrics.totalSessions) : "—" },
    { label: "Páginas vistas", value: metrics ? number(metrics.totalPageViews) : "—" },
    { label: "Eventos", value: metrics ? number(metrics.totalEvents) : "—" },
    { label: "Satisfacción", value: metrics && metrics.totalFeedback > 0 ? `${metrics.positiveFeedbackRatio.toFixed(1)}%` : "—", note: metrics ? `${number(metrics.totalFeedback)} valoraciones` : "Sin datos disponibles" },
  ];
  return <section className="metrics-summary" aria-label="Resumen global"><p className="eyebrow">Resumen global</p><dl>{items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd>{item.note && <p>{item.note}</p>}</div>)}</dl></section>;
}

function Distribution({ items, labels = {} }: { items: MetricDistribution[]; labels?: Record<string, string> }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return items.length ? <ul className="distribution-list">{items.map((item) => <li key={item.label}><div><span>{labels[item.label] || item.label}</span><strong>{number(item.count)}{item.percentage != null && <small> ({item.percentage.toFixed(1)}%)</small>}</strong></div><meter min={0} max={max} value={item.count} aria-label={`${labels[item.label] || item.label}: ${number(item.count)}`} /></li>)}</ul> : <p className="section-empty">Sin actividad registrada.</p>;
}

export function MetricsOverview({ metrics, compact = false }: { metrics: GlobalMetrics; compact?: boolean }) {
  const clubs = compact ? metrics.topClubs.slice(0, 3) : metrics.topClubs;
  const clubMax = Math.max(1, ...clubs.map((club) => club.count));
  return <section className={`metrics-analysis ${compact ? "metrics-analysis-compact" : ""}`} aria-label="Análisis global de actividad">
    <p className="global-scope"><strong>Datos globales</strong> Independientes de los filtros de sesiones.</p>
    <div className="analysis-grid">
      <section className="analysis-section"><h2>Rutinas más consultadas</h2><p>Consultas registradas por tipo de rutina.</p><Distribution items={metrics.routines} labels={ROUTINES} />{!compact && <div className="routine-levels"><h3>Niveles de rutina</h3><dl>{metrics.routineLevels.map((level) => <div key={level.label}><dt>{level.label}</dt><dd>{number(level.count)}</dd></div>)}</dl></div>}</section>
      <section className="analysis-section"><h2>Sedes más visitadas</h2><p>Sesiones registradas por sede.</p>{clubs.length ? <ol className="club-ranking">{clubs.map((club) => <li key={club.id}><div><span>{club.label}<small>{club.city}</small></span><strong>{number(club.count)}</strong></div><meter min={0} max={clubMax} value={club.count} aria-label={`${club.label}: ${number(club.count)} sesiones`} /></li>)}</ol> : <p className="section-empty">Sin sedes con actividad.</p>}</section>
    </div>
    {!compact && <div className="secondary-analysis"><section className="analysis-section"><h2>Eventos registrados</h2><p>Interacciones por tipo de evento.</p><Distribution items={metrics.eventsDistribution} labels={EVENTS} /></section><section className="analysis-section"><h2>Sistemas operativos</h2><p>Sesiones por sistema operativo.</p><Distribution items={metrics.osDistribution} /></section><section className="analysis-section"><h2>Valoraciones</h2><p>{number(metrics.totalFeedback)} respuestas registradas.</p>{metrics.feedbackDistribution.length ? <ul className="sentiment-list">{metrics.feedbackDistribution.map((feedback) => <li key={feedback.emoji}><div><span>{SENTIMENTS[feedback.emoji] || feedback.emoji}</span><strong>{number(feedback.count)}</strong></div><meter min={0} max={100} value={feedback.percentage} aria-label={`${SENTIMENTS[feedback.emoji] || feedback.emoji}: ${feedback.percentage.toFixed(1)}%`} /><small>{feedback.percentage.toFixed(1)}%</small></li>)}</ul> : <p className="section-empty">Sin valoraciones registradas.</p>}</section></div>}
  </section>;
}
