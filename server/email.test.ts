import { describe, it, expect, vi } from "vitest";

// ── Stable mocks (hoisted so they apply before any import) ────────────────────
const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

vi.mock("./_core/env", () => ({
  ENV: {
    resendApiKey: "re_test_key_123",
    resendFromEmail: "hello@nsds.com",
  },
}));

import { sendWelcomeEmail } from "./email";

describe("sendWelcomeEmail", () => {
  it("returns true when email is sent successfully", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "test-id" }, error: null });

    const result = await sendWelcomeEmail({
      to: "prospect@example.com",
      name: "Jane Smith",
      company: "Acme Corp",
      tier: "professional",
    });
    expect(result).toBe(true);
  });

  it("returns false when resend returns an error object", async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: "Invalid API key" } });

    const result = await sendWelcomeEmail({
      to: "prospect@example.com",
      name: "Jane Smith",
      company: "Acme Corp",
      tier: "basic",
    });
    expect(result).toBe(false);
  });

  it("returns false when resend throws an exception", async () => {
    mockSend.mockRejectedValueOnce(new Error("Network error"));

    const result = await sendWelcomeEmail({
      to: "prospect@example.com",
      name: "John Doe",
      company: "Test Co",
      tier: "enterprise",
    });
    expect(result).toBe(false);
  });

  it("sends email with correct recipient and subject", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "test-id-2" }, error: null });

    await sendWelcomeEmail({
      to: "client@company.com",
      name: "Bob Johnson",
      company: "Big Corp",
      tier: "standard",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "client@company.com",
        from: "hello@nsds.com",
        subject: expect.stringContaining("Standard"),
      })
    );
  });
});
