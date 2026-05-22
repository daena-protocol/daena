import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { StaticDIDResolver, type DIDDocument } from "@daena/verifier";
import type { DaenaDocument } from "@daena/core";

import {
  read,
  tryRead,
  act,
  findFact,
  findFactsByType,
  findCapability,
  DaenaClient,
  DaenaReadError,
  DaenaVerifyError,
  DaenaActError,
  DaenaParseError
} from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(
  here, "..", "..", "core", "tests", "fixtures", "pho-saigon.daena.json"
);
const didDocPath = resolve(
  here, "..", "..", "core", "tests", "fixtures", "pho-saigon.did.json"
);

let signedJson: string;
let didDoc: DIDDocument;
let resolver: StaticDIDResolver;

beforeAll(() => {
  signedJson = readFileSync(fixturePath, "utf8");
  didDoc = JSON.parse(readFileSync(didDocPath, "utf8")) as DIDDocument;
  resolver = new StaticDIDResolver({ [didDoc.id]: didDoc });
});

function mockFetchOk(body: string, contentType = "application/json"): typeof fetch {
  return vi.fn().mockResolvedValue(
    new Response(body, {
      status: 200,
      headers: { "Content-Type": contentType }
    })
  ) as unknown as typeof fetch;
}

function mockFetchStatus(status: number): typeof fetch {
  return vi.fn().mockResolvedValue(
    new Response("", { status })
  ) as unknown as typeof fetch;
}

describe("read", () => {
  it("returns a verified document when fetch + signature both succeed", async () => {
    const fetchImpl = mockFetchOk(signedJson);
    const doc = await read("https://phosaigon.example/daena.json", {
      fetchImpl,
      resolver
    });
    expect(doc.publisher).toBe("did:web:phosaigon.example");
    expect(doc.facts).toHaveLength(4);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://phosaigon.example/daena.json",
      expect.objectContaining({
        headers: { Accept: "application/json" }
      })
    );
  });

  it("throws DaenaVerifyError when the document has been tampered with", async () => {
    const tampered = JSON.parse(signedJson);
    tampered.facts[0].value = "Pwned Saigon";
    const fetchImpl = mockFetchOk(JSON.stringify(tampered));
    await expect(
      read("https://phosaigon.example/daena.json", { fetchImpl, resolver })
    ).rejects.toThrow(DaenaVerifyError);
  });

  it("skips verification with verify: false", async () => {
    const tampered = JSON.parse(signedJson);
    tampered.facts[0].value = "Pwned Saigon";
    const fetchImpl = mockFetchOk(JSON.stringify(tampered));
    const doc = await read("https://phosaigon.example/daena.json", {
      fetchImpl,
      resolver,
      verify: false
    });
    expect((doc.facts[0]!.value)).toBe("Pwned Saigon");
  });

  it("throws DaenaReadError on HTTP 404", async () => {
    const fetchImpl = mockFetchStatus(404);
    await expect(
      read("https://phosaigon.example/daena.json", { fetchImpl, resolver })
    ).rejects.toMatchObject({
      name: "DaenaReadError",
      status: 404
    });
  });

  it("throws DaenaReadError on network failure", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    await expect(
      read("https://phosaigon.example/daena.json", { fetchImpl, resolver })
    ).rejects.toThrow(DaenaReadError);
  });

  it("throws DaenaParseError on schema-invalid response", async () => {
    const fetchImpl = mockFetchOk(JSON.stringify({ daena: "0" }));
    await expect(
      read("https://phosaigon.example/daena.json", { fetchImpl, resolver })
    ).rejects.toThrow(DaenaParseError);
  });
});

