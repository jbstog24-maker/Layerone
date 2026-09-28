import { describe, expect, it } from "vitest";
import { humanizeError } from "../client/src/lib/humanizeError";

describe("humanizeError", () => {
  it("extracts the message from a zod issue array", () => {
    const raw =
      '[{ "origin": "string", "code": "too_small", "minimum": 8, "inclusive": true, "path": ["password"], "message": "Password must be at least 8 characters" }]';
    expect(humanizeError(new Error(raw))).toBe("Password must be at least 8 characters");
  });

  it("extracts the first message when several issues are present", () => {
    const raw =
      '[{"code":"invalid_type","message":"Invalid input: expected string","path":["email"]}, {"code":"too_small","message":"Too short","path":["password"]}]';
    expect(humanizeError(new Error(raw))).toBe("Invalid input: expected string");
  });

  it("passes plain messages through unchanged", () => {
    expect(humanizeError(new Error("Invalid email or password."))).toBe("Invalid email or password.");
  });

  it("handles non-Error inputs", () => {
    expect(humanizeError("Something broke")).toBe("Something broke");
    expect(humanizeError(null)).toBe("Something went wrong. Please try again.");
  });

  it("falls back to raw text when JSON parsing fails", () => {
    expect(humanizeError(new Error("[not json"))).toBe("[not json");
  });
});
