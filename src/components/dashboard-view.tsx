"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { ClubOption, GlobalMetrics, SessionDetail, SessionFilterOptions, SessionsPaginatedResult, SessionSummary } from "@/lib/database/types";
import { fetchSessionsAction, fetchSessionDetailAction } from "@/app/actions";
import { DashboardHeader } from "./dashboard-header";
import { MetricsOverview, MetricsSummary } from "./metrics-overview";
import { SessionFilterBar } from "./session-filter-bar";
import { SessionsTable } from "./sessions-table";
import { SessionJourneyPanel } from "./session-journey-panel";

interface DashboardViewProps {
  initialMetrics: GlobalMetrics | null;
  initialClubs: ClubOption[];
  initialSessionsResult: SessionsPaginatedResult;
  isConnected: boolean;
}
const DEFAULT_FILTERS: SessionFilterOptions = { page: 1, pageSize: 20 };

export function DashboardView({ initialMetrics, initialClubs, initialSessionsResult, isConnected }: DashboardViewProps) {
  const activeTab: "metrics" | "sessions" = "sessions";
  const [filters, setFilters] = useState<SessionFilterOptions>(DEFAULT_FILTERS);
  const [filterRevision, setFilterRevision] = useState(0);
  const [sessionsData, setSessionsData] = useState(initialSessionsResult);
  const [selectedDetail, setSelectedDetail] = useState<SessionDetail | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const sessionsRequest = useRef(0);
  const detailRequest = useRef(0);

  const clearSelection = () => {
    detailRequest.current += 1;
    setSelectedId(null); setSelectedDetail(null); setIsLoadingDetail(false);
  };
  const loadSessions = (next: SessionFilterOptions) => {
    const request = ++sessionsRequest.current;
    setFilters(next); setSessionsError(null); clearSelection();
    if (!isConnected) return;
    startTransition(async () => {
      try {
        const result = await fetchSessionsAction(next);
        if (request === sessionsRequest.current) setSessionsData(result);
      } catch {
        if (request === sessionsRequest.current) setSessionsError("No se pudieron actualizar las sesiones. Vuelve a aplicar los filtros.");
      }
    });
  };
  const resetFilters = () => { setFilterRevision((value) => value + 1); loadSessions(DEFAULT_FILTERS); };
  const selectSession = async (session: SessionSummary) => {
    const request = ++detailRequest.current;
    setSelectedId(session.id); setSelectedDetail(null); setIsLoadingDetail(true);
    try {
      const detail = await fetchSessionDetailAction(session.id);
      if (request === detailRequest.current) setSelectedDetail(detail);
    } catch {
      if (request === detailRequest.current) setSelectedDetail(null);
    } finally {
      if (request === detailRequest.current) setIsLoadingDetail(false);
    }
  };
  return (
    <div className="dashboard-shell">
      <DashboardHeader activeTab={activeTab} isConnected={isConnected} />
      <main id="dashboard-content" className={`dashboard-workspace ${activeTab === "sessions" ? "with-journey" : ""}`}>
        <div className="dashboard-content">
          <div className="page-heading-row"><div><h1>{activeTab === "sessions" ? "Explorador de sesiones" : "Resumen de actividad"}</h1><p>{activeTab === "sessions" ? "Explora la navegación, página por página." : "Una mirada al uso de la plataforma."}</p></div><Link className="text-button" href="/resumen">Ver resumen</Link></div>
          {!isConnected && <div className="connection-notice" role="status"><strong>Los datos no están disponibles</strong><p>Cuando se restablezca la conexión, recarga la página para consultar la actividad.</p></div>}
          <MetricsSummary metrics={initialMetrics} />
          {activeTab === "sessions" ? <>
            <SessionFilterBar key={filterRevision} clubs={initialClubs} filters={filters} onFilterChange={(updated) => loadSessions({ ...filters, ...updated })} onReset={resetFilters} isLoading={isPending} />
            {sessionsError ? <div className="connection-notice" role="alert"><p>{sessionsError}</p></div> : <SessionsTable sessions={sessionsData.sessions} total={sessionsData.total} page={sessionsData.page} pageSize={sessionsData.pageSize} totalPages={sessionsData.totalPages} onPageChange={(page) => loadSessions({ ...filters, page })} onSelectSession={selectSession} onReset={resetFilters} selectedId={selectedId} isLoading={isPending} />}
            {initialMetrics && <MetricsOverview metrics={initialMetrics} compact />}
          </> : initialMetrics ? <MetricsOverview metrics={initialMetrics} /> : <p className="section-empty">El resumen estará disponible cuando haya datos.</p>}
        </div>
        {activeTab === "sessions" && <SessionJourneyPanel key={selectedId ?? "empty"} detail={selectedDetail} selectedId={selectedId} isLoading={isLoadingDetail} onClose={() => { const previous = selectedId; clearSelection(); document.getElementById(`session-${previous}`)?.focus(); }} />}
      </main>
    </div>
  );
}
