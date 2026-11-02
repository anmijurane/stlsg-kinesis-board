# Instrucciones del proyecto

## Objetivo y alcance

Base técnica del dashboard de análisis de Sitelseg. No añadir autenticación,
modificar el esquema de PostgreSQL, crear migraciones ni inventar métricas o datos
de negocio sin una solicitud posterior. No desplegar sin que se solicite.

## Arquitectura

- Next.js App Router con TypeScript estricto y Tailwind CSS; npm y Node.js 24.
- `src/app`: rutas y layouts. Server Components por defecto; usar componentes
  cliente solo si necesitan interacción o APIs del navegador.
- `src/components`: componentes de presentación reutilizables.
- `src/lib/database`: configuración y acceso a PostgreSQL desde el servidor.
- `scripts`: diagnósticos locales. MCP es una herramienta del asistente;
  la app accede directamente a PostgreSQL con `pg`.
- Consultar la documentación de la versión instalada de Next.js antes de usar
  APIs nuevas. No asumir que APIs de otras versiones siguen vigentes.

## Diseño

`DESIGN.md` es la referencia visual. Conservarlo. UI en español, tipografía de
sistema mientras no haya fuentes locales. El nombre escrito en la página es texto,
no una recreación del logotipo. No redibujar el logo ni añadir dependencias visuales
sin necesidad. Mantener HTML semántico, contraste y adaptación móvil.

## Base de datos y secretos

- Importar consultas desde `@/lib/database` solo en código de servidor con runtime Node.js.
- SQL estático con placeholders `$1`, `$2` y valores separados; nunca interpolar
  entradas del usuario ni exponer un endpoint de SQL arbitrario.
- Utilizar roles de lectura con permisos mínimos para app y MCP; no habilitar
  escrituras ni instalar extensiones de base de datos.
- No conectar al importar módulos, durante el build ni para renderizar el estado vacío.
- Nunca usar prefijos `NEXT_PUBLIC_` para secretos, registrar URLs/errores crudos de
  PostgreSQL ni versionar archivos locales de entorno.
- Mantener límites del pool y tiempos de espera. MCP usa una conexión independiente.

## Comandos y validación

- `npm ci`: instalación reproducible desde el lockfile.
- `npm run dev`: desarrollo; `npm run start`: producción tras el build.
- Antes de entregar: `npm run lint`, `npm run typecheck`, `npm run build`.
- `npm run db:check`: consulta `SELECT 1`; solo comprobar una base real cuando
  haya credenciales disponibles. No mostrar credenciales al informar fallos.
- La aplicación debe abrir sin variables de base de datos. Documentar limitaciones
  y no afirmar que una conexión real se verificó si no se pudo probar.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
