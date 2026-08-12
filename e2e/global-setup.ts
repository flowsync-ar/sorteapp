import { ensureOpenEdition } from "./helpers/seedEdition";

/**
 * Playwright global setup (tasks.md PR9.6). Every prior batch's e2e spec
 * (`checkout-flow`, `comprobante-upload`, `member-area`) has silently
 * depended on an `open` `raffle_edition` already existing locally — until
 * now that was a documented-but-manual `psql` step run before `playwright
 * test`. This makes it automatic and idempotent instead, so a fresh
 * `supabase db reset` followed directly by `npx playwright test` just
 * works, with no separate manual step to remember.
 */
export default function globalSetup() {
  ensureOpenEdition();
}
