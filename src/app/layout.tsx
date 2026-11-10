import "./globals.css";

export const metadata = {
  title: "Kinesis Sitelseg | Análisis",
  keywords: ['sitelseg', 'kinesis'],
  description: "Base de la plataforma de análisis de Sitelseg.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="icon" type="image/ico" href="/favicon.ico" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <meta
        property="og:title"
        content={metadata.title}
      />
      <meta
        property="og:description"
        content={metadata.description}
      />
      <meta property="og:url" content="https://kinesis.sitelseg.mx" />
      <meta property="og:type" content="website" />
      <meta name="theme-color" content="#1b1c1e" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <meta
        name="keywords"
        content={metadata?.keywords?.toString()}
      />
      <meta property="og:image" content="/logo_only.png" />

      <body>{children}</body>
    </html>
  );
}
