/**
 * Shared plain-text handling for outbound emails.
 *
 * Every email we send is HTML-first (buttons, branding, styling). Resend
 * sends both parts (multipart/alternative) so mail clients that render
 * plain text show a clean, readable version instead of raw markup.
 */
import type { Resend, CreateEmailOptions } from "resend";

/** The non-template send variant, with an HTML body required. */
type HtmlEmailPayload = Extract<CreateEmailOptions, { template?: never }> & {
  html: string;
};

/**
 * Convert an HTML email body to clean plain text:
 * - links become "label (url)", tel: links become just the label
 * - block elements become line breaks, remaining tags are stripped
 * - common entities are decoded, whitespace is normalized
 */
export function htmlToText(html: string): string {
  let text = html;

  // Links first, while the anchors are still intact.
  text = text.replace(
    /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href: string, inner: string) => {
      const label = inner
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (/^tel:/i.test(href)) return label;
      if (!label || label === href) return href;
      return `${label} (${href})`;
    }
  );

  // Block-level elements (opening or closing) become line breaks.
  text = text.replace(
    /<\/?(br|p|div|tr|li|h[1-6]|table|ul|ol|td|th|thead|tbody|body|html|head|title|meta)[^>]*>/gi,
    "\n"
  );

  // Strip any remaining tags.
  text = text.replace(/<[^>]+>/g, "");

  // Decode common entities.
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'");

  // Normalize whitespace: trim each line, collapse blank runs.
  text = text
    .split("\n")
    .map((l) => l.replace(/[ \t\u00a0]+/g, " ").trim())
    .join("\n");
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

/**
 * Drop-in replacement for `resend.emails.send` that auto-attaches a
 * plain-text version derived from the HTML body. Payloads without an
 * HTML string pass through untouched.
 */
export async function sendHtmlEmail(resend: Resend, payload: HtmlEmailPayload) {
  return resend.emails.send({ ...payload, text: htmlToText(payload.html) });
}
