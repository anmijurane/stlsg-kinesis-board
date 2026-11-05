"use client";

import Image from "next/image";
import Link from "next/link";

interface DashboardHeaderProps {
  activeTab: "metrics" | "sessions";
  isConnected: boolean;
}

export function DashboardHeader({ activeTab, isConnected }: DashboardHeaderProps) {
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
          style={{ width: "100%", height: "auto" }}
        />
      </div>
      <div className="flex w-full justify-center items-center py-2">
        <h2 className="font-mono">SITELSEG® KINESIS</h2>
      </div>
      <hr className="mx-2" />
      <nav aria-label="Navegación del dashboard">
        <Link href="/resumen" aria-current={activeTab === "metrics" ? "page" : undefined}>Resumen</Link>
        <Link href="/sesiones" aria-current={activeTab === "sessions" ? "page" : undefined}>Sesiones</Link>
      </nav>
    </header>
  );
}
