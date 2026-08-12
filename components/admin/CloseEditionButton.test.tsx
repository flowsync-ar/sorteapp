import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CloseEditionButton } from "./CloseEditionButton";

describe("CloseEditionButton", () => {
  it("submits the close action", async () => {
    const action = vi.fn().mockResolvedValue({ status: "idle" });
    const user = userEvent.setup();
    render(<CloseEditionButton action={action} />);

    await user.click(screen.getByRole("button", { name: /cerrar edición/i }));

    expect(action).toHaveBeenCalled();
  });

  it("surfaces a server-side error", () => {
    render(
      <CloseEditionButton
        action={vi.fn().mockResolvedValue({ status: "error", formError: "boom" })}
        initialStateOverride={{ status: "error", formError: "boom" }}
      />,
    );
    expect(screen.getByText("boom")).toBeInTheDocument();
  });
});
