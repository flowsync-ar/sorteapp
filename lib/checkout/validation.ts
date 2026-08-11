/**
 * Buyer-info validation for the checkout form (spec.md §3 "Flujo de
 * selección" — the form that runs before `createOrder`). Pure functions,
 * framework-agnostic, so the exact same rules run client-side (inline
 * errors, `components/checkout/CheckoutForm.tsx`) and server-side
 * (`app/(shop)/checkout/[tier]/actions.ts`, defense in depth — never trust
 * a client-only check for data that ends up in an auditable order row, per
 * spec.md §9 "Auditoría").
 */

export interface BuyerInfoInput {
  name: string;
  email: string;
  dni: string;
  phone: string;
}

export type BuyerInfoErrors = Partial<Record<keyof BuyerInfoInput, string>>;

export type BuyerInfoValidation =
  | { success: true; data: BuyerInfoInput }
  | { success: false; errors: BuyerInfoErrors };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// DNI argentino: 7 u 8 dígitos, sin puntos (se limpian antes de validar).
const DNI_RE = /^\d{7,8}$/;
// Teléfono: al menos 8 dígitos, admite espacios/guiones/paréntesis/"+".
const PHONE_DIGITS_RE = /^\+?[\d\s()-]{8,20}$/;

function clean(value: string) {
  return value.trim();
}

/**
 * Validates and normalizes buyer contact data. Returns every field error at
 * once (not just the first) so the form can surface all of them together —
 * better UX than a single generic message per spec.md's "mensajes de error
 * claros y accesibles" requirement (see apply-progress for this batch).
 */
export function validateBuyerInfo(input: BuyerInfoInput): BuyerInfoValidation {
  const errors: BuyerInfoErrors = {};

  const name = clean(input.name);
  if (name.length < 3) {
    errors.name = "Ingresá tu nombre y apellido completos.";
  }

  const email = clean(input.email);
  if (!EMAIL_RE.test(email)) {
    errors.email = "Ingresá un email válido.";
  }

  const dni = clean(input.dni).replace(/\./g, "");
  if (!DNI_RE.test(dni)) {
    errors.dni = "Ingresá un DNI válido (7 u 8 dígitos, sin puntos).";
  }

  const phone = clean(input.phone);
  if (!PHONE_DIGITS_RE.test(phone)) {
    errors.phone = "Ingresá un teléfono válido (al menos 8 dígitos).";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { name, email, dni, phone } };
}
