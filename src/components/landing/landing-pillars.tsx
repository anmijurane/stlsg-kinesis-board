const pillars = [
  {
    title: "Seguridad",
    text: "Acceso controlado mediante el inicio de sesión corporativo de Sitelseg.",
    icon: "M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3zm-1 11l5-5-1.4-1.4L11 11.2 9.4 9.6 8 11l3 3z",
  },
  {
    title: "Conectividad",
    text: "Una vista unificada de la operación y las sesiones de tu organización.",
    icon: "M5 12a7 7 0 0114 0h-2a5 5 0 00-10 0H5zm3 0a4 4 0 018 0h-2a2 2 0 00-4 0H8zm4 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3z",
  },
  {
    title: "Control",
    text: "Análisis claro para decidir con información y dar seguimiento al servicio.",
    icon: "M4 19V9h3v10H4zm6.5 0V4h3v15h-3zM17 19v-7h3v7h-3z",
  },
];

export function LandingPillars() {
  return (
    <section className="landing-pillars" aria-labelledby="pilares-titulo">
      <h2 id="pilares-titulo" className="landing-section-title">
        Telecomunicaciones y seguridad, en una sola plataforma
      </h2>
      <ul className="landing-pillar-grid">
        {pillars.map((p) => (
          <li key={p.title} className="landing-pillar">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
              <path d={p.icon} fill="currentColor" />
            </svg>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

