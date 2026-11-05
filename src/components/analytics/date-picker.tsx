"use client";

import { useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";

// Calendar dates are wall dates, not instants: avoid parsing ISO strings as UTC.
function calendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}
function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function DatePicker({ label, value, dates, min, max, onChange }: {
  label: string;
  value: string;
  dates: string[];
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const available = new Set(dates);
  const first = dates.find((date) => (!min || date >= min) && (!max || date <= max));
  const last = dates.findLast((date) => (!min || date >= min) && (!max || date <= max));
  const selected = available.has(value) ? calendarDate(value) : undefined;

  return <div className="date-picker-field">
    <span id={`${id}-label`}>{label}</span>
    <button
      type="button"
      className="date-picker-trigger"
      aria-labelledby={`${id}-label ${id}-value`}
      aria-haspopup="dialog"
      aria-controls={`${id}-dialog`}
      aria-expanded={open}
      disabled={!first}
      onClick={() => { setOpen(true); dialog.current?.showModal(); }}
    >
      <span id={`${id}-value`}>{value ? value.split("-").reverse().join("/") : "Seleccionar fecha"}</span>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2M8 18h2"/></svg>
    </button>
    <dialog
      ref={dialog}
      id={`${id}-dialog`}
      className="date-picker-dialog"
      aria-labelledby={`${id}-title`}
      onClose={() => setOpen(false)}
      onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}
    >
      <header><h3 id={`${id}-title`}>{label}: seleccionar fecha</h3><button type="button" className="date-picker-close" aria-label="Cerrar calendario" onClick={() => dialog.current?.close()}>×</button></header>
      {open && first && last && <DayPicker
        mode="single"
        locale={es}
        weekStartsOn={1}
        selected={selected}
        defaultMonth={selected || calendarDate(first)}
        startMonth={calendarDate(first)}
        endMonth={calendarDate(last)}
        autoFocus
        required
        disabled={(day) => {
          const key = dateKey(day);
          return !available.has(key) || Boolean(min && key < min) || Boolean(max && key > max);
        }}
        onSelect={(day) => {
          if (!day) return;
          onChange(dateKey(day));
          dialog.current?.close();
        }}
      />}
      <p>Solo puedes seleccionar días con registros dentro del periodo disponible.</p>
    </dialog>
  </div>;
}
