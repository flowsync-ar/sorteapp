/**
 * Placeholder course content shown in `/mi-cuenta` once a buyer has course
 * access (tasks.md PR8.3). No `course_track`/`track_lesson` tables exist
 * yet — design.md's schema migration comment explicitly deferred them to
 * "member-area/PR8 work", but this batch's scope only requires PROVING the
 * access gate (spec.md §7), not building a real course catalog. Follows the
 * exact same static-content convention `lib/marketing/content.ts` (PR4)
 * used for the landing page — presentational data only, no fetching.
 *
 * TODO: contenido real del curso — reemplazar por `course_track`/
 * `track_lesson` reales (design.md §2) cuando exista el catálogo, y migrar
 * este gate a `course_access` si se necesita granularidad por track.
 */

export interface PlaceholderLesson {
  title: string;
  /** Example asset — TODO: contenido real del curso. */
  videoUrl: string;
}

export const placeholderCourseContent: Record<
  "inicial" | "plus" | "premium",
  PlaceholderLesson[]
> = {
  inicial: [
    {
      title: "Bienvenida y primeros pasos",
      videoUrl: "https://example.com/cursos/inicial/leccion-1.mp4",
    },
  ],
  plus: [
    {
      title: "Bienvenida y primeros pasos",
      videoUrl: "https://example.com/cursos/plus/leccion-1.mp4",
    },
    {
      title: "Fundamentos avanzados",
      videoUrl: "https://example.com/cursos/plus/leccion-2.mp4",
    },
  ],
  premium: [
    {
      title: "Bienvenida y primeros pasos",
      videoUrl: "https://example.com/cursos/premium/leccion-1.mp4",
    },
    {
      title: "Fundamentos avanzados",
      videoUrl: "https://example.com/cursos/premium/leccion-2.mp4",
    },
    {
      title: "Catálogo completo desbloqueado",
      videoUrl: "https://example.com/cursos/premium/leccion-3.mp4",
    },
  ],
};
