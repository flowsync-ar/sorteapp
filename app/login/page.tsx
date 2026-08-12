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
      <p className="font-sans text-sm tracking-widest text-champagne uppercase">
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
