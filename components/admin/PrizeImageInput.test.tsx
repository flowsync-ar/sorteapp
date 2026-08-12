import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrizeImageInput } from "./PrizeImageInput";

function makeFile(overrides: Partial<{ name: string; type: string; size: number }> = {}) {
  const bytes = new Uint8Array(overrides.size ?? 1024).fill(1);
  return new File([bytes], overrides.name ?? "premio.jpg", {
    type: overrides.type ?? "image/jpeg",
  });
}

describe("PrizeImageInput", () => {
  it("renders a labeled file input that accepts images", () => {
    render(<PrizeImageInput />);

    const input = screen.getByLabelText(/foto del premio/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("accept", "image/*");
    expect(input).toHaveAttribute("name", "prizeImage");
  });

  it("shows an inline preview after selecting a valid image", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:preview-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    render(<PrizeImageInput />);
    const input = screen.getByLabelText(/foto del premio/i) as HTMLInputElement;
    await user.upload(input, makeFile());

    expect(createObjectURL).toHaveBeenCalledWith(input.files?.[0]);
    expect(screen.getByAltText(/vista previa/i)).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it("shows an inline error and clears the input for an invalid file, without creating a preview", async () => {
    // applyAccept: false — user-event filters uploads by the input's `accept`
    // attribute by default, so it would silently drop this PDF before firing
    // `change`. Real drag-and-drop can bypass `accept`, so the component's
    // defensive validation still needs coverage.
    const user = userEvent.setup({ applyAccept: false });
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:preview-url");

    render(<PrizeImageInput />);
    const input = screen.getByLabelText(/foto del premio/i) as HTMLInputElement;
    await user.upload(input, makeFile({ type: "application/pdf", name: "premio.pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/formato no permitido/i);
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(screen.queryByAltText(/vista previa/i)).not.toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
