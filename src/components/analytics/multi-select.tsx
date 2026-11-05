"use client";

import { useId, useRef, useState } from "react";
import type { Choice } from "@/lib/analytics/registry";

const searchable = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

export function MultiSelect({ label, allLabel, options, value, disabled, onChange }: {
  label: string;
  allLabel: string;
  options: Choice[];
  value: string[];
  disabled?: boolean;
  onChange: (value: string[]) => void;
}) {
  const id = useId();
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const [search, setSearch] = useState("");
  const selected = options.filter((option) => value.includes(option.value));
  const filtered = options.filter((option) => searchable(option.label).includes(searchable(search)));
  const toggle = (item: string) => onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  const description = !selected.length ? allLabel : selected.length === 1 ? selected[0].label : `${selected.length} seleccionadas`;

  return <fieldset className="multi-select" disabled={disabled}>
    <legend>{label}</legend>
    <details ref={details} onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); details.current?.removeAttribute("open"); summary.current?.focus(); }
    }}>
      <summary ref={summary} aria-describedby={`${id}-hint`} title={description}>{description}</summary>
      <div className="multi-select-panel">
        <label className="multi-select-search" htmlFor={`${id}-search`}>Buscar {label.toLocaleLowerCase("es")}
          <input id={`${id}-search`} type="search" value={search} placeholder="Escribe para buscar…" onChange={(event) => setSearch(event.target.value)} />
        </label>
        <div className="multi-select-actions">
          <button type="button" onClick={() => onChange(options.map((option) => option.value))} disabled={!options.length}>Seleccionar todas</button>
          <button type="button" onClick={() => onChange([])} disabled={!selected.length}>Limpiar</button>
        </div>
        <div className="multi-select-options" role="group" aria-label={`Opciones de ${label.toLocaleLowerCase("es")}`}>
          {filtered.map((option) => <label className={`multi-select-option ${value.includes(option.value) ? "is-selected" : ""}`} key={option.value}>
            <input type="checkbox" checked={value.includes(option.value)} onChange={() => toggle(option.value)}/>
            <span>{option.label}</span>
          </label>)}
          {!filtered.length && <p className="multi-select-empty">No hay coincidencias.</p>}
        </div>
        <button className="multi-select-done" type="button" onClick={() => { details.current?.removeAttribute("open"); summary.current?.focus(); }}>Listo</button>
      </div>
    </details>
    {selected.length > 0 && <ul className="multi-select-values" aria-label={`${label}: selección actual`}>
      {selected.slice(0, 3).map((option) => <li key={option.value}><button type="button" title={option.label} aria-label={`Quitar ${option.label}`} onClick={() => toggle(option.value)}><span>{option.label}</span><span aria-hidden="true">×</span></button></li>)}
      {selected.length > 3 && <li className="multi-select-more">+{selected.length - 3} más</li>}
    </ul>}
    <p id={`${id}-hint`} className="multi-select-hint">{selected.length ? `${selected.length} de ${options.length} seleccionadas` : "Sin selección se incluyen todas."}</p>
  </fieldset>;
}
