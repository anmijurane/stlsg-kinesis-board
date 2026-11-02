export function EmptyDashboard() {
  return (
    <section aria-labelledby="empty-title" className="rounded-xl border border-slate-200 p-6 sm:p-10">
      <p className="mb-4 text-sm font-medium text-deep">Sin datos para mostrar</p>
      <h2 id="empty-title" className="text-xl font-semibold">Tu espacio de análisis está listo para comenzar</h2>
      <p className="mt-3 max-w-xl leading-7 text-slate-600">
        Los indicadores y reportes aparecerán aquí cuando se incorporen las fuentes de datos del dashboard.
      </p>
    </section>
  );
}