describe("tryRead", () => {
  it("returns ok:true with doc on success", async () => {
    const fetchImpl = mockFetchOk(signedJson);
    const result = await tryRead("https://phosaigon.example/daena.json", {
      fetchImpl,
      resolver
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.doc.publisher).toBe("did:web:phosaigon.example");
  });

  it("returns ok:false with error on failure", async () => {
    const fetchImpl = mockFetchStatus(500);
    const result = await tryRead("https://phosaigon.example/daena.json", {
      fetchImpl,
      resolver
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(DaenaReadError);
  });
});

describe("find helpers", () => {
  let doc: DaenaDocument;
  beforeAll(() => {
    doc = JSON.parse(signedJson) as DaenaDocument;
  });

  it("findFact returns the named fact", () => {
    const f = findFact(doc, "hours");
    expect(f?.id).toBe("hours");
    expect(findFact(doc, "missing")).toBeUndefined();
  });

  it("findFactsByType matches by exact URI or suffix", () => {
    const byUri = findFactsByType(doc, "https://daena.org/vocab/business/hours");
    expect(byUri).toHaveLength(1);
    const bySuffix = findFactsByType(doc, "business/hours");
    expect(bySuffix).toHaveLength(1);
    expect(bySuffix[0]?.id).toBe("hours");
  });

  it("findCapability matches by id or name", () => {
    expect(findCapability(doc, "reserve")?.id).toBe("reserve");
    expect(findCapability(doc, "Make a reservation")?.id).toBe("reserve");
    expect(findCapability(doc, "missing")).toBeUndefined();
  });
});

describe("act", () => {
  let doc: DaenaDocument;
  beforeAll(() => {
    doc = JSON.parse(signedJson) as DaenaDocument;
  });

  it("invokes the capability endpoint with parameters as JSON", async () => {
    const fetchImpl = mockFetchOk(JSON.stringify({ confirmationId: "abc123" }));
    const result = await act(doc, "reserve", {
      partySize: 4,
      dateTime: "2026-05-22T19:00:00Z",
      name: "Pouyan",
      phone: "+1-555-1234"
    }, { fetchImpl });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect((result.body as { confirmationId: string }).confirmationId).toBe("abc123");
    expect(result.capability.id).toBe("reserve");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://phosaigon.example/daena/act/reserve",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"partySize":4')
      })
    );
  });

  it("returns ok:false but does not throw on a non-2xx HTTP response", async () => {
    const fetchImpl = mockFetchStatus(409);
    const result = await act(doc, "reserve", {
      partySize: 4,
      dateTime: "2026-05-22T19:00:00Z",
      name: "Pouyan",
      phone: "+1-555-1234"
    }, { fetchImpl });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(409);
  });

  it("throws DaenaActError when the capability isn't in the document", async () => {
    const fetchImpl = mockFetchOk("{}");
    await expect(
      act(doc, "delete-everything", {}, { fetchImpl })
    ).rejects.toThrow(DaenaActError);
  });

  it("throws DaenaActError when a required parameter is missing", async () => {
    const fetchImpl = mockFetchOk("{}");
    await expect(
      act(doc, "reserve", { partySize: 4 }, { fetchImpl })
    ).rejects.toThrow(/dateTime/);
  });
});

describe("DaenaClient", () => {
  it("carries defaults across read() and act() calls", async () => {
    const fetchImpl = mockFetchOk(signedJson);
    const client = new DaenaClient({ fetchImpl, resolver });
    const doc = await client.read("https://phosaigon.example/daena.json");
    expect(doc.publisher).toBe("did:web:phosaigon.example");
    expect(fetchImpl).toHaveBeenCalled();
  });

  it("per-call options override defaults", async () => {
    const defaultFetch = vi.fn().mockResolvedValue(
      new Response(signedJson, { status: 200 })
    ) as unknown as typeof fetch;
    const overrideFetch = mockFetchOk(signedJson);
    const client = new DaenaClient({ fetchImpl: defaultFetch, resolver });
    await client.read("https://phosaigon.example/daena.json", {
      fetchImpl: overrideFetch
    });
    expect(defaultFetch).not.toHaveBeenCalled();
    expect(overrideFetch).toHaveBeenCalled();
  });
});
