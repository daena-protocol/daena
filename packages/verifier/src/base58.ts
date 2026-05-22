/**
 * Base58 encoding/decoding (Bitcoin alphabet).
 * Used by multibase 'z' prefix for DID public-key material.
 *
 * Zero-dep implementation. Standard long-division algorithm.
 */
const ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const ALPHABET_MAP = new Map<string, number>();
for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP.set(ALPHABET[i]!, i);
}

export function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";

  // Count leading zero bytes — they become leading '1's in base58.
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros++;
  }

  const size =
    Math.ceil(((bytes.length - leadingZeros) * Math.log(256)) / Math.log(58)) +
    1;
  const digits = new Uint8Array(size);
  let length = 0;

  for (let i = leadingZeros; i < bytes.length; i++) {
    let carry = bytes[i]!;
    let j = 0;
    for (let k = size - 1; (carry !== 0 || j < length) && k >= 0; k--, j++) {
      carry += digits[k]! * 256;
      digits[k] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    length = j;
  }

  let result = "1".repeat(leadingZeros);
  for (let i = size - length; i < size; i++) {
    result += ALPHABET[digits[i]!];
  }
  return result;
}

export function base58Decode(encoded: string): Uint8Array {
  if (encoded.length === 0) return new Uint8Array(0);

  let leadingOnes = 0;
  while (leadingOnes < encoded.length && encoded[leadingOnes] === "1") {
    leadingOnes++;
  }

  const size =
    Math.ceil(((encoded.length - leadingOnes) * Math.log(58)) / Math.log(256)) +
    1;
  const result = new Uint8Array(size);
  let length = 0;

  for (let i = leadingOnes; i < encoded.length; i++) {
    const ch = encoded[i]!;
    const value = ALPHABET_MAP.get(ch);
    if (value === undefined) {
      throw new Error(`Invalid base58 character: '${ch}'`);
    }
    let carry = value;
    let j = 0;
    for (let k = size - 1; (carry !== 0 || j < length) && k >= 0; k--, j++) {
      carry += result[k]! * 58;
      result[k] = carry % 256;
      carry = Math.floor(carry / 256);
    }
    length = j;
  }

  const out = new Uint8Array(leadingOnes + length);
  out.set(result.subarray(size - length), leadingOnes);
  return out;
}
