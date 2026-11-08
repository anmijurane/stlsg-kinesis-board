import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada | Sitelseg",
  description: "La página que buscas no está disponible. Vuelve al dashboard de Sitelseg.",
};

export default function NotFound() {
  return (
    <div className="flex  min-h-dvh flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-6 sm:px-10">
        <Link href="/" className="inline-flex flex-col rounded-sm">
          <span className="text-xl font-semibold tracking-tight text-ink">Sitelseg</span>
          <span className="mt-1 text-xs text-slate-600">Plataforma de análisis</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16" aria-labelledby="not-found-title">
        <div className="w-full max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-var(--ui-blue)">
            Error 404
          </p>
          <p aria-hidden="true" className="mt-4 text-9xl leading-none font-bold tracking-tighter text-brand sm:text-[160px]">
            404
          </p>
          <h1 id="not-found-title" className="mt-8 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Página no encontrada
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-600">
            La página que buscas no existe o cambió de dirección.
            Revisa el enlace o vuelve al dashboard para continuar.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-var(--ui-blue) px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#124a9f]"
          >
            <span aria-hidden="true">←</span>
            Volver al dashboard
          </Link>
        </div>
      </main>

      <footer className="px-6 pb-6 text-center text-xs text-slate-600">
        Sitelseg · Telecomunicaciones y seguridad
      </footer>
    </div>
  );
}
