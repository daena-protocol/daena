import type { Capability, DaenaDocument } from "@daena/core";
import { findCapability } from "./query.js";
import { DaenaActError } from "./errors.js";

export interface ActOptions {
  /** Fetch implementation. Default: global fetch. */
  fetchImpl?: typeof fetch;
  /** Bearer token, if the capability declares `auth: "bearer"`. */
  bearer?: string;
  /** Request timeout in milliseconds. Default: 30000. */
  timeoutMs?: number;
}

export interface ActResult<T = unknown> {
  /** True iff the HTTP response was 2xx. */
  ok: boolean;
  /** HTTP status code returned by the capability endpoint. */
  status: number;
  /** Parsed body (JSON if the response was JSON, else the raw string). */
  body: T;
  /** The capability that was invoked. */
  capability: Capability;
}

/**
 * Invoke a capability declared by the publisher.
 *
 * Looks up the capability by id or name, validates required parameters are
 * present, builds the HTTP request, attaches any required auth, and returns
 * a structured result (ok / status / body / capability).
 *
 * Throws DaenaActError only for client-side problems (unknown capability,
 * missing required parameter, missing bearer when required, network failure).
 * HTTP-level failures from the publisher show up as `ok: false` in the result.
 */
export async function act<T = unknown>(
  doc: DaenaDocument,
  idOrName: string,
  parameters: Record<string, unknown>,
  options: ActOptions = {}
): Promise<ActResult<T>> {
  const capability = findCapability(doc, idOrName);
  if (!capability) {
    throw new DaenaActError(`Capability not found: '${idOrName}'`);
  }

  // Validate required parameters are present.
  for (const [name, spec] of Object.entries(capability.parameters)) {
    if (spec.required && !(name in parameters)) {
      throw new DaenaActError(
        `Capability '${capability.id}' requires parameter '${name}'`
      );
    }
  }

  // Auth handling.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json"
  };
  if (capability.auth === "bearer") {
    if (!options.bearer) {
      throw new DaenaActError(
        `Capability '${capability.id}' requires bearer auth but no token was provided`
      );
    }
    headers["Authorization"] = `Bearer ${options.bearer}`;
  } else if (capability.auth === "did") {
    throw new DaenaActError(
      `DID-based auth for capability '${capability.id}' is not yet supported in v0`
    );
  }

  const fetchImpl =
    options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const timeoutMs = options.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(capability.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(parameters),
      signal: controller.signal
    });
  } catch (e) {
    throw new DaenaActError(
      `Failed to invoke capability '${capability.id}' at ${capability.endpoint}: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") ?? "";
  let body: T;
  if (contentType.includes("application/json")) {
    body = (await response.json()) as T;
  } else {
    body = (await response.text()) as unknown as T;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
    capability
  };
}
