import type { DaenaDocument } from "@daena/core";
import { read, tryRead, type ReadOptions, type ReadResult } from "./read.js";
import { act, type ActOptions, type ActResult } from "./act.js";

/**
 * A configured Daena client that carries default options across calls.
 *
 * Useful when you want to set a custom fetchImpl, resolver, or bearer token
 * once and have them apply to every read() and act() invocation.
 */
export class DaenaClient {
  private defaults: ReadOptions & ActOptions;

  constructor(defaults: ReadOptions & ActOptions = {}) {
    this.defaults = defaults;
  }

  read(url: string, options: ReadOptions = {}): Promise<DaenaDocument> {
    return read(url, { ...this.defaults, ...options });
  }

  tryRead(url: string, options: ReadOptions = {}): Promise<ReadResult> {
    return tryRead(url, { ...this.defaults, ...options });
  }

  act<T = unknown>(
    doc: DaenaDocument,
    idOrName: string,
    parameters: Record<string, unknown>,
    options: ActOptions = {}
  ): Promise<ActResult<T>> {
    return act(doc, idOrName, parameters, { ...this.defaults, ...options });
  }
}
