import Link from "next/link";
import { LoginForm } from "@/components/member/LoginForm";
import { loginAction } from "./actions";

/**
 * `/login` (tasks.md PR8.2, spec.md §7 "Member Area"). Not part of any
 * route group — public, unauthenticated-accessible — complements the
 * anonymous-session "claim account" upgrade (`lib/member/claim.ts`,
 * `components/member/ClaimAccountForm.tsx`) so a buyer can return from a
 * different device/browser session.
 */
export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16 sm:py-20">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="m12 19-7-7 7-7M19 12H5" />
        </svg>
        Volver al inicio
      </Link>

      <p className="mt-6 font-sans text-sm tracking-widest text-champagne uppercase">
        Mi cuenta
      </p>
      <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
        Iniciar sesión
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Ingresá con el email y la contraseña que usaste al reclamar tu
        cuenta desde el estado de tu compra.
      </p>

      <div className="mt-8">
        <LoginForm action={loginAction} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        ¿Todavía no reclamaste tu cuenta?{" "}
        <Link href="/" className="text-champagne underline">
          Volvé a la página principal
        </Link>{" "}
        y buscá el link a tu orden.
      </p>
    </div>
  );
}
