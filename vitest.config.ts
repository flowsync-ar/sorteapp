import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` relies on Next.js's `react-server` bundler condition
      // (only set for React Server Component builds) to resolve to its
      // no-op `empty.js`; outside that condition it throws unconditionally
      // (see node_modules/server-only/index.js). Vitest never sets that
      // condition, so alias it directly to the no-op build here — this lets
      // us unit-test server-only modules (lib/raffle/assign.ts,
      // lib/supabase/admin.ts) under Vitest without weakening the real
      // client-bundle guard Next.js enforces at build time.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
  },
});
