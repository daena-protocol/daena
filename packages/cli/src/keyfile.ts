/**
 * Daena keypair file format (v0).
 *
 * A simple JSON envelope that carries an ed25519 keypair. The file is
 * written with chmod 600 on POSIX systems so other users can't read it.
 */
import { chmodSync, readFileSync, writeFileSync } from "node:fs";

export interface KeyFile {
  type: "daena-keypair-v0";
  algorithm: "ed25519";
  /** Base64-encoded 32-byte ed25519 seed (private key material). */
  privateKey: string;
  /** Base64-encoded 32-byte ed25519 public key. */
  publicKey: string;
  /** The same public key, multibase-encoded with the multicodec prefix. */
  publicKeyMultibase: string;
}

export function writeKeyFile(path: string, key: KeyFile): void {
  writeFileSync(path, JSON.stringify(key, null, 2) + "\n", {
    encoding: "utf8",
    mode: 0o600
  });
  // mode on writeFileSync is only respected for newly created files; chmod to
  // be sure on existing files (e.g. when --force overwrites).
  try {
    chmodSync(path, 0o600);
  } catch {
    // chmod may fail on Windows or some filesystems — non-fatal.
  }
}

export function readKeyFile(path: string): KeyFile {
  const raw = readFileSync(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Key file ${path} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`
    );
  }
  if (!isKeyFile(parsed)) {
    throw new Error(
      `Key file ${path} is not a valid daena-keypair-v0 file`
    );
  }
  return parsed;
}

function isKeyFile(v: unknown): v is KeyFile {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o.type === "daena-keypair-v0" &&
    o.algorithm === "ed25519" &&
    typeof o.privateKey === "string" &&
    typeof o.publicKey === "string" &&
    typeof o.publicKeyMultibase === "string"
  );
}
