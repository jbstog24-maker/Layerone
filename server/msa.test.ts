import { describe, it, expect } from "vitest";

import { buildMsaHtml, generateMsaToken } from "./msa";

describe("generateMsaToken", () => {
  it("returns a 64-char hex token", () => {
    const token = generateMsaToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique tokens", () => {
    expect(generateMsaToken()).not.toBe(generateMsaToken());
  });
});

describe("buildMsaHtml", () => {
  const html = buildMsaHtml(
    { company: "Acme Corp", contactName: "Jane Doe" },
    { tierName: "Professional", amount: "$1,500.00" }
  );

  it("merges all placeholders", () => {
    expect(html).toContain("Acme Corp");
    expect(html).toContain("Jane Doe");
    expect(html).toContain("Professional");
    expect(html).toContain("$1,500.00");
    expect(html).not.toMatch(/\{\{(company|contactName|date|tierName|amount)\}\}/);
  });

  it("includes the key MSA sections", () => {
    for (const section of [
      "Services",
      "Fees",
      "Liability",
      "Confidentiality",
      "Termination",
      "Governing Law",
    ]) {
      expect(html).toContain(section);
    }
    expect(html).toContain("Texas");
  });

  it("escapes HTML in user input", () => {
    const evil = buildMsaHtml(
      { company: "<script>alert(1)</script>", contactName: "A&B" },
      { tierName: "Basic", amount: "$1" }
    );
    expect(evil).not.toContain("<script>alert(1)</script>");
    expect(evil).toContain("&lt;script&gt;");
    expect(evil).toContain("A&amp;B");
  });
});
