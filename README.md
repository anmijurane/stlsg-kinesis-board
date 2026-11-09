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

La conexión real se verificó mediante MCP y las métricas del Resumen se
contrastaron con consultas independientes de lectura. Reproducir estas pruebas
requiere credenciales locales; no se incluyen credenciales ni una base local.

## Resumen y gráficas de análisis

`/resumen` reúne 18 gráficas Nivo en cinco áreas. Cada tarjeta permite aplicar
filtros independientes y abrir `/resumen/[grafica]` para explorar datos y tablas.
La URL conserva los filtros de todas las tarjetas; «Volver a Resumen» los recupera.
Pulsar una categoría o intervalo abre el detalle o filtra la página individual.
Las tablas ofrecen la misma selección mediante teclado. Las vistas principales
muestran hasta diez categorías; el detalle y las tablas conservan los resultados
permitidos por los filtros.

Los filtros de fechas se obtienen de los días registrados en cada fuente, en
`America/Mexico_City`. No permiten fechas fuera de cobertura ni días sin datos.
El periodo inicial comprende los últimos 30 días calendario hasta el máximo de
la fuente. El día final se incluye completo. Los límites se vuelven a validar en
servidor, incluso al modificar la URL manualmente. Los rangos pueden abarcar
huecos históricos; no se añaden observaciones ficticias para rellenarlos.

La aplicación consulta PostgreSQL directamente, con SQL parametrizado. El endpoint
`GET /api/analytics/[grafica]` solo admite los identificadores registrados y sus
filtros: no ejecuta SQL enviado por el cliente. Mantiene tres consultas de gráficas
concurrentes por proceso como máximo, coalescencia de peticiones idénticas y caché
en memoria de cinco minutos (hasta 128 resultados), con fecha de actualización
visible. El catálogo de filtros también comparte una única carga por proceso. Los errores se aíslan por tarjeta.
No se hacen consultas al importar módulos, durante el build ni cuando faltan
credenciales. El esquema y los índices existentes no se modifican.

### Interpretación de indicadores

- Sesiones no equivale a personas únicas: la BD no contiene un identificador
  persistente de usuario. No se infieren reproducciones ni rutinas completadas.
- Duración: `last_seen_at - first_seen_at`, sin excluir sesiones largas. La gráfica
  muestra promedio y mediana por intervalo. Profundidad y rebote usan las páginas y
  eventos completos de las sesiones iniciadas en el periodo. Rebote significa
  exactamente una página **o** ningún evento; cada sesión se cuenta una vez.
- Consultas de rutinas: páginas `/routine/`, separadas de las páginas de ejercicios
  o atención. Los ejercicios y grupos musculares usan eventos `exercise_view` y
  categorías completas del catálogo, sin inferir entrenamiento efectivo.
- Satisfacción general: `happy / (happy + neutral + sad)`. Las comparaciones por
  sede usan el club de la sesión; las de rutina y ejercicio usan relaciones
  directas de `routine_feedback` y `liked / (liked + disliked)`. No se asigna el
  feedback general a una rutina por proximidad. Mostrar siempre la muestra, en
  especial cuando hay pocas respuestas. Cada indicador respeta los filtros activos.
- El embudo exige rutina, ejercicio y feedback en orden temporal dentro de una
  sesión iniciada en el periodo. El filtro de rutina/nivel restringe las etapas
  correspondientes; la primera etapa conserva la cohorte de sesiones. El feedback
  general no se atribuye a una rutina. «Último paso observado» no confirma abandono.
- Las sesiones distintas se cuentan dentro de cada categoría. Una sesión puede
  consultar varias rutinas, niveles o días; sus sumas no son personas únicas.
- Los comentarios se clasifican por reglas locales, con prioridad técnico →
  ejecución → sugerencia → otros. Las palabras clave están visibles en la página
  de comentarios. La clasificación es léxica y aproximada; no se envían textos a IA.

### Validación adicional

`npm run test:analytics` verifica fechas reales y huecos de cobertura, cambio de
fuente, parámetros inválidos, independencia de filtros y prioridad de categorías.
Además de lint, typecheck y build, contrastar las cifras con consultas de lectura
MCP cuando se cambien las fórmulas. No registrar credenciales, comentarios ni
mensajes crudos de PostgreSQL al diagnosticar fallos.
