import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// `test.globals` is intentionally off (explicit imports everywhere), so
// React Testing Library's auto-cleanup (which relies on a global `afterEach`)
// never registers on its own — unmount explicitly after every test to avoid
// components leaking between tests in the same file.
afterEach(() => {
  cleanup();
});
