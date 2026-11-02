"use client";

import { useEffect, useRef, useState } from "react";
import type { EventRecord, SessionDetail } from "@/lib/database/types";

interface SessionJourneyPanelProps {
  detail: SessionDetail | null;
  selectedId: number | null;
  onClose: () => void;
  isLoading: boolean;
}

const EVENT_LABELS: Record<string, string> = {
  routine_view: "Vista de rutina", exercise_view: "Vista de ejercicio", attention_view: "Atención",
  home: "Inicio", feedback: "Valoración general", feedback_routine: "Valoración de rutina",
  feedback_exercise: "Valoración de ejercicio", demographic_form: "Formulario demográfico",
};
const ROUTINES: Record<string, string> = { muscle_gain: "Ganancia muscular", adaptation: "Adaptación", fat_burning: "Quema de grasa", health: "Salud y bienestar" };
const MEMBERSHIPS: Record<string, string> = { "classic-card": "Classic Card", "pf-black-card": "PF Black Card", invite: "Invitado" };
const SENTIMENTS: Record<string, string> = { happy: "Satisfecho", neutral: "Neutral", sad: "Insatisfecho" };
const time = (value: string) => new Date(value).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Mexico_City" });
const date = (value: string) => new Date(value).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short", timeZone: "America/Mexico_City" });

function EventList({ events }: { events: EventRecord[] }) {
  return <ul className="journey-events">{events.map((event) => <li key={event.id}>
    <div><strong>{EVENT_LABELS[event.type] || event.type}</strong><time dateTime={event.createdAt}>{time(event.createdAt)}</time></div>
    {event.exerciseName && <p>{event.exerciseName}</p>}{event.dayRoutine != null && <p>Día de rutina: {event.dayRoutine}</p>}
  </li>)}</ul>;
}

