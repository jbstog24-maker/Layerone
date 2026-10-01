import { describe, expect, it } from "vitest";
import { calculateTermination, ADMIN_FEE_RATE } from "./routers/termination";

// MSA Section 7.4 (Branden's terms, 2026-10-01):
//   netSpaceCost = spaceCost − recovery
//   adminFee     = 15% × (totalPaid − netSpaceCost)
//   forfeit      = netSpaceCost + adminFee
//   refund       = totalPaid − forfeit

describe("calculateTermination", () => {
  it("applies the documented example: $4,698 paid, $1,000 space cost", () => {
    const b = calculateTermination(469800, 100000, 0);
    expect(b.netSpaceCostCents).toBe(100000);
    expect(b.adminFeeCents).toBe(Math.round(369800 * ADMIN_FEE_RATE)); // 55,470
    expect(b.forfeitCents).toBe(100000 + 55470);
    expect(b.refundCents).toBe(469800 - 155470);
    expect(b.forfeitCents + b.refundCents).toBe(b.totalPaidCents);
  });

  it("offsets space cost by re-lease recovery dollar-for-dollar", () => {
    const b = calculateTermination(469800, 100000, 40000);
    expect(b.netSpaceCostCents).toBe(60000);
    expect(b.adminFeeCents).toBe(Math.round(409800 * ADMIN_FEE_RATE));
    expect(b.forfeitCents + b.refundCents).toBe(b.totalPaidCents);
  });

  it("no space committed yet → forfeit is just 15% of the total", () => {
    const b = calculateTermination(469800, 0, 0);
    expect(b.netSpaceCostCents).toBe(0);
    expect(b.adminFeeCents).toBe(Math.round(469800 * ADMIN_FEE_RATE));
    expect(b.refundCents).toBe(469800 - b.adminFeeCents);
  });

  it("recovery can never exceed space cost (net floors at zero)", () => {
    const b = calculateTermination(100000, 50000, 90000);
    expect(b.netSpaceCostCents).toBe(0);
    expect(b.adminFeeCents).toBe(Math.round(100000 * ADMIN_FEE_RATE));
  });

  it("space cost above total paid → refund floors at zero, never negative", () => {
    const b = calculateTermination(100000, 200000, 0);
    expect(b.netSpaceCostCents).toBe(200000);
    expect(b.adminFeeCents).toBe(0); // remainder is zero
    expect(b.refundCents).toBe(0);
  });

  it("rounds half-cents on the admin fee consistently", () => {
    // $10.01 remainder → 15% = $1.5015 → $1.50
    const b = calculateTermination(1001, 0, 0);
    expect(b.adminFeeCents).toBe(150);
    expect(b.forfeitCents + b.refundCents).toBe(1001);
  });

  it("negative inputs are clamped to zero", () => {
    const b = calculateTermination(-500, -100, -50);
    expect(b.totalPaidCents).toBe(0);
    expect(b.refundCents).toBe(0);
    expect(b.forfeitCents).toBe(0);
  });
});
