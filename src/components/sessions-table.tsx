"use client";

import type { SessionSummary } from "@/lib/database/types";

interface SessionsTableProps {
  sessions: SessionSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectSession: (session: SessionSummary) => void;
  onReset: () => void;
  selectedId: number | null;
  isLoading: boolean;
}

export function SessionsTable({ sessions, total, page, pageSize, totalPages, onPageChange, onSelectSession, onReset, selectedId, isLoading }: SessionsTableProps) {
  return (
    <section className="sessions-results" aria-label="Resultados de sesiones" aria-busy={isLoading}>
      <div className="results-heading" role="status">{isLoading ? "Actualizando sesiones…" : `${total.toLocaleString("es-MX")} ${total === 1 ? "sesión encontrada" : "sesiones encontradas"}`}</div>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de sesiones; desplaza horizontalmente si es necesario">
        <table className="sessions-table">
          <thead><tr><th scope="col">Sesión</th><th scope="col">Sede</th><th scope="col" className="numeric">Páginas</th><th scope="col" className="numeric">Eventos</th><th scope="col">Inicio</th><th scope="col"><span className="sr-only">Recorrido</span></th></tr></thead>
          <tbody>{sessions.map((session) => <tr key={session.id} aria-selected={selectedId === session.id}>
            <td><button id={`session-${session.id}`} type="button" className="session-link" aria-label={`Ver recorrido de sesión ${session.id}`} aria-controls="session-journey" disabled={isLoading} onClick={() => onSelectSession(session)}>#{session.id}</button><span className="cell-secondary" title={session.sessionRef}>{session.sessionRef.slice(0, 8)}…</span></td>
            <td>{session.clubName || "Sin sede"}<span className="cell-secondary">{session.device || "Dispositivo sin identificar"}</span></td>
            <td className="numeric">{session.pageViewsCount.toLocaleString("es-MX")}</td><td className="numeric">{session.eventsCount.toLocaleString("es-MX")}</td>
            <td className="session-date"><time dateTime={session.firstSeenAt}>{new Date(session.firstSeenAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short", timeZone: "America/Mexico_City" })}</time></td>
            <td><button type="button" className="text-button" aria-label={`Abrir recorrido de sesión ${session.id}`} aria-controls="session-journey" disabled={isLoading} onClick={() => onSelectSession(session)}>{selectedId === session.id ? "Abierta" : "Ver recorrido"}</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      {sessions.length === 0 && !isLoading && <div className="table-empty"><h3>Sin sesiones para estos filtros</h3><p>Prueba otra sede, rutina o rango de fechas.</p><button type="button" className="secondary-button" onClick={onReset}>Limpiar filtros</button></div>}
      {total > 0 && <div className="pagination"><span>{total === 0 ? "0" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`} de {total.toLocaleString("es-MX")}</span><div><button type="button" className="secondary-button" disabled={page <= 1 || isLoading} onClick={() => onPageChange(page - 1)}>Anterior</button><span>{page} / {totalPages || 1}</span><button type="button" className="secondary-button" disabled={page >= totalPages || isLoading} onClick={() => onPageChange(page + 1)}>Siguiente</button></div></div>}
    </section>
  );
}
