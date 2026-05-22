import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { init } from "../src/commands/init.js";
import { validate } from "../src/commands/validate.js";
import { render } from "../src/commands/render.js";
import { keygen } from "../src/commands/keygen.js";
import { sign } from "../src/commands/sign.js";
import { readKeyFile } from "../src/keyfile.js";

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

  it("with --verify fails cleanly on a placeholder signature", async () => {
    // Pho Saigon fixture has a placeholder signature
    const didDocPath = join(tmpDir, "did.json");
    writeFileSync(didDocPath, JSON.stringify({
      id: "did:web:phosaigon.example",
      verificationMethod: []
    }));
    const out = captureOutput();
    const code = await validate([fixturePath, "--verify", "--did-doc", didDocPath]);
    out.restore();
    expect(code).toBe(1);
    // Either the signature length fails or keyId not found — both are valid
    expect(out.stderr).toMatch(/(64-byte|not found|does not verify)/);
  });
});

describe("init", () => {
  it("creates a Daena document at the requested path that itself validates", async () => {
    const outPath = join(tmpDir, "daena.json");
    const initOut = captureOutput();
    const initCode = await init([
      "--output", outPath,
      "--publisher", "did:web:test.example",
      "--title", "Test Co."
    ]);
    initOut.restore();
    expect(initCode).toBe(0);

    const content = JSON.parse(readFileSync(outPath, "utf8"));
    expect(content.daena).toBe("0");
    expect(content.publisher).toBe("did:web:test.example");
    expect(content.render.title).toBe("Test Co.");

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

describe("keygen", () => {
  it("writes a key file in the daena-keypair-v0 format", async () => {
    const keyPath = join(tmpDir, "test.key");
    const out = captureOutput();
    const code = await keygen(["--output", keyPath, "--did", "did:web:test.example"]);
    out.restore();
    expect(code).toBe(0);
    const key = readKeyFile(keyPath);
    expect(key.type).toBe("daena-keypair-v0");
    expect(key.algorithm).toBe("ed25519");
    expect(Buffer.from(key.privateKey, "base64").length).toBe(32);
    expect(Buffer.from(key.publicKey, "base64").length).toBe(32);
    expect(key.publicKeyMultibase.startsWith("z")).toBe(true);
  });

  it("optionally writes a DID document containing the public key", async () => {
    const keyPath = join(tmpDir, "test.key");
    const didDocPath = join(tmpDir, "did.json");
    const out = captureOutput();
    const code = await keygen([
      "--output", keyPath,
      "--did", "did:web:test.example",
      "--did-doc-output", didDocPath
    ]);
    out.restore();
    expect(code).toBe(0);
    const didDoc = JSON.parse(readFileSync(didDocPath, "utf8"));
    expect(didDoc.id).toBe("did:web:test.example");
    expect(didDoc.verificationMethod).toHaveLength(1);
    expect(didDoc.verificationMethod[0].type).toBe("Multikey");
    expect(didDoc.verificationMethod[0].publicKeyMultibase).toBe(
      readKeyFile(keyPath).publicKeyMultibase
    );
  });

  it("refuses to overwrite without --force", async () => {
    const keyPath = join(tmpDir, "test.key");
    writeFileSync(keyPath, "existing");
    const out = captureOutput();
    const code = await keygen(["--output", keyPath]);
    out.restore();
    expect(code).toBe(1);
    expect(out.stderr).toContain("already exists");
  });
});

describe("sign", () => {
  it("signs a document such that --verify succeeds with the matching DID document", async () => {
    const docPath = join(tmpDir, "daena.json");
    const keyPath = join(tmpDir, "daena.key");
    const didDocPath = join(tmpDir, "did.json");

    // 1. init
    const o1 = captureOutput();
    expect(await init([
      "--output", docPath,
      "--publisher", "did:web:test.example",
      "--title", "Test Co."
    ])).toBe(0);
    o1.restore();

    // 2. keygen with did doc output
    const o2 = captureOutput();
    expect(await keygen([
      "--output", keyPath,
      "--did", "did:web:test.example",
      "--did-doc-output", didDocPath
    ])).toBe(0);
    o2.restore();

    // 3. sign
    const o3 = captureOutput();
    expect(await sign([docPath, "--key", keyPath])).toBe(0);
    o3.restore();

    const signed = JSON.parse(readFileSync(docPath, "utf8"));
    expect(signed.signature.value).not.toBe("PLACEHOLDER_SIGNATURE_BASE64");
    expect(Buffer.from(signed.signature.value, "base64").length).toBe(64);

    // 4. validate --verify
    const o4 = captureOutput();
    const code = await validate([docPath, "--verify", "--did-doc", didDocPath]);
    o4.restore();
    expect(code).toBe(0);
    expect(o4.stdout).toContain("Signature verifies");
  });

  it("detects tampering after signing", async () => {
    const docPath = join(tmpDir, "daena.json");
    const keyPath = join(tmpDir, "daena.key");
    const didDocPath = join(tmpDir, "did.json");

    const o1 = captureOutput();
    await init(["--output", docPath, "--publisher", "did:web:test.example", "--title", "Test Co."]);
    await keygen(["--output", keyPath, "--did", "did:web:test.example", "--did-doc-output", didDocPath]);
    await sign([docPath, "--key", keyPath]);
    o1.restore();

    // Tamper
    const signed = JSON.parse(readFileSync(docPath, "utf8"));
    signed.facts[0].value = "Tampered Co.";
    writeFileSync(docPath, JSON.stringify(signed, null, 2));

    const out = captureOutput();
    const code = await validate([docPath, "--verify", "--did-doc", didDocPath]);
    out.restore();
    expect(code).toBe(1);
    expect(out.stderr).toContain("does not verify");
  });

  it("returns 2 when no file is given", async () => {
    const out = captureOutput();
    const code = await sign([]);
    out.restore();
    expect(code).toBe(2);
    expect(out.stderr).toContain("Usage:");
  });

  it("returns 1 when the key file is missing", async () => {
    const docPath = join(tmpDir, "daena.json");
    const o = captureOutput();
    await init(["--output", docPath, "--publisher", "did:web:test.example", "--title", "Test"]);
    o.restore();

    const out = captureOutput();
    const code = await sign([docPath, "--key", join(tmpDir, "nonexistent.key")]);
    out.restore();
    expect(code).toBe(1);
  });
});
