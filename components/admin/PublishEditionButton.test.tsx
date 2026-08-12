import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublishEditionButton } from "./PublishEditionButton";
import type { PublishEditionFormState } from "@/lib/admin/types";

describe("PublishEditionButton", () => {
  it("renders an activate button", () => {
    render(<PublishEditionButton action={vi.fn()} />);
    expect(screen.getByRole("button", { name: /activar edición/i })).toBeInTheDocument();
  });

  it("submits the bound action", async () => {
    const action = vi.fn().mockResolvedValue({ status: "idle" });
    const user = userEvent.setup();
    render(<PublishEditionButton action={action} />);

    await user.click(screen.getByRole("button", { name: /activar edición/i }));

    expect(action).toHaveBeenCalled();
  });

  it("surfaces a conflict error (another edition already open)", () => {
    const errorState: PublishEditionFormState = {
      status: "error",
      formError: "Ya hay una edición abierta. Cerrala antes de activar esta.",
    };
    render(
      <PublishEditionButton
        action={vi.fn().mockResolvedValue(errorState)}
        initialStateOverride={errorState}
      />,
    );

    expect(
      screen.getByText("Ya hay una edición abierta. Cerrala antes de activar esta."),
    ).toBeInTheDocument();
  });
});
