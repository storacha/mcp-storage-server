import { Capabilities, Delegation } from '@ucanto/interface';
import * as Proof from '@storacha/client/proof';
import { CID } from 'multiformats';
import { Resource, IpfsPathError } from './types.js';

/**
 * Parses a delegation from a base64 encoded CAR file
 * @param data - The base64 encoded CAR file
 * @returns The parsed delegation
 */
export async function parseDelegation(data: string): Promise<Delegation<Capabilities>> {
  // Clean all whitespace including spaces, tabs, newlines, carriage returns
  const cleanedData = data.replace(/\s+/g, '');
  const proof = await Proof.parse(cleanedData);
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

/**
 * Parses an IPFS path into a structured Resource object
 * Supports formats: CID/filename, /ipfs/CID/filename, or ipfs://CID/filename
 *
 * @param path - The IPFS path to parse
 * @returns A structured Resource object with protocol, CID, and pathname
 * @throws IpfsPathError if the path is invalid or malformed
 */
export function parseIpfsPath(path: string): Resource {
  let normalized = path;

  // Remove ipfs:// protocol prefix if present
  if (normalized.startsWith('ipfs://')) {
    normalized = normalized.substring(7);
  }

  // Remove /ipfs/ prefix if present
  if (normalized.startsWith('/ipfs/')) {
    normalized = normalized.substring(6);
  } else if (normalized.startsWith('ipfs/')) {
    normalized = normalized.substring(5);
  }

  // Split into CID and pathname
  const slashIndex = normalized.indexOf('/');
  if (slashIndex === -1) {
    throw new IpfsPathError(
      'Invalid IPFS path: Must contain a slash separator between CID and filename',
      path
    );
  }

  const cidStr = normalized.substring(0, slashIndex);
  const pathname = normalized.substring(slashIndex);

  if (pathname.length <= 1) {
    throw new IpfsPathError('Invalid IPFS path: Filename cannot be empty', path);
  }

  try {
    const cid = CID.parse(cidStr);
    return {
      protocol: 'ipfs:',
      cid,
      pathname,
    };
  } catch (error) {
    throw new IpfsPathError(`Invalid IPFS path: Invalid CID "${cidStr}"`, path);
  }
}

/**
 * Normalizes an IPFS path to the CID/filename format
 * This is kept for backward compatibility but parseIpfsPath is preferred
 *
 * @param path - The IPFS path to normalize
 * @returns The normalized path in the format CID/filename
 */
export function normalizeIpfsPath(path: string): string {
  // Remove ipfs:// protocol prefix if present
  if (path.startsWith('ipfs://')) {
    path = path.substring(7);
  }

  // Remove /ipfs/ prefix if present
  if (path.startsWith('/ipfs/')) {
    path = path.substring(6);
  } else if (path.startsWith('ipfs/')) {
    path = path.substring(5);
  }

  return path;
}
