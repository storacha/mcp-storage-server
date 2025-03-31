import { CarReader } from '@ipld/car';
import { importDAG } from '@ucanto/core/delegation';
import { Capabilities, Delegation } from '@ucanto/interface';
import { lookup } from 'mime-types';

/**
 * Parses a delegation from a base64 encoded CAR file
 * @param data - The base64 encoded CAR file
 * @returns The parsed delegation
 */
export async function parseDelegation(data: string): Promise<Delegation<Capabilities>> {
  const blocks = [];
  const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'));
  for await (const block of reader.blocks()) {
    blocks.push(block);
  }
  return importDAG(blocks);
}

/**
 * Detect MIME type from filename
 * @param filename - Name of the file
 * @returns The detected MIME type or undefined if not detectable
 */
export function detectMimeType(filename: string): string | undefined {
  return lookup(filename) || undefined;
}
