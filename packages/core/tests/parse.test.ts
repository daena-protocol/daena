import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse, tryParse, DaenaParseError } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const phoSaigon = readFileSync(
  join(here, "fixtures/pho-saigon.daena.json"),
  "utf8"
);

describe("parse()", () => {
  it("parses and validates the pho-saigon fixture", () => {
    const doc = parse(phoSaigon);
    expect(doc.daena).toBe("0");
    expect(doc.publisher).toBe("did:web:phosaigon.example");
    expect(doc.facts).toHaveLength(4);
    expect(doc.capabilities).toHaveLength(1);
    expect(doc.render?.title).toBe("Pho Saigon — Cambridge, MA");
  });

  it("accepts a pre-parsed object as well as a JSON string", () => {
    const obj = JSON.parse(phoSaigon);
    const doc = parse(obj);
    expect(doc.publisher).toBe("did:web:phosaigon.example");
  });

  it("rejects an unknown daena version", () => {
    const bad = { ...JSON.parse(phoSaigon), daena: "1" };
    expect(() => parse(bad)).toThrow(DaenaParseError);
  });

  it("rejects a document missing the signature", () => {
    const broken = JSON.parse(phoSaigon);
    delete broken.signature;
    expect(() => parse(broken)).toThrow(DaenaParseError);
  });
});

describe("tryParse()", () => {
  it("returns ok:true for a valid document", () => {
    const result = tryParse(phoSaigon);
    expect(result.ok).toBe(true);
  });

  it("returns ok:false with structured issues for an invalid document", () => {
    const result = tryParse({ daena: "0", publisher: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      expect(result.error.issues[0]?.path).toBeDefined();
    }
  });
});
