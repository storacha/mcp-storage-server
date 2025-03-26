import { CarReader } from '@ipld/car';
import { importDAG } from '@ucanto/core/delegation';
import { Delegation } from '@ucanto/interface';

/**
 * Parses a delegation from a base64 encoded CAR file
 * @param data - The base64 encoded CAR file
 * @returns The parsed delegation
 */
export async function parseDelegation(data: string): Promise<Delegation> {
  const blocks = []
  const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'))
  for await (const block of reader.blocks()) {
    blocks.push(block)
  }
  return importDAG(blocks)
}

  /**
   * Validate if a string is valid base64
   * @param str - String to validate
   */
  export function isValidBase64(str: string): boolean {
  if (str.length === 0 || str.length % 4 !== 0) {
    return false;
  }
  try {
    return btoa(atob(str)) === str;
  } catch {
    return false;
  }
}