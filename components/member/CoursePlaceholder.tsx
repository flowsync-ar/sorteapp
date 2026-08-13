import { placeholderCourseContent } from "@/lib/member/content";

interface CoursePlaceholderProps {
  hasCourseAccess: boolean;
}

/**
 * Course content section (tasks.md PR8.3–8.4, spec.md §7 "Acceso post-pago").
 * Access gate lives in `lib/member/access.ts` — this component only renders
 * the two branches: locked (no `approved` order yet) or unlocked (the fixed
 * placeholder bundle, `lib/member/content.ts` — same for every buyer
 * regardless of which chance tier they bought, change: edition-tiers).
 *
 * `hasCourseAccess=false` is deliberately rendered even for a logged-in
 * user with pending/rejected orders only (spec.md §7: "no alcanza con
 * estar logueado").
 */
export function CoursePlaceholder({ hasCourseAccess }: CoursePlaceholderProps) {
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

  return (
    <ul className="space-y-2">
      {placeholderCourseContent.map((lesson) => (
        <li
          key={lesson.title}
          className="rounded-lg border border-surface bg-surface/40 p-4"
        >
          <p className="font-semibold text-foreground">{lesson.title}</p>
          {/* TODO: contenido real del curso — reemplazar por el reproductor real. */}
          <p className="mt-1 text-xs text-muted-foreground">{lesson.videoUrl}</p>
        </li>
      ))}
    </ul>
  );
}
