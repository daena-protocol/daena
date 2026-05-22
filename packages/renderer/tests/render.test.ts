import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "@daena/core";
import { render } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(
  here,
  "../../core/tests/fixtures/pho-saigon.daena.json"
);
const phoSaigon = readFileSync(fixturePath, "utf8");
const doc = parse(phoSaigon);
const html = render(doc);

describe("render()", () => {
  it("produces a complete HTML document", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("</html>");
  });

  it("uses the title from render hints in <title> and header", () => {
    expect(html).toContain("<title>Pho Saigon</title>");
    expect(html).toContain('<h1 class="title">Pho Saigon</h1>');
  });

  it("uses the accent color from render hints", () => {
    expect(html).toContain("--accent: #b91c1c");
  });

  it("renders menu items with formatted prices and dietary tags", () => {
    expect(html).toContain("Pho Bo");
    expect(html).toContain("$14.50");
    expect(html).toContain("Pho Chay");
    expect(html).toContain("vegan");
  });

  it("renders the hours as a table", () => {
    expect(html).toContain("11:00 – 22:00");
    expect(html).toContain("<td>mon</td>");
  });

  it("renders the reservation capability as a form posting to the endpoint", () => {
    expect(html).toContain("Make a reservation");
    expect(html).toContain(
      'action="https://phosaigon.example/daena/act/reserve"'
    );
    expect(html).toContain('type="datetime-local"');
    expect(html).toContain('type="number"');
    expect(html).toContain('type="tel"');
  });

  it("includes the publisher DID in the header", () => {
    expect(html).toContain("did:web:phosaigon.example");
  });

  it("escapes user-controlled content to prevent script injection", () => {
    const evil = parse({
      ...JSON.parse(phoSaigon),
      publisher: "did:web:<script>alert(1)</script>"
    });
    const evilHtml = render(evil);
    expect(evilHtml).not.toContain("<script>alert(1)</script>");
    expect(evilHtml).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
