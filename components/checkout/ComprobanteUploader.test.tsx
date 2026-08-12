import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComprobanteUploader } from "./ComprobanteUploader";
import type { ComprobanteFormState } from "@/lib/receipts/types";

function makeFile(overrides: Partial<{ name: string; type: string; size: number }> = {}) {
  const bytes = new Uint8Array(overrides.size ?? 1024).fill(1);
  return new File([bytes], overrides.name ?? "comprobante.jpg", {
    type: overrides.type ?? "image/jpeg",
  });
}

describe("ComprobanteUploader", () => {
  it("renders the file input and submit button", () => {
    render(<ComprobanteUploader action={vi.fn()} />);

    expect(screen.getByLabelText(/comprobante de transferencia/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /subir comprobante/i })).toBeInTheDocument();
  });

  it("blocks submission and shows an accessible error for a disallowed file type, without calling the action", async () => {
    const action = vi.fn();
    // A file's real (drag-and-dropped) MIME type can differ from what the
    // `accept` attribute would filter in the OS picker — `applyAccept:
    // false` simulates that so the client-side `validateReceiptFile` check
    // is actually exercised, not silently short-circuited by user-event's
    // own accept filtering (its default `applyAccept: true`).
    const user = userEvent.setup({ applyAccept: false });
    render(<ComprobanteUploader action={action} />);

    const input = screen.getByLabelText(/comprobante de transferencia/i);
    await user.upload(input, makeFile({ name: "virus.exe", type: "application/x-msdownload" }));
    await user.click(screen.getByRole("button", { name: /subir comprobante/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/formato no permitido/i);
    expect(action).not.toHaveBeenCalled();
  });

  it("submits when a valid file is selected", async () => {
    const action = vi.fn().mockResolvedValue({ status: "idle" });
    const user = userEvent.setup();
    render(<ComprobanteUploader action={action} />);

    await user.upload(screen.getByLabelText(/comprobante de transferencia/i), makeFile());
    await user.click(screen.getByRole("button", { name: /subir comprobante/i }));

    expect(action).toHaveBeenCalled();
  });

  it("surfaces a server-side error returned by the action", () => {
    const errorState: ComprobanteFormState = {
      status: "error",
      formError: "Ya tenés un comprobante en revisión.",
    };
    render(
      <ComprobanteUploader
        action={vi.fn().mockResolvedValue(errorState)}
        initialStateOverride={errorState}
      />,
    );

    expect(screen.getByText("Ya tenés un comprobante en revisión.")).toBeInTheDocument();
  });

  it("shows a success state instead of the form once the action succeeds", () => {
    const successState: ComprobanteFormState = { status: "success" };
    render(
      <ComprobanteUploader
        action={vi.fn().mockResolvedValue(successState)}
        initialStateOverride={successState}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/pendiente de revisión/i);
    expect(screen.queryByRole("button", { name: /subir comprobante/i })).not.toBeInTheDocument();
  });
});
