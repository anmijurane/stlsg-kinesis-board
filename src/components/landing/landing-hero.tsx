import Image from "next/image";
import { FlowGraphic } from "./flow-graphic";

export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="hero-titulo">
      <FlowGraphic />
      <header className="landing-bar">
        <div className="landing-brand">
          <span className="landing-logo">
            <Image
              src="/logo_only.png"
              alt="Sitelseg - Telecomunicaciones y Seguridad"
              width={200}
              height={100}
              priority
              style={{ width: "100%", height: "auto" }}
            />
          </span>
          <span className="landing-wordmark">
            KINESIS <span> <br /> SITELSEG</span>
          </span>
        </div>
        <a href="/auth/login" className="landing-cta landing-cta-ghost">
          Iniciar sesión
        </a>
      </header>

      <div className="landing-hero-body">
        <p className="landing-eyebrow">Plataforma de análisis · Sitelseg®</p>
        <h1 id="hero-titulo">
          Visibilidad en <em>movimiento</em> sobre tu operación.
        </h1>
        <p className="landing-lead">
          Kinesis Sitelseg reúne el análisis de sesiones y la actividad de tu
          organización en un entorno seguro, claro y siempre conectado.
        </p>
        <div className="landing-actions">
          <a href="/auth/login" className="landing-cta">
            Iniciar sesión
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M5 11h11.2l-4.6-4.6L13 5l7 7-7 7-1.4-1.4 4.6-4.6H5v-2z" fill="currentColor" />
            </svg>
          </a>
          <span className="landing-note">Acceso con tu cuenta corporativa</span>
        </div>
      </div>
    </section>
  );
}

