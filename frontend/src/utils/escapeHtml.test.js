import { describe, it, expect } from "vitest";
import { escapeHtml } from "./escapeHtml";

describe("escapeHtml", () => {
  it("escapa & < > \" '", () => {
    expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe(
      "&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;"
    );
  });
  it("maneja null, undefined y números", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(12)).toBe("12");
  });
  it("no altera texto normal", () => {
    expect(escapeHtml("Camiseta Roja")).toBe("Camiseta Roja");
  });
});
