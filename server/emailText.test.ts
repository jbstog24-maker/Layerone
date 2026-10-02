import { describe, expect, it } from "vitest";
import { htmlToText } from "./emailText";

describe("htmlToText", () => {
  it("converts links to label (url)", () => {
    const out = htmlToText(
      `<p>Click <a href="https://example.com/start">Get Started</a> now.</p>`
    );
    expect(out).toBe("Click Get Started (https://example.com/start) now.");
  });

  it("keeps tel: links as plain label text", () => {
    const out = htmlToText(
      `<p>Call <a href="tel:+14695374378">+1 (469) 537-4378</a>.</p>`
    );
    expect(out).toBe("Call +1 (469) 537-4378.");
  });

  it("handles a button-style link like the quote follow-up", () => {
    const out = htmlToText(
      `<table><tr><td><a href="https://www.layeronestaging.com/get-started" style="color:#fff;">Submit Your Project Details \u2192</a></td></tr></table>`
    );
    expect(out).toBe(
      "Submit Your Project Details \u2192 (https://www.layeronestaging.com/get-started)"
    );
  });

  it("turns block elements into line breaks and strips tags", () => {
    const out = htmlToText(
      `<div><p>Line one</p><p>Line two<br>still two</p></div>`
    );
    expect(out).toBe("Line one\n\nLine two\nstill two");
  });

  it("decodes common entities", () => {
    expect(htmlToText(`<p>Fish &amp; Chips&nbsp;&lt;3</p>`)).toBe(
      "Fish & Chips <3"
    );
  });

  it("collapses excessive blank lines", () => {
    const out = htmlToText(`<p>A</p><div></div><div></div><p>B</p>`);
    expect(out).toBe("A\n\nB");
  });
});
