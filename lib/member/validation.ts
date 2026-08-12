/**
 * Validation for the member-area auth forms (tasks.md PR8, spec.md §7
 * "Member Area"). Same pure, framework-agnostic pattern as
 * `lib/checkout/validation.ts`: runs client-side (inline errors) and
 * server-side (defense in depth) with the exact same rules.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors `supabase/config.toml`'s `auth.minimum_password_length = 6` — a
// password this validation accepts must also be accepted by GoTrue itself.
const MIN_PASSWORD_LENGTH = 6;

function clean(value: string) {
  return value.trim();
}

export interface ClaimAccountInput {
  email: string;
  password: string;
  confirmPassword: string;
}

export type ClaimAccountErrors = Partial<
  Record<"email" | "password" | "confirmPassword", string>
>;

export type ClaimAccountValidation =
  | { success: true; data: { email: string; password: string } }
  | { success: false; errors: ClaimAccountErrors };

/**
 * Validates the "reclamar cuenta" form (spec.md §7, design.md's
 * `supabase.auth.updateUser({ email, password })` upgrade path — see
 * `supabase/config.toml`'s `enable_anonymous_sign_ins` comment). Reports
 * every field error at once, same UX rule as `validateBuyerInfo`.
 */
export function validateClaimAccountInput(
  input: ClaimAccountInput,
): ClaimAccountValidation {
  const errors: ClaimAccountErrors = {};

  const email = clean(input.email);
  if (!EMAIL_RE.test(email)) {
    errors.email = "Ingresá un email válido.";
  }

  const password = input.password;
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (input.confirmPassword !== password) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { email, password } };
}

export interface LoginInput {
  email: string;
  password: string;
}

export type LoginErrors = Partial<Record<"email" | "password", string>>;

export type LoginValidation =
  | { success: true; data: LoginInput }
  | { success: false; errors: LoginErrors };

/**
 * Validates the `/login` form. Deliberately lighter than the claim form —
 * password strength was already enforced when the account was claimed;
 * here we only need "non-empty" so a genuinely wrong password reaches
 * Supabase and gets a proper "invalid credentials" response instead of
 * being swallowed client-side.
 */
export function validateLoginInput(input: LoginInput): LoginValidation {
  const errors: LoginErrors = {};

  const email = clean(input.email);
  if (!EMAIL_RE.test(email)) {
    errors.email = "Ingresá un email válido.";
  }

  if (input.password.length === 0) {
    errors.password = "Ingresá tu contraseña.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { email, password: input.password } };
}
