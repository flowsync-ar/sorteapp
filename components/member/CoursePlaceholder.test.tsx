import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoursePlaceholder } from "./CoursePlaceholder";

describe("CoursePlaceholder", () => {
  it("shows a locked message and no lessons when the buyer has no course access", () => {
    render(<CoursePlaceholder hasCourseAccess={false} />);

    expect(screen.getByText(/todavía no tenés una orden aprobada/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /bienvenida/i })).not.toBeInTheDocument();
  });

  it("lists the fixed course bundle when access is granted", () => {
    render(<CoursePlaceholder hasCourseAccess />);

    expect(screen.getByText(/bienvenida y primeros pasos/i)).toBeInTheDocument();
    expect(screen.getByText(/fundamentos avanzados/i)).toBeInTheDocument();
  });
});
