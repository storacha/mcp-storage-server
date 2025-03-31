import { Capabilities, Delegation } from '@ucanto/interface';
import { Signer } from '@ucanto/principal/ed25519';

/**
 * Configuration options for the storage client
 */
export interface StorageConfig {
  /** Private key for w3up-client authentication */
  signer: Signer.EdSigner;
  /** Delegation for storage access */
  delegation: Delegation<Capabilities>;
  /** Optional gateway URL for file retrieval */
  gatewayUrl?: URL;
}

/**
 * File to upload
 */
export interface UploadFile {
  /** Name of the file */
  name: string;
  /** Content of the file (base64 encoded) */
  content: string;
  /** MIME type of the file */
  type?: string;
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
  root: string;
  /** HTTP gateway URL for accessing the file */
  rootURL: string;
  /** List of files uploaded in the directory */
  files: {
    /** Name of the file */
    name: string;
    /** URL of the file */
    url: string;
    /** MIME type of the file */
    type?: string;
  }[];
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
   * @param root - Root CID of the directory containing the file
   */
  retrieve(root: string): Promise<RetrieveResult>;
}
