# Sorteapp

Plataforma de sorteos con cursos: elegí un tier, comprá tu número de 6 cifras
y sumate a un curso. MVP construido con Next.js (App Router), Tailwind CSS v4
y Supabase.

> Este README cubre PR1 (scaffold) + PR2 (schema, RLS y asignación de números
> en base de datos). El resto de las funcionalidades (landing, checkout,
> Mercado Pago, panel admin, etc.) se incorporan en PRs siguientes — ver
> `sdd/raffle-platform/tasks`.

## Requisitos

- Node.js 22+
- Cuenta de [Supabase](https://supabase.com) (proyecto propio o local vía CLI)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (`brew install supabase/tap/supabase`)
- [Docker](https://www.docker.com/) corriendo (requerido por `supabase start` para levantar Postgres local)

## Configuración

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Variables de entorno: copiá `env.local.example` a `.env.local` (renombralo
   agregando el punto inicial) y completá con las credenciales reales de tu
   proyecto de Supabase:

   ```bash
   cp env.local.example .env.local
   ```

## Desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | Corre ESLint |
| `npm run typecheck` | Chequeo de tipos con TypeScript (`tsc --noEmit`) |
| `npm run test` | Corre los tests unitarios/de componentes (Vitest) |
| `npm run test:watch` | Vitest en modo watch |
| `npm run test:e2e` | Corre los tests end-to-end (Playwright) |

## Stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS v4** — tokens de diseño en `app/globals.css` (`@theme`),
  paleta dark-editorial (ink/champagne/emerald), tipografías Fraunces (display)
  + Geist (texto), vía `next/font` (sin CDN externo)
- **Supabase** — clientes en `lib/supabase/{server,browser,admin}.ts`
- **Vitest + React Testing Library** — tests unitarios/de componentes
- **Playwright** — tests end-to-end

## Estructura

```
app/                        rutas (App Router)
components/                 ui/ marketing/ member/ admin/
lib/                         supabase/, utilidades (env, etc.)
supabase/
  config.toml               config del proyecto Supabase local
  migrations/                migraciones SQL versionadas (orden = timestamp)
  seed.sql                  datos de desarrollo (tiers)
  tests/database/            tests pgTAP (schema, RLS, assign_numbers)
e2e/                        tests end-to-end (Playwright)
```

## Base de datos (Supabase local + pgTAP)

El schema vive en `supabase/migrations/*.sql`. Cubre (PR2):

- `raffle_edition`, `tier`, `"order"`, `raffle_number`, `receipt` — ver
  `design.md` sección 2 (Data model).
- Un único índice único parcial `raffle_edition_single_open` garantiza que
  solo puede haber **una edición `open` a la vez**.
- `unique(edition_id, number)` en `raffle_number` como defensa en profundidad
  además de la biyección (ver más abajo).
- RLS en todas las tablas: comprador ve solo sus propias filas
  (`order`/`raffle_number`/`receipt`), rol `admin` (`app_metadata.role`) ve
  todo, catálogo público (`tier`, ediciones no-`draft`) es legible para
  anónimos.
- Función `assign_numbers(order_id, qty)` (ADR-1): asigna números de 6 cifras
  vía una biyección `f(i) = (a*i + c) mod 1_000_000` por edición (LCG con `a`
  coprimo con 1.000.000, generado random por trigger), bajo un `SELECT ... FOR
  UPDATE` sobre la edición para serializar asignaciones concurrentes. Si el
  cupo se agota, cierra la edición y devuelve cero filas (no lanza excepción:
  ver comentario en la migración sobre por qué un `raise` ahí revertiría el
  cierre). Solo invocable con la `service_role` key (nunca desde el browser).

### Levantar Supabase local

```bash
supabase start          # requiere Docker corriendo
supabase db reset       # aplica migrations/ + seed.sql desde cero
```

### Correr los tests pgTAP

```bash
supabase test db --local supabase/tests/database
```

Estado actual: **44/44 tests pgTAP en verde** (`00_schema.sql` 23,
`01_rls.sql` 14, `02_assign_numbers.sql` 7). El archivo
`02_assign_numbers.sql` documenta una limitación conocida: un test de carrera
con dos conexiones reales (vía `dblink`) no pudo ejecutarse porque este
entorno local no trata a `postgres` como superusuario real de Postgres, y
`dblink_connect` lo exige; la propiedad de seguridad ante concurrencia queda
cubierta por el lock `FOR UPDATE` (analítico) + el test de barrido completo
(200/200 números sin colisión).

Para bajar el stack local sin afectar otros procesos de la máquina:

```bash
supabase stop
```

## Testing

Proyecto en modo TDD estricto: cada feature nueva se implementa con ciclo
rojo → verde → refactor. Ver `lib/env.test.ts` (TypeScript) y
`supabase/tests/database/*.sql` (pgTAP) como ejemplos.
