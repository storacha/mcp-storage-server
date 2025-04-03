import { Capabilities, Delegation } from '@ucanto/interface';
import { lookup } from 'mime-types';
import * as Proof from '@web3-storage/w3up-client/proof';

/**
 * Parses a delegation from a base64 encoded CAR file
 * @param data - The base64 encoded CAR file
 * @returns The parsed delegation
 */
export async function parseDelegation(data: string): Promise<Delegation<Capabilities>> {
  const proof = await Proof.parse(data);
  return proof;
}

/**
 * Detect MIME type from filename
 * @param filename - Name of the file
 * @returns The detected MIME type or undefined if not detectable
 */
export function detectMimeType(filename: string): string | undefined {
  return lookup(filename) || undefined;
}
