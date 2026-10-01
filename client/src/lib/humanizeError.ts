/**
 * Turn a tRPC/mutation error into a plain-English message for the user.
 *
 * tRPC surfaces zod validation failures as a raw JSON array of issues
 * (e.g. `[{"code":"too_small",...,"message":"Password must be at least 8
 * characters"}]`), which is meaningless to users. This extracts the first
 * human-readable issue message instead. Anything else passes through
 * unchanged.
 */
export function humanizeError(err: unknown): string {
  const raw =
    (typeof err === "object" && err !== null && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err ?? "")) || "Something went wrong. Please try again.";

  const trimmed = raw.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const issues = Array.isArray(parsed) ? parsed : parsed?.issues;
      if (Array.isArray(issues) && issues.length > 0) {
        const first = issues[0] as { message?: unknown; path?: unknown };
        if (typeof first?.message === "string" && first.message.trim()) {
          return first.message.trim();
        }
      }
      // Some tRPC errors nest the message one level deeper.
      if (parsed && typeof parsed === "object" && typeof (parsed as { message?: unknown }).message === "string") {
        const nested = humanizeError((parsed as { message: string }).message);
        if (nested !== raw) return nested;
      }
    } catch {
      // Not actually JSON - fall through to the raw message.
    }
  }
  return raw;
}
