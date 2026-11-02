# Sitelseg · Plataforma de análisis

Boilerplate de Next.js con App Router, TypeScript estricto, Tailwind CSS y PostgreSQL.
Incluye una página inicial en español y un estado vacío. No contiene login, métricas
ficticias, tablas de negocio, migraciones ni despliegue.

## Requisitos e instalación

- Node.js 24 (ver `.nvmrc`) y npm.
- PostgreSQL existente para consultas reales; no es necesario para abrir la app o compilar.
- `uv` / `uvx` únicamente si se activa el MCP opcional.

```sh
nvm use
npm ci
npm run dev
```

Abrir http://localhost:3000. Para producción local: `npm run build` seguido de
`npm run start`. Las dependencias resueltas están en `package-lock.json`; usar
`npm ci` para reproducir la instalación.

## Estructura

```text
src/app/                 Rutas, layout y estilos globales
src/components/          Presentación reutilizable
src/lib/database/        Acceso a PostgreSQL del lado del servidor
scripts/check-db.ts      Diagnóstico de conexión
.codex/                  Plantilla MCP opcional
```

`DESIGN.md` contiene la identidad de Sitelseg. La interfaz usa colores de esa guía
y tipografía de sistema. El nombre se presenta como texto; no se recrea el logotipo.
`AGENTS.md` centraliza instrucciones para asistentes; Claude Code y Copilot tienen
archivos de entrada que remiten a esas reglas.

## PostgreSQL de la aplicación

```sh
cp .env.example .env.local
```

Editar `DATABASE_URL` en `.env.local` con una conexión válida y un rol que tenga
permiso de lectura únicamente sobre las tablas o vistas necesarias. No usar un
superusuario. El proyecto no crea roles ni cambia permisos de la base.

| Variable | Consumidor | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Next.js y `db:check` | Conexión directa de la aplicación |
| `DATABASE_URI` | Servidor MCP | Conexión independiente para Codex |

Los ejemplos contienen marcadores, no credenciales funcionales. Para un servidor
que requiera TLS, usar los parámetros de conexión y certificados indicados por su
proveedor; no desactivar la validación del certificado. Codificar los caracteres
especiales del usuario y contraseña al incluirlos en una URI. No usar variables
`NEXT_PUBLIC_` para estos valores.

```sh
npm run db:check
```

El diagnóstico carga el entorno de desarrollo de Next.js, ejecuta `SELECT 1` y
cierra el pool. Devuelve código 0 en éxito y 1 si falta configuración o falla la
conexión. Los errores se informan sin imprimir credenciales ni la URL.

El módulo `@/lib/database` está protegido con `server-only`. Las consultas se
ejecutan en runtime Node.js, desde Server Components, servicios o Route Handlers.
Ejemplo para incorporar **cuando exista una vista real**:

```ts
import { query } from "@/lib/database";

// Sustituir vista e identificador por nombres confirmados del esquema real.
const result = await query<{ id: string }>(
  "SELECT id FROM vista_autorizada WHERE id = $1 LIMIT 1",
  [id],
);
```

Nunca concatenar entradas del usuario en SQL. Los identificadores SQL tampoco se
construyen con entradas libres. No exponer una API pública de consultas arbitrarias.
El pool se crea al consultar por primera vez y se reutiliza, incluso durante la
recarga en desarrollo: máximo 5 conexiones por proceso, espera de conexión de 5 s,
inactividad de 30 s, límite de sentencia de 10 s y de consulta de 12 s. Al escalar,
considerar el total de procesos y el límite de conexiones del servidor PostgreSQL.

La página inicial no consulta PostgreSQL. El build funciona sin credenciales;
los indicadores y las consultas específicas se añadirán cuando se conozca el esquema.

## MCP de PostgreSQL para Codex (opcional)

MCP permite al asistente consultar la base durante el desarrollo. **La aplicación
no usa MCP para acceder a los datos**: utiliza `pg` directamente.

La plantilla usa [Postgres MCP](https://github.com/crystaldba/postgres-mcp) mediante
`uvx`, transporte STDIO y `--access-mode=restricted`. Este modo limita las consultas
a transacciones de lectura. Utilizar además un rol PostgreSQL independiente con
permisos de solo lectura sobre los esquemas autorizados; el modo del servidor MCP
no sustituye los permisos de la base.

1. Instalar `uv` siguiendo su documentación oficial y confirmar `uvx --version`.
2. Crear la configuración local:

   ```sh
   cp .codex/config.toml.example .codex/config.toml
   ```

   Si ya hay una configuración, incorporar únicamente la tabla `mcp_servers.postgres`
   sin reemplazar las otras opciones. La configuración local está ignorada por Git.
3. Proporcionar `DATABASE_URI` al entorno del proceso que inicia Codex. Por ejemplo,
   en una terminal zsh, sin escribir el secreto en el historial:

   ```sh
   read -rs 'DATABASE_URI?URI PostgreSQL de solo lectura: '
   export DATABASE_URI
   codex
   ```

   En escritorio, la variable debe estar disponible para el proceso de la app;
   exportarla en una terminal no actualiza una app ya abierta. La plantilla no lee
   `.env.local`, y Next.js tampoco exporta sus variables al proceso de Codex.
4. Abrir el proyecto como proyecto de confianza, comprobar el servidor mediante
   `/mcp` en Codex CLI y solicitar una lectura limitada del esquema autorizado.
   El primer inicio mediante `uvx` necesita red para resolver el paquete Python.

No guardar URIs reales en TOML, instrucciones para agentes ni archivos versionados.
La plantilla no se activa automáticamente y no modifica la configuración global.
Para desactivarla, añadir `enabled = false` a la tabla del servidor local.
Consultar la [documentación oficial de MCP en Codex](https://developers.openai.com/codex/mcp)
para opciones de configuración y variables de entorno.

## Verificación

```sh
npm run lint
npm run typecheck
npm run build
npm run db:check
```

Los primeros tres comandos deben funcionar sin PostgreSQL. El último requiere una
conexión configurada; si no existe, el resultado esperado es un mensaje indicando
que falta `DATABASE_URL`. Copiar `.env.example` sin editarla hará que intente
conectar con los marcadores y falle, también con un mensaje sin secretos.

La verificación de conexión real y del MCP contra la base queda pendiente hasta
disponer de credenciales. No se incluyen consultas de negocio ni una base local.
