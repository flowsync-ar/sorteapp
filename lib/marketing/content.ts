/**
 * Marketing content for the public landing (PR4). Presentational data only
 * — no business logic, no fetching — so components stay pure and easy to
 * unit-test (data passed as props / imported directly in RSC).
 *
 * IMPORTANT: fields wrapped in `[ ]` are explicit placeholders for real
 * business data, matching the convention already used in `env.local.example`
 * and in the Términos y Condiciones document (see
 * `app/(marketing)/terminos/page.tsx`). They MUST be replaced with real,
 * verifiable data before this goes live — see especially `transparency`
 * below, which is the legal credibility section (lottery authorization +
 * escribano).
 */

export interface Tier {
  key: "inicial" | "plus" | "premium";
  name: string;
  priceArs: number;
  /** Cantidad de números de 6 cifras que otorga la compra de este tier. */
  numbersGranted: number;
  includes: string[];
  /** % de descuento por pago con transferencia (spec.md 2: "visible"). */
  transferDiscountPercent: number;
}

// Precios y numbersGranted deben coincidir con supabase/seed.sql (fuente de
// verdad para el checkout real, PR5). Este objeto es solo para mostrar el
// catálogo en la landing.
export const tiers: Tier[] = [
  {
    key: "inicial",
    name: "Inicial",
    priceArs: 15000,
    numbersGranted: 1,
    transferDiscountPercent: 10,
    includes: [
      "1 curso digital a elección del catálogo",
      "1 número de 6 cifras para el sorteo del mes",
      "Acceso de por vida al curso elegido",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    priceArs: 35000,
    numbersGranted: 3,
    transferDiscountPercent: 10,
    includes: [
      "Hasta 3 cursos digitales a elección",
      "3 números de 6 cifras para el sorteo del mes",
      "Acceso de por vida a los cursos elegidos",
      "Certificado de finalización por curso",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    priceArs: 60000,
    numbersGranted: 6,
    transferDiscountPercent: 10,
    includes: [
      "Acceso a todo el catálogo de cursos digitales",
      "6 números de 6 cifras para el sorteo del mes",
      "Acceso de por vida a todos los cursos",
      "Certificado de finalización por curso",
      "Soporte prioritario por email",
    ],
  },
];

export interface HowItWorksStep {
  title: string;
  description: string;
}

export const howItWorksSteps: HowItWorksStep[] = [
  {
    title: "Elegís tu curso",
    description:
      "Comparás los 3 tiers (Inicial, Plus o Premium) y elegís el que más se ajusta a lo que querés aprender.",
  },
  {
    title: "Recibís tu número de 6 cifras",
    description:
      "Al confirmarse el pago (al instante con Mercado Pago, o tras verificar tu comprobante) te asignamos automáticamente uno o más números únicos entre 000000 y 999999.",
  },
  {
    title: "Accedés al curso",
    description:
      "Ingresás a tu área de socio y arrancás el curso cuando quieras — el acceso es tuyo, ganes o no el sorteo.",
  },
  {
    title: "Participás del sorteo",
    description:
      "El día del sorteo mensual, tu número entra en juego con certificación de escribano público. Publicamos el resultado y el acta en Transparencia.",
  },
];

export interface CurrentPrize {
  title: string;
  editionLabel: string;
  drawDateIso: string;
  description: string;
  imageAlt: string;
  /**
   * Real `prize_image` URL of the open edition (`lib/marketing/prize.ts`),
   * `null` when the admin hasn't uploaded one yet, `undefined` on the static
   * fallback data below. `HeroPrize`/`PrizeOfMonth` render
   * `/prize-placeholder.svg` unless this is a truthy string.
   */
  imageUrl?: string | null;
}

export const currentPrize: CurrentPrize = {
  // TODO: reemplazar por el premio real de la edición vigente antes de publicar.
  title: "Moto 0km Honda Wave 110s",
  editionLabel: "Edición Agosto 2026",
  drawDateIso: "2026-08-31T21:00:00-03:00",
  description:
    "0km, patentada a nombre del ganador, entregada en concesionario oficial. Incluye gastos de patentamiento — ver Términos y Condiciones para el detalle completo.",
  imageAlt: "Moto 0km Honda Wave 110s, premio del sorteo de la edición vigente",
};

export interface Winner {
  id: string;
  /** Nombre parcial (privacidad del ganador) — ej. "Martín G." */
  displayName: string;
  prize: string;
  dateIso: string;
  editionLabel: string;
}

// Ejemplos ilustrativos (NO son ganadores reales) — reemplazar por los datos
// reales una vez publicados los primeros sorteos y actas correspondientes.
export const previousWinners: Winner[] = [
  {
    id: "example-winner-1",
    displayName: "Martín G.",
    prize: "Notebook 15\" 16GB RAM",
    dateIso: "2026-06-30",
    editionLabel: "Edición Junio 2026",
  },
  {
    id: "example-winner-2",
    displayName: "Rocío A.",
    prize: "Smart TV 55\" 4K",
    dateIso: "2026-07-31",
    editionLabel: "Edición Julio 2026",
  },
  {
    id: "example-winner-3",
    displayName: "Federico L.",
    prize: "Voucher de viaje $500.000",
    dateIso: "2026-05-31",
    editionLabel: "Edición Mayo 2026",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "¿Cómo se paga?",
    answer:
      "Con Mercado Pago (acreditación automática) o por transferencia bancaria subiendo el comprobante desde el Sitio, que verificamos manualmente en menos de 48hs hábiles.",
  },
  {
    question: "¿Cómo se entrega el curso?",
    answer:
      "El acceso se habilita automáticamente cuando el pago queda confirmado (al instante con Mercado Pago, o al verificar el comprobante). Lo ves en tu área de socio, sin límite de tiempo.",
  },
  {
    question: "¿Cómo se hace el sorteo?",
    answer:
      "Cada mes, con autorización de lotería vigente y presencia de escribano público que certifica el procedimiento y firma el acta. El resultado y el acta se publican en la sección Transparencia.",
  },
  {
    question: "¿Qué pasa si no gano?",
    answer:
      "Te quedás con el curso igual: la entrega del curso no depende del resultado del sorteo. Además, participás automáticamente en cada edición en la que compres un número nuevo.",
  },
];

export interface Transparency {
  lotteryAuthority: string;
  authorizationNumber: string;
  jurisdiction: string;
  notary: {
    name: string;
    registrationNumber: string;
  };
  /** Link al acta del último sorteo publicada en el Sitio. */
  lastActaUrl: string;
}

export const transparency: Transparency = {
  // TODO: completar con los datos reales antes de publicar — ver también el
  // checklist al final de app/(marketing)/terminos/page.tsx.
  lotteryAuthority: "[ORGANISMO DE LOTERÍA PROVINCIAL / IAFAS / ENTIDAD COMPETENTE]",
  authorizationNumber: "[NÚMERO DE AUTORIZACIÓN]",
  jurisdiction: "[PROVINCIA/S ALCANZADA/S]",
  notary: {
    name: "[NOMBRE DEL ESCRIBANO/A]",
    registrationNumber: "[NÚMERO DE MATRÍCULA]",
  },
  lastActaUrl: "#", // TODO: reemplazar por el link real al acta del último sorteo.
};

export const contact = {
  // TODO: reemplazar por el email/canal oficial real.
  email: "contacto@[dominio-del-sitio]",
};

export interface BankTransferInstructions {
  bankName: string;
  accountHolder: string;
  cbu: string;
  alias: string;
}

// Shown on `/checkout/orden/[orderId]/comprobante` (PR7) before the buyer
// uploads their comprobante. Same placeholder convention as `transparency`
// above — MUST be replaced with the real destination account before going
// live.
export const bankTransferInstructions: BankTransferInstructions = {
  bankName: "[BANCO]",
  accountHolder: "[TITULAR DE LA CUENTA]",
  cbu: "[CBU]",
  alias: "[ALIAS]",
};
