import type { Metadata } from "next";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPillars } from "@/components/landing/landing-pillars";

export const metadata: Metadata = {
  title: "Kinesis Sitelseg | Telecomunicaciones y seguridad",
  description:
    "Kinesis Sitelseg: plataforma de análisis de Sitelseg. Inicia sesión para acceder.",
};

export default function Home() {
  return (
    <main className="landing">
      <LandingHero />
      <LandingPillars />
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Sitelseg® · Telecomunicaciones y seguridad</span>
      </footer>
    </main>
  );
}
