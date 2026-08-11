# Sorteapp

Plataforma de sorteos con cursos: elegí un tier, comprá tu número de 6 cifras
y sumate a un curso. MVP construido con Next.js (App Router), Tailwind CSS v4
y Supabase.

> Este README cubre el estado del scaffold inicial (PR1). El resto de las
> funcionalidades (landing, checkout, Mercado Pago, panel admin, etc.) se
> incorporan en PRs siguientes — ver `sdd/raffle-platform/tasks`.

## Requisitos

- Node.js 22+
- Cuenta de [Supabase](https://supabase.com) (proyecto propio o local vía CLI)

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
app/            rutas (App Router)
components/     ui/ marketing/ member/ admin/
lib/            supabase/, utilidades (env, etc.)
db/             migraciones SQL (Supabase) — se completa desde PR2
e2e/            tests end-to-end (Playwright)
```

## Testing

Proyecto en modo TDD estricto: cada feature nueva se implementa con ciclo
rojo → verde → refactor. Ver `lib/env.test.ts` como ejemplo mínimo.
