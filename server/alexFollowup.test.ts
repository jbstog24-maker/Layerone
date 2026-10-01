import { describe, it, expect, vi, beforeEach } from "vitest";

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
    resendFromEmail: "info@layeronestaging.com",
    supportEmail: "info@layeronestaging.com",
    supportPhone: "+1 (469) 537-4378",
  },
}));

import {
  extractEmailFromText,
  hasQuoteInterest,
  normalizePhoneDigits,
  samePhone,
  matchesInquiryCall,
  maybeSendQuoteFollowup,
  type FollowupStore,
} from "./alexFollowup";
import type { ExtractedCallLog } from "./callLog";

function fields(overrides: Partial<ExtractedCallLog> = {}): ExtractedCallLog {
  return {
    blandCallId: "call-123",
    direction: "inbound",
    fromNumber: "+12145550100",
    toNumber: "+14695374378",
    callerName: "Jane Smith",
    company: "Acme Corp",
    startedAt: new Date(),
    durationSeconds: 120,
    summary: null,
    recordingUrl: null,
    transcript: null,
    ...overrides,
  };
}

function mockStore(sent = false): FollowupStore & { wasSent: ReturnType<typeof vi.fn>; marked: ReturnType<typeof vi.fn> } {
  const wasSent = vi.fn().mockResolvedValue(sent);
  const marked = vi.fn().mockResolvedValue(undefined);
  return {
    wasFollowupSent: wasSent,
    markFollowupSent: marked,
    wasSent,
    marked,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockResolvedValue({ data: { id: "email-id" }, error: null });
});

describe("extractEmailFromText", () => {
  it("finds an email in a call summary", () => {
    expect(
      extractEmailFromText("Caller Jane Smith, Acme Corp, callback 214-555-0100, email jane@acme.com, needs pallet storage quote.")
    ).toBe("jane@acme.com");
  });

  it("returns null when no email is present", () => {
    expect(extractEmailFromText("Caller asked about hours of operation.")).toBeNull();
    expect(extractEmailFromText(null)).toBeNull();
    expect(extractEmailFromText("")).toBeNull();
  });

  it("returns the first email when several are present", () => {
    expect(extractEmailFromText("a@x.com and b@y.org")).toBe("a@x.com");
  });

  it("handles uppercase and plus-addressing", () => {
    expect(extractEmailFromText("Email: Jane.Doe+work@Acme.COM")).toBe("Jane.Doe+work@Acme.COM");
  });
});

describe("hasQuoteInterest", () => {
  it.each([
    "Caller wants a quote for 40 laptops across 6 sites.",
    "Asked about PRICING for pallet storage.",
    "What is the price per pallet?",
    "Concerned about cost for a large rollout.",
    "Requested an estimate for kitting.",
    "Wants a proposal emailed to them.",
  ])("detects interest: %s", (text) => {
    expect(hasQuoteInterest(text)).toBe(true);
  });

  it.each([
    "Wrong number, caller hung up immediately.",
    "No answer - went to voicemail.",
    "Caller asked about business hours.",
    "Spam call about extended warranty.",
    "",
  ])("rejects non-quote calls: %s", (text) => {
    expect(hasQuoteInterest(text)).toBe(false);
  });

  it("returns false for null", () => {
    expect(hasQuoteInterest(null)).toBe(false);
  });
});

describe("normalizePhoneDigits / samePhone", () => {
  it("strips formatting", () => {
    expect(normalizePhoneDigits("+1 (214) 555-0100")).toBe("12145550100");
  });

  it("returns null for junk", () => {
    expect(normalizePhoneDigits(null)).toBeNull();
    expect(normalizePhoneDigits("abc")).toBeNull();
  });

  it("tolerates the +1 country code", () => {
    expect(samePhone("12145550100", "2145550100")).toBe(true);
    expect(samePhone("2145550100", "12145550100")).toBe(true);
  });

  it("rejects different numbers", () => {
    expect(samePhone("12145550100", "12145550200")).toBe(false);
    expect(samePhone(null, "12145550100")).toBe(false);
  });
});

