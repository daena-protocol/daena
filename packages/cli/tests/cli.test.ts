import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { init } from "../src/commands/init.js";
import { validate } from "../src/commands/validate.js";
import { render } from "../src/commands/render.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(
  here,
  "..",
  "..",
  "core",
  "tests",
  "fixtures",
  "pho-saigon.daena.json"
);

interface CapturedOutput {
  stdout: string;
  stderr: string;
}

function captureOutput(): CapturedOutput & { restore: () => void } {
  const captured: CapturedOutput = { stdout: "", stderr: "" };
  const logSpy = vi
    .spyOn(console, "log")
    .mockImplementation((...args: unknown[]) => {
      captured.stdout += args.map((a) => String(a)).join(" ") + "\n";
    });
  const errSpy = vi
    .spyOn(console, "error")
    .mockImplementation((...args: unknown[]) => {
      captured.stderr += args.map((a) => String(a)).join(" ") + "\n";
    });
  return {
    get stdout() {
      return captured.stdout;
    },
    get stderr() {
      return captured.stderr;
    },
    restore: () => {
      logSpy.mockRestore();
      errSpy.mockRestore();
    }
  };
}

let tmpDir: string;
beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "daena-cli-"));
});
afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("validate", () => {
  it("returns 0 and prints a summary for a valid document", async () => {
    const out = captureOutput();
    const code = await validate([fixturePath]);
    out.restore();
    expect(code).toBe(0);
    expect(out.stdout).toContain("valid Daena document");
    expect(out.stdout).toContain("did:web:phosaigon.example");
    expect(out.stdout).toContain("facts");
  });

  it("returns 1 with structured issues for an invalid document", async () => {
    const badPath = join(tmpDir, "bad.json");
    writeFileSync(badPath, JSON.stringify({ daena: "1", publisher: "" }));
    const out = captureOutput();
    const code = await validate([badPath]);
    out.restore();
    expect(code).toBe(1);
    expect(out.stderr).toContain("not a valid Daena document");
  });

  it("returns 1 for malformed JSON", async () => {
    const badPath = join(tmpDir, "broken.json");
    writeFileSync(badPath, "{ not json");
    const out = captureOutput();
    const code = await validate([badPath]);
    out.restore();
    expect(code).toBe(1);
    expect(out.stderr).toContain("not valid JSON");
  });

  it("returns 2 with usage info when no file is given", async () => {
    const out = captureOutput();
    const code = await validate([]);
    out.restore();
    expect(code).toBe(2);
    expect(out.stderr).toContain("Usage:");
  });

  it("is silent on success with --quiet", async () => {
    const out = captureOutput();
    const code = await validate([fixturePath, "--quiet"]);
    out.restore();
    expect(code).toBe(0);
    expect(out.stdout).toBe("");
  });
});

describe("init", () => {
  it("creates a Daena document at the requested path that itself validates", async () => {
    const outPath = join(tmpDir, "daena.json");

    const initOut = captureOutput();
    const initCode = await init([
      "--output",
      outPath,
      "--publisher",
      "did:web:test.example",
      "--title",
      "Test Co."
    ]);
    initOut.restore();
    expect(initCode).toBe(0);

    const content = JSON.parse(readFileSync(outPath, "utf8"));
    expect(content.daena).toBe("0");
    expect(content.publisher).toBe("did:web:test.example");
    expect(content.render.title).toBe("Test Co.");

    // Round-trip: the scaffolded file must validate.
    const validateOut = captureOutput();
    const validateCode = await validate([outPath]);
    validateOut.restore();
    expect(validateCode).toBe(0);
  });

  it("refuses to overwrite an existing file without --force", async () => {
    const outPath = join(tmpDir, "daena.json");
    writeFileSync(outPath, "{ existing }");
    const out = captureOutput();
    const code = await init(["--output", outPath]);
    out.restore();
    expect(code).toBe(1);
    expect(out.stderr).toContain("already exists");
  });

  it("overwrites with --force", async () => {
    const outPath = join(tmpDir, "daena.json");
    writeFileSync(outPath, "{ existing }");
    const out = captureOutput();
    const code = await init(["--output", outPath, "--force"]);
    out.restore();
    expect(code).toBe(0);
    const content = JSON.parse(readFileSync(outPath, "utf8"));
    expect(content.daena).toBe("0");
  });
});

describe("render", () => {
  it("writes HTML to the --output file when specified", async () => {
    const outPath = join(tmpDir, "out.html");
    const out = captureOutput();
    const code = await render([fixturePath, "--output", outPath]);
    out.restore();
    expect(code).toBe(0);
    const html = readFileSync(outPath, "utf8");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Pho Saigon");
    expect(out.stderr).toContain("Rendered to");
  });

  it("returns 1 with errors for an invalid document", async () => {
    const badPath = join(tmpDir, "bad.json");
    writeFileSync(badPath, JSON.stringify({ daena: "0" }));
    const out = captureOutput();
    const code = await render([badPath]);
    out.restore();
    expect(code).toBe(1);
    expect(out.stderr).toContain("Cannot render");
  });

  it("returns 2 with usage info when no file is given", async () => {
    const out = captureOutput();
    const code = await render([]);
    out.restore();
    expect(code).toBe(2);
    expect(out.stderr).toContain("Usage:");
  });
});
