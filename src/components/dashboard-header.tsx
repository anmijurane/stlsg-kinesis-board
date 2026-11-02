"use client";

import Image from "next/image";

interface DashboardHeaderProps {
  activeTab: "metrics" | "sessions";
  onTabChange: (tab: "metrics" | "sessions") => void;
  isConnected: boolean;
}

export function DashboardHeader({ activeTab, onTabChange, isConnected }: DashboardHeaderProps) {
  return (
    <header className="dashboard-navigation">
      <a href="#dashboard-content" className="skip-link">Saltar al contenido</a>
      <div className="dashboard-brand">
        <Image
          src="/logo_only.png"
          alt="Sitelseg - Telecomunicaciones y Seguridad"
          width="200"
          height="100"
          priority
        // className="dashboard-brand-logo"
        />
      </div>
      <nav aria-label="Navegación del dashboard">
        <button type="button" aria-current={activeTab === "metrics" ? "page" : undefined} onClick={() => onTabChange("metrics")}>Resumen</button>
        <button type="button" aria-current={activeTab === "sessions" ? "page" : undefined} onClick={() => onTabChange("sessions")}>Sesiones</button>
      </nav>
      <p className="connection-status">{isConnected ? "Datos disponibles" : "Sin conexión"}<span>Panel de análisis</span></p>
    </header>
  );
}