describe("matchesInquiryCall", () => {
  it("matches an inbound call by caller phone", () => {
    expect(
      matchesInquiryCall(
        { direction: "inbound", fromNumber: "+1 (214) 555-0100", toNumber: "+14695374378", summary: null, transcript: null },
        "12145550100",
        null,
      )
    ).toBe(true);
  });

  it("matches an outbound callback by the dialed number", () => {
    expect(
      matchesInquiryCall(
        { direction: "outbound", fromNumber: "+14695374378", toNumber: "2145550100", summary: null, transcript: null },
        "12145550100",
        null,
      )
    ).toBe(true);
  });

  it("matches by the email found in the call summary", () => {
    expect(
      matchesInquiryCall(
        { direction: "inbound", fromNumber: "+19998887777", toNumber: "+14695374378", summary: "email Jane@Acme.com, wants quote", transcript: null },
        null,
        "jane@acme.com",
      )
    ).toBe(true);
  });

  it("does not match unrelated calls", () => {
    expect(
      matchesInquiryCall(
        { direction: "inbound", fromNumber: "+19998887777", toNumber: "+14695374378", summary: "asked about hours", transcript: null },
        "12145550100",
        "jane@acme.com",
      )
    ).toBe(false);
  });
});

describe("maybeSendQuoteFollowup", () => {
  it("sends when an email and quote interest are present", async () => {
    const store = mockStore(false);
    const result = await maybeSendQuoteFollowup(
      fields({ summary: "Jane Smith, Acme Corp, jane@acme.com, wants a quote for pallet storage." }),
      store,
    );
    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sendArg = mockSend.mock.calls[0][0];
    expect(sendArg.to).toBe("jane@acme.com");
    expect(sendArg.html).toContain("https://www.layeronestaging.com/get-started");
    expect(store.marked).toHaveBeenCalledWith("call-123");
  });

  it("falls back to the transcript when the summary has no email", async () => {
    const store = mockStore(false);
    const result = await maybeSendQuoteFollowup(
      fields({
        summary: "Caller wants pricing for a rollout.",
        transcript: "Caller: my email is jane@acme.com",
      }),
      store,
    );
    expect(result).toBe(true);
    expect(mockSend.mock.calls[0][0].to).toBe("jane@acme.com");
  });

  it("does not send without an email address", async () => {
    const store = mockStore(false);
    const result = await maybeSendQuoteFollowup(
      fields({ summary: "Caller wants a quote but gave no email." }),
      store,
    );
    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
    expect(store.marked).not.toHaveBeenCalled();
  });

  it("does not send without quote interest", async () => {
    const store = mockStore(false);
    const result = await maybeSendQuoteFollowup(
      fields({ summary: "jane@acme.com asked about business hours." }),
      store,
    );
    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("does not send for wrong numbers / hangups", async () => {
    const store = mockStore(false);
    const result = await maybeSendQuoteFollowup(
      fields({ summary: "Wrong number - jane@acme.com, caller hung up." }),
      store,
    );
    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("is idempotent: skips when the follow-up was already sent", async () => {
    const store = mockStore(true);
    const result = await maybeSendQuoteFollowup(
      fields({ summary: "jane@acme.com wants a quote." }),
      store,
    );
    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
    expect(store.marked).not.toHaveBeenCalled();
  });

  it("does not send when there is no call id to track idempotency", async () => {
    const store = mockStore(false);
    const result = await maybeSendQuoteFollowup(
      fields({ blandCallId: null, summary: "jane@acme.com wants a quote." }),
      store,
    );
    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("never throws when the store fails", async () => {
    const store: FollowupStore = {
      wasFollowupSent: vi.fn().mockRejectedValue(new Error("db down")),
      markFollowupSent: vi.fn(),
    };
    const result = await maybeSendQuoteFollowup(
      fields({ summary: "jane@acme.com wants a quote." }),
      store,
    );
    expect(result).toBe(false);
  });

  it("never throws when Resend fails, and does not mark sent", async () => {
    mockSend.mockRejectedValueOnce(new Error("network down"));
    const store = mockStore(false);
    const result = await maybeSendQuoteFollowup(
      fields({ summary: "jane@acme.com wants a quote." }),
      store,
    );
    expect(result).toBe(false);
    expect(store.marked).not.toHaveBeenCalled();
  });

  it("returns false when Resend reports an error object", async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: "Invalid API key" } });
    const store = mockStore(false);
    const result = await maybeSendQuoteFollowup(
      fields({ summary: "jane@acme.com wants a quote." }),
      store,
    );
    expect(result).toBe(false);
    expect(store.marked).not.toHaveBeenCalled();
  });
});
