import { Capabilities, Delegation } from '@ucanto/interface';
import { Signer } from '@ucanto/principal/ed25519';
import { CID, UnknownLink } from 'multiformats';

/**
 * Configuration options for the storage client
 */
export interface StorageConfig {
  /** Private key for storacha-client authentication */
  signer: Signer.EdSigner;
  /** Delegation for storage access */
  delegation: Delegation<Capabilities>;
  /** Optional gateway URL for file retrieval */
  gatewayUrl?: URL;
}

/**
 * Represents a structured IPFS resource with protocol, CID, and pathname
 */
export interface Resource {
  /** Protocol identifier, currently only 'ipfs:' is supported */
  protocol: 'ipfs:'; // Could potentially support IPNS in the future
  /** Content Identifier of the resource */
  cid: CID;
  /** Path to the resource, including leading slash and any subfolders/query params */
  pathname: string;
}

/**
 * Parsing error for IPFS paths
 */
export class IpfsPathError extends Error {
  constructor(
    message: string,
    public readonly path: string
  ) {
    super(message);
    this.name = 'IpfsPathError';
  }
}

/**
 * File to upload
 */
export interface UploadFile {
  /** Name of the file */
  name: string;
  /** Content of the file (base64 encoded) */
  content: string;
}

/**
 * Upload options for storage operations
 */
export interface UploadOptions {
  /** Signal to abort the upload */
  signal?: AbortSignal;
  /** Number of retries for failed uploads */
  retries?: number;
  /** Whether to publish the file to the Filecoin Network (default: false) */
  publishToFilecoin?: boolean;
}

/**
 * Result of a file upload operation
 */
export interface UploadResult {
  /** Root CID of the directory containing the uploaded file */
  root: UnknownLink;
  /** HTTP gateway URL for accessing the file */
  url: URL;
  /** Map of files uploaded in the directory */
  files: Map<string, UnknownLink>;
}

/**
 * Result of a file retrieval operation
 */
export interface RetrieveResult {
  /** Base64 encoded file data */
  data: string;
  /** MIME type of the file */
  type?: string;
}

/**
 * Interface for storage operations
 */
export interface StorageClient {
  /** Initialize the storage client */
  initialize(): Promise<void>;

  /** Check if the client is connected and ready */
  isConnected(): boolean;

  /**
   * Upload files to storage
   * @param files - Array of files to upload
   * @param options - Upload options
   */
  uploadFiles(files: UploadFile[], options?: UploadOptions): Promise<UploadResult>;

  /**
   * Retrieve a file from storage
   * @param filepath - Path string in the format "cid/filename", "/ipfs/cid/filename", or "ipfs://cid/filename"
   */
  retrieve(filepath: string): Promise<RetrieveResult>;
}
