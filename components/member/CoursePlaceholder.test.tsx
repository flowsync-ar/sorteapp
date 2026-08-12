import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoursePlaceholder } from "./CoursePlaceholder";

describe("CoursePlaceholder", () => {
  it("shows a locked message and no lessons when the buyer has no course access", () => {
    render(<CoursePlaceholder hasCourseAccess={false} tierKeys={[]} />);

    expect(screen.getByText(/todavía no tenés una orden aprobada/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /bienvenida/i })).not.toBeInTheDocument();
  });

  it("lists the lessons for every purchased tier when access is granted", () => {
    render(<CoursePlaceholder hasCourseAccess tierKeys={["inicial", "plus"]} />);

    expect(screen.getAllByText(/bienvenida y primeros pasos/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/fundamentos avanzados/i)).toBeInTheDocument();
  });
});
