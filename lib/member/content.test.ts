import { describe, expect, it } from "vitest";
import { placeholderCourseContent } from "./content";

describe("placeholderCourseContent", () => {
  it("provides at least one lesson for every tier sold (inicial/plus/premium)", () => {
    for (const key of ["inicial", "plus", "premium"] as const) {
      expect(placeholderCourseContent[key].length).toBeGreaterThan(0);
      for (const lesson of placeholderCourseContent[key]) {
        expect(lesson.title).toMatch(/\S/);
        expect(lesson.videoUrl).toMatch(/\S/);
      }
    }
  });
});
