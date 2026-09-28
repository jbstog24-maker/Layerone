import { describe, it, expect } from "vitest";

import { buildMsaContent } from "./documents";

const base = {
  clientName: "Acme Corp",
  packageName: "Professional",
  tierKey: "professional" as const,
  addOns: [] as string[],
  basePrice: "$1,500",
  billingCycle: "per month",
  goLiveDate: "October 15, 2026",
};

describe("buildMsaContent scope import", () => {
  it("omits Schedule A when no scope is provided", () => {
    const content = buildMsaContent(base);
    expect(content).not.toContain("SCHEDULE A");
  });

  it("renders requested volumes from the request form", () => {
    const content = buildMsaContent({
      ...base,
      scope: {
        tier: "professional",
        deviceCount: 250,
        palletCount: 12,
        boxCount: 8,
        storageDays: 90,
      },
    });
    expect(content).toContain("SCHEDULE A — SCOPE OF WORK");
    expect(content).toContain("Requested package: professional");
    expect(content).toContain("Devices: 250");
    expect(content).toContain("Pallets: 12");
    expect(content).toContain("Boxes: 8");
    expect(content).toContain("Storage term: 90 days");
  });

  it("renders quote line items and total", () => {
    const content = buildMsaContent({
      ...base,
      scope: {
        quoteTotal: "2,450.00",
        quoteLineItems: [
          { label: "Device staging", qty: 250, total: "1,875.00" },
          { label: "Extended storage", total: "575.00" },
        ],
      },
    });
    expect(content).toContain("SCHEDULE A — SCOPE OF WORK");
    expect(content).toContain("Device staging (x250) — $1,875.00");
    expect(content).toContain("Extended storage — $575.00");
    expect(content).toContain("Quoted total: $2,450.00");
  });

  it("skips null/undefined volume fields", () => {
    const content = buildMsaContent({
      ...base,
      scope: { deviceCount: 100, palletCount: null, boxCount: null },
    });
    expect(content).toContain("Devices: 100");
    expect(content).not.toContain("Pallets:");
    expect(content).not.toContain("Boxes:");
  });

  it("keeps the manual add-on section alongside the imported scope", () => {
    const content = buildMsaContent({
      ...base,
      addOns: ["Rush staging service"],
      scope: { deviceCount: 50 },
    });
    expect(content).toContain("ADD-ON SERVICES");
    expect(content).toContain("Rush staging service");
    expect(content).toContain("SCHEDULE A — SCOPE OF WORK");
  });
});
