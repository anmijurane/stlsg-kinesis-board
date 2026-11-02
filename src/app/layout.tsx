import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sitelseg | Análisis",
  description: "Base de la plataforma de análisis de Sitelseg.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
