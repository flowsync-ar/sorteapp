import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignOutButton } from "./SignOutButton";

describe("SignOutButton", () => {
  it("renders a submit button that triggers the sign-out action", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SignOutButton action={action} />);

    const button = screen.getByRole("button", { name: /cerrar sesión/i });
    await user.click(button);

    expect(action).toHaveBeenCalled();
  });
});
