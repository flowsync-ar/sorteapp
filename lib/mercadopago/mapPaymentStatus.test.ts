import { describe, expect, it } from "vitest";
import { mapMercadoPagoStatusToOrderStatus } from "./mapPaymentStatus";

describe("mapMercadoPagoStatusToOrderStatus", () => {
  it("maps 'approved' to 'approved'", () => {
    expect(mapMercadoPagoStatusToOrderStatus("approved")).toBe("approved");
  });

  it.each(["rejected", "cancelled", "charged_back", "refunded"])(
    "maps '%s' to 'rejected'",
    (mpStatus) => {
      expect(mapMercadoPagoStatusToOrderStatus(mpStatus)).toBe("rejected");
    },
  );

  it.each(["pending", "in_process", "authorized", "in_mediation"])(
    "maps in-flight status '%s' to 'pending' (no transition yet)",
    (mpStatus) => {
      expect(mapMercadoPagoStatusToOrderStatus(mpStatus)).toBe("pending");
    },
  );

  it("maps unknown/future MP statuses to 'pending' instead of guessing", () => {
    expect(mapMercadoPagoStatusToOrderStatus("some_future_status")).toBe(
      "pending",
    );
  });

  it("maps null/undefined to 'pending'", () => {
    expect(mapMercadoPagoStatusToOrderStatus(undefined)).toBe("pending");
    expect(mapMercadoPagoStatusToOrderStatus(null)).toBe("pending");
  });
});
