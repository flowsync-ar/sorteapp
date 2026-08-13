import { describe, expect, it } from "vitest";
import { placeholderCourseContent } from "./content";

describe("placeholderCourseContent", () => {
  it("provides at least one lesson, the same fixed bundle for every buyer", () => {
    expect(placeholderCourseContent.length).toBeGreaterThan(0);
    for (const lesson of placeholderCourseContent) {
      expect(lesson.title).toMatch(/\S/);
      expect(lesson.videoUrl).toMatch(/\S/);
    }
  });
});
