import { describe, expect, it } from "vitest";
import { sanitizeMaterialHtml } from "../sanitize";

describe("sanitizeMaterialHtml", () => {
  it("tag yang diizinkan tetap ada", () => {
    const html = "<h2>Judul</h2><p>Halo <strong>tebal</strong> <em>miring</em></p><ul><li>item</li></ul>";
    expect(sanitizeMaterialHtml(html)).toContain("<h2>");
    expect(sanitizeMaterialHtml(html)).toContain("<strong>");
    expect(sanitizeMaterialHtml(html)).toContain("<em>");
    expect(sanitizeMaterialHtml(html)).toContain("<li>");
  });

  it("script dan onclick dibuang", () => {
    const html = '<p>ok</p><script>alert(1)</script><p onclick="x()">klik</p>';
    const clean = sanitizeMaterialHtml(html);
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).toContain("ok");
  });

  it("javascript: href dibuang", () => {
    const clean = sanitizeMaterialHtml('<a href="javascript:alert(1)">x</a>');
    expect(clean).not.toContain("javascript:");
  });

  it("img dengan src http tetap", () => {
    const clean = sanitizeMaterialHtml('<img src="https://example.com/a.png" alt="a">');
    expect(clean).toContain("<img");
    expect(clean).toContain('alt="a"');
  });

  it("link selalu dapat rel noopener noreferrer", () => {
    const clean = sanitizeMaterialHtml('<a href="https://example.com" target="_blank">x</a>');
    expect(clean).toContain('rel="noopener noreferrer"');
  });

  it("string kosong aman", () => {
    expect(sanitizeMaterialHtml("")).toBe("");
  });
});
