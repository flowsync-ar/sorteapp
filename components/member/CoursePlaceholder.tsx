import { placeholderCourseContent } from "@/lib/member/content";

interface CoursePlaceholderProps {
  hasCourseAccess: boolean;
  tierKeys: Array<"inicial" | "plus" | "premium">;
}

/**
 * Course content section (tasks.md PR8.3–8.4, spec.md §7 "Acceso post-pago").
 * Access gate lives in `lib/member/access.ts` — this component only renders
 * the two branches: locked (no `approved` order yet) or unlocked
 * (placeholder lessons per purchased tier, `lib/member/content.ts`).
 *
 * `hasCourseAccess=false` is deliberately rendered even for a logged-in
 * user with pending/rejected orders only (spec.md §7: "no alcanza con
 * estar logueado").
 */
export function CoursePlaceholder({ hasCourseAccess, tierKeys }: CoursePlaceholderProps) {
  if (!hasCourseAccess) {
    return (
      <div
        role="status"
        className="rounded-xl border border-surface bg-surface/40 p-5 text-sm text-muted-foreground"
      >
        Todavía no tenés una orden aprobada. En cuanto se confirme tu pago
        vas a ver acá el contenido de tu curso.
      </div>
    );
  }

  const uniqueTiers = Array.from(new Set(tierKeys));

  return (
    <div className="space-y-6">
      {uniqueTiers.map((tierKey) => (
        <div key={tierKey}>
          <h3 className="font-display text-xl text-foreground capitalize">
            Curso {tierKey}
          </h3>
          <ul className="mt-3 space-y-2">
            {placeholderCourseContent[tierKey].map((lesson) => (
              <li
                key={lesson.title}
                className="rounded-lg border border-surface bg-surface/40 p-4"
              >
                <p className="font-semibold text-foreground">{lesson.title}</p>
                {/* TODO: contenido real del curso — reemplazar por el reproductor real. */}
                <p className="mt-1 text-xs text-muted-foreground">
                  {lesson.videoUrl}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
