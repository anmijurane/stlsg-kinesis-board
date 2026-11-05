"use client";

import { useState } from "react";
import type { ClubOption, SessionFilterOptions } from "@/lib/database/types";

interface SessionFilterBarProps {
  clubs: ClubOption[];
  filters: SessionFilterOptions;
  onFilterChange: (updated: Partial<SessionFilterOptions>) => void;
  onReset: () => void;
  isLoading: boolean;
}

export function SessionFilterBar({ clubs, filters, onFilterChange, onReset, isLoading }: SessionFilterBarProps) {
  const [draft, setDraft] = useState(filters);
  const update = (value: Partial<SessionFilterOptions>) => setDraft((current) => ({ ...current, ...value }));
  return (
    <form className="session-filters" aria-labelledby="filters-title" onSubmit={(event) => {
      event.preventDefault();
      onFilterChange({ ...draft, search: draft.search?.trim() || undefined, page: 1 });
    }}>
      <div className="section-heading">
        <div>
          <h2 id="filters-title">Filtrar sesiones</h2>
          <p>Filtra la tabla por sesión, sede, rutina o fecha.</p>
        </div>
        <div className="filter-heading-actions">
          <button type="button" className="text-button" disabled={isLoading} onClick={() => {
            setDraft({ page: 1, pageSize: 20 });
            onReset();
          }}>
            Limpiar filtros
          </button>
          <button type="submit" className="primary-button" disabled={isLoading}>{isLoading ? "Aplicando…" : "Aplicar filtros"}</button>
        </div>
      </div>
      <div className="filter-grid">
        <label>Buscar sesión<input type="search" placeholder="ID o UUID de sesión" value={draft.search || ""} onChange={(e) => update({ search: e.target.value })} /></label>
        <label>Sede<select value={draft.clubId || ""} onChange={(e) => update({ clubId: e.target.value || undefined })}><option value="">Todas las sedes</option>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name} ({club.city})</option>)}</select></label>
        <label>Rutina<select value={draft.routine || ""} onChange={(e) => update({ routine: e.target.value || undefined })}>
          <option value="">Todas las rutinas</option><option value="muscle_gain">Ganancia muscular</option><option value="adaptation">Adaptación</option><option value="fat_burning">Quema de grasa</option><option value="health">Salud y bienestar</option>
        </select></label>
        <label>Desde<input type="date" max={draft.dateTo || undefined} value={draft.dateFrom || ""} onChange={(e) => update({ dateFrom: e.target.value || undefined })} /></label>
        <label>Hasta<input type="date" min={draft.dateFrom || undefined} value={draft.dateTo || ""} onChange={(e) => update({ dateTo: e.target.value || undefined })} /></label>
        <label className="checkbox-label"><input type="checkbox" checked={Boolean(draft.hasDemographicForm)} onChange={(e) => update({ hasDemographicForm: e.target.checked || undefined })} />Solo con formulario demográfico</label>
      </div>
    </form>
  );
}
