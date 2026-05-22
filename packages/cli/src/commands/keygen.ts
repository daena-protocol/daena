import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  generateEd25519KeyPair,
  encodeMultibaseEd25519
} from "@daena/verifier";
import { bold, dim, green, yellow } from "../ansi.js";
import { writeKeyFile, type KeyFile } from "../keyfile.js";

interface KeygenOptions {
  output: string;
  did: string;
  didDocOutput: string | undefined;
  keyId: string;
  force: boolean;
}

function parseArgs(args: string[]): KeygenOptions {
  const opts: KeygenOptions = {
    output: "daena.key",
    did: "did:web:example.com",
    didDocOutput: undefined,
    keyId: "key-1",
    force: false
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case "--output":
      case "-o":
        opts.output = args[++i] ?? opts.output;
        break;
      case "--did":
      case "-d":
        opts.did = args[++i] ?? opts.did;
        break;
      case "--did-doc-output":
        opts.didDocOutput = args[++i];
        break;
      case "--key-id":
      case "-k":
        opts.keyId = args[++i] ?? opts.keyId;
        break;
      case "--force":
      case "-f":
        opts.force = true;
        break;
    }
  }
  return opts;
}

export async function keygen(args: string[]): Promise<number> {
  const opts = parseArgs(args);
  const outputPath = resolve(process.cwd(), opts.output);

  if (existsSync(outputPath) && !opts.force) {
    console.error(
      `daena: ${opts.output} already exists. Use --force to overwrite.`
    );
    return 1;
  }
  if (opts.didDocOutput) {
    const didDocPath = resolve(process.cwd(), opts.didDocOutput);
    if (existsSync(didDocPath) && !opts.force) {
      console.error(
        `daena: ${opts.didDocOutput} already exists. Use --force to overwrite.`
      );
      return 1;
    }
  }

  const { publicKey, privateKey } = generateEd25519KeyPair();
  const publicKeyMultibase = encodeMultibaseEd25519(publicKey);

  const keyFile: KeyFile = {
    type: "daena-keypair-v0",
    algorithm: "ed25519",
    privateKey: Buffer.from(privateKey).toString("base64"),
    publicKey: Buffer.from(publicKey).toString("base64"),
    publicKeyMultibase
  };
  writeKeyFile(outputPath, keyFile);

  const fullKeyId = `${opts.did}#${opts.keyId}`;
  const verificationMethod = {
    id: fullKeyId,
    type: "Multikey",
    controller: opts.did,
    publicKeyMultibase
  };

  if (opts.didDocOutput) {
    const didDoc = {
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: opts.did,
      verificationMethod: [verificationMethod],
      assertionMethod: [fullKeyId]
    };
    writeFileSync(
      resolve(process.cwd(), opts.didDocOutput),
      JSON.stringify(didDoc, null, 2) + "\n",
      "utf8"
    );
  }

  console.log(`${green("✓")} Generated ed25519 keypair`);
  console.log(`${green("✓")} Wrote private key to ${bold(opts.output)} ${dim("(chmod 600)")}`);
  if (opts.didDocOutput) {
    console.log(`${green("✓")} Wrote DID document to ${bold(opts.didDocOutput)}`);
  }
  console.log("");
  console.log(`${dim("Public key (multibase):")} ${publicKeyMultibase}`);
  console.log("");
  console.log(`${bold("To publish this key, host the following at:")}`);
  console.log(`  ${dim(`https://<your-domain>/.well-known/did.json`)}`);
  console.log("");
  console.log(JSON.stringify({
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: opts.did,
    verificationMethod: [verificationMethod],
    assertionMethod: [fullKeyId]
  }, null, 2));
  console.log("");
  console.log(`${bold("Sign a document with this key:")}`);
  console.log(`  daena sign daena.json --key ${opts.output} --key-id ${fullKeyId}`);
  console.log("");
  console.log(
    yellow("⚠  Keep the private key file secret. Anyone who reads it can sign as you.")
  );

  return 0;
}
