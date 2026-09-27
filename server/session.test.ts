import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression test: with VITE_APP_ID unset (as on Render), session tokens
// must still verify. Previously createSessionToken() embedded an empty
// appId and verifySession() rejected it, so every login issued a cookie
// that failed on the next authenticated request (user bounced to /).
describe("self-hosted session tokens", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.VITE_APP_ID;
    process.env.JWT_SECRET = "test-secret-for-session-roundtrip";
  });

  it("issues a token that verifies without VITE_APP_ID", async () => {
    const { sdk } = await import("./_core/sdk");
    const token = await sdk.createSessionToken("local:test@example.com", {
      name: "Test User",
    });
    const session = await sdk.verifySession(token);
    expect(session).not.toBeNull();
    expect(session?.openId).toBe("local:test@example.com");
    expect(session?.name).toBe("Test User");
    expect(session?.appId).toBeTruthy();
  });

  it("rejects a missing or garbage token", async () => {
    const { sdk } = await import("./_core/sdk");
    expect(await sdk.verifySession(undefined)).toBeNull();
    expect(await sdk.verifySession("not-a-token")).toBeNull();
  });
});
