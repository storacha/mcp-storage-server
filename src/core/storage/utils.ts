import { Capabilities, Delegation } from '@ucanto/interface';
import * as Proof from '@storacha/client/proof';
import { CID } from 'multiformats';

/**
 * Parses a delegation from a base64 encoded CAR file
 * @param data - The base64 encoded CAR file
 * @returns The parsed delegation
 */
export async function parseDelegation(data: string): Promise<Delegation<Capabilities>> {
  const proof = await Proof.parse(data.replaceAll('\n', ''));
  return proof;
}

export function isValidCID(cid: string): boolean {
  try {
    CID.parse(cid);
    return true;
  } catch (error) {
    return false;
  }
}
