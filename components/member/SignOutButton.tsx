interface SignOutButtonProps {
  action: () => Promise<void>;
}

/**
 * Minimal sign-out control for `/mi-cuenta`. A plain `<form action={...}>`
 * bound to a Server Action needs no client-side state, so — unlike
 * `ClaimAccountForm`/`LoginForm` — this stays a Server Component.
 */
export function SignOutButton({ action }: SignOutButtonProps) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-sm text-muted-foreground underline hover:text-foreground"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
