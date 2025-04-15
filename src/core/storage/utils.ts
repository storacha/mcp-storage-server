import { Capabilities, Delegation } from '@ucanto/interface';
import * as Proof from '@storacha/client/proof';
import { CID } from 'multiformats/cid';
import { Resource, IpfsPathError } from './types.js';
import { base64 } from 'multiformats/bases/base64';
import { Readable } from 'node:stream';

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

/**
 * Converts a base64 encoded string to bytes
 * @param base64Str - The base64 encoded string to convert
 * @returns A Uint8Array containing the decoded bytes
 */
export function base64ToBytes(base64Str: string): Uint8Array {
  // Remove any potential data URL prefix
  const cleanStr = base64Str.replace(/^data:.*?;base64,/, '');

  try {
    // First try with multiformats base64 decoder
    // Add 'm' prefix required by multiformats base64 decoder if not present
    const prefixedStr = cleanStr.startsWith('m') ? cleanStr : `m${cleanStr}`;
    return base64.decode(prefixedStr);
  } catch (error) {
    // Fallback to standard base64 decoding
    // Standard base64 decoding using Buffer in Node.js
    const buffer = Buffer.from(cleanStr, 'base64');
    if (buffer.toString('base64') === cleanStr) {
      return new Uint8Array(buffer);
    }
    throw new Error('Invalid base64 format');
  }
}

/**
 * Converts a Readable stream to a base64 encoded string
 * @param stream - The Readable stream to convert
 * @param useMultiformatBase64 - Whether to use multiformat base64 encoding instead of standard base64
 * @returns A Promise that resolves to the base64 encoded string
 */
export async function streamToBase64(
  stream: Readable,
  useMultiformatBase64 = false
): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  // Combine all chunks into a single Uint8Array
  const bytes = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert to either standard base64 or multiformat base64 depending on the flag
  return useMultiformatBase64 ? base64.encode(bytes) : Buffer.from(bytes).toString('base64');
}