export function SessionJourneyPanel({ detail, selectedId, onClose, isLoading }: SessionJourneyPanelProps) {
  const [activeTab, setActiveTab] = useState<"journey" | "feedback">("journey");
  const [eventFilter, setEventFilter] = useState("all");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selectedId !== null) {
      headingRef.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 1199px)").matches) panelRef.current?.scrollIntoView({ block: "start" });
    }
  }, [selectedId]);
  const pageViews = detail?.pageViews.map((page, index) => ({ ...page, order: index + 1 })).filter((page) => eventFilter === "all" || (eventFilter === "with_events" ? page.events.length > 0 : page.events.some((event) => event.type === eventFilter))) || [];
  return (
    <aside ref={panelRef} id="session-journey" className={`journey-panel ${selectedId === null ? "journey-panel-empty" : ""}`} aria-labelledby="journey-title" aria-busy={isLoading}>
      <div className="journey-header"><div><h2 id="journey-title" ref={headingRef} tabIndex={-1}>Recorrido de sesión</h2><p>{selectedId === null ? "Revisa las páginas y los eventos de una sesión." : `Sesión #${selectedId}`}</p></div>{selectedId !== null && <button type="button" className="text-button" onClick={onClose}>Cerrar</button>}</div>
      <div role="tablist" aria-label="Detalle de sesión" className="journey-tabs" onKeyDown={(event) => {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const next = event.key === "Home" ? "journey" : event.key === "End" ? "feedback" : activeTab === "journey" ? "feedback" : "journey";
          setActiveTab(next); document.getElementById(`tab-${next}`)?.focus();
        }
      }}>
        <button type="button" id="tab-journey" role="tab" aria-selected={activeTab === "journey"} aria-controls="panel-journey" tabIndex={activeTab === "journey" ? 0 : -1} onClick={() => setActiveTab("journey")}>Recorrido</button>
        <button type="button" id="tab-feedback" role="tab" aria-selected={activeTab === "feedback"} aria-controls="panel-feedback" tabIndex={activeTab === "feedback" ? 0 : -1} onClick={() => setActiveTab("feedback")}>Valoraciones{detail ? ` (${detail.feedbacks.length})` : ""}</button>
      </div>
      <div className="journey-body">
        <div role="status">{isLoading && <p className="panel-message">Cargando recorrido de la sesión…</p>}</div>
        {!isLoading && !detail && <div className="journey-placeholder"><h3>{selectedId === null ? "Cada sesión cuenta una historia" : "No se pudo cargar esta sesión"}</h3><p>{selectedId === null ? "Selecciona una sesión de la tabla para ver sus páginas y eventos en orden cronológico." : "Vuelve a seleccionarla en la tabla para intentarlo de nuevo."}</p></div>}
        <div id="panel-journey" role="tabpanel" aria-labelledby="tab-journey" hidden={activeTab !== "journey"} tabIndex={0}>
          {detail && !isLoading && <>
            <dl className="session-facts"><div><dt>Sede</dt><dd>{detail.session.clubName || "Sin sede asignada"}</dd></div><div><dt>Dispositivo</dt><dd>{detail.session.device || "Sin identificar"}<small>{[detail.session.os, detail.session.browser].filter(Boolean).join(" · ")}</small></dd></div><div><dt>Inicio · hora de Ciudad de México</dt><dd><time dateTime={detail.session.firstSeenAt}>{date(detail.session.firstSeenAt)}</time></dd></div><div><dt>Última actividad</dt><dd><time dateTime={detail.session.lastSeenAt}>{date(detail.session.lastSeenAt)}</time></dd></div><div><dt>Actividad</dt><dd>{detail.session.pageViewsCount} páginas · {detail.session.eventsCount} eventos</dd></div><div><dt>Referencia de sesión</dt><dd className="session-reference">{detail.session.sessionRef}</dd></div></dl>
            <label className="event-filter">Mostrar en el recorrido<select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}><option value="all">Todas las páginas</option><option value="with_events">Solo páginas con eventos</option><option value="exercise_view">Vistas de ejercicio</option><option value="routine_view">Vistas de rutina</option><option value="attention_view">Vistas de atención</option></select></label>
            {pageViews.length === 0 && <p className="panel-message">No hay páginas para este filtro.</p>}
            <ol className="journey-timeline">{pageViews.map((page) => <li key={page.id} value={page.order}>
              <div className="page-heading"><code>{page.pagePath}</code><time dateTime={page.visitedAt}>{time(page.visitedAt)}</time></div>
              {(page.routine || page.levelLabel) && <p className="page-context">{[page.routine && (ROUTINES[page.routine] || page.routine), page.levelLabel].filter(Boolean).join(" · ")}</p>}
              {page.events.length > 0 ? <EventList events={eventFilter === "all" || eventFilter === "with_events" ? page.events : page.events.filter((event) => event.type === eventFilter)} /> : <p className="page-context">Sin eventos adicionales</p>}
            </li>)}</ol>
            {detail.unattachedEvents.length > 0 && <section className="profile-section"><h3>Eventos sin página vinculada</h3><EventList events={detail.unattachedEvents} /></section>}
            <section className="profile-section"><h3>Formulario demográfico</h3>{detail.demographicForm ? <dl className="session-facts"><div><dt>Género</dt><dd>{detail.demographicForm.gender}</dd></div><div><dt>Rango de edad</dt><dd>{detail.demographicForm.ageRange}</dd></div><div><dt>Membresía</dt><dd>{MEMBERSHIPS[detail.demographicForm.membership] || detail.demographicForm.membership}</dd></div><div><dt>Contacto</dt><dd>{detail.demographicForm.contactEmail || detail.demographicForm.contactPhone || "No proporcionado"}</dd></div></dl> : <p>No se completó un formulario en esta sesión.</p>}</section>
          </>}
        </div>
        <div id="panel-feedback" role="tabpanel" aria-labelledby="tab-feedback" hidden={activeTab !== "feedback"} tabIndex={0}>
          {detail && !isLoading && (detail.feedbacks.length ? <ul className="feedback-list">{detail.feedbacks.map((feedback) => <li key={feedback.id}><strong>{SENTIMENTS[feedback.emoji] || "Sin valoración"}</strong><time dateTime={feedback.createdAt}>{date(feedback.createdAt)}</time>{feedback.exerciseName && <p>{feedback.exerciseName}</p>}{feedback.comment && <blockquote>{feedback.comment}</blockquote>}</li>)}</ul> : <p className="panel-message">No se registraron valoraciones en esta sesión.</p>)}
        </div>
      </div>
    </aside>
  );
}
