/**
 * Reads a required environment variable from the given source and throws a
 * descriptive error when it is missing or empty. Kept as a pure function
 * (source injected, not read from `process.env` directly) so it is trivially
 * testable without mocking global state.
 */
export function getRequiredEnv(
  key: string,
  source: Record<string, string | undefined>,
): string {
  const value = source[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}
