/**
 * Configuration options for the storage client
 */
export interface StorageConfig {
  /** Private key for w3up-client authentication */
  privateKey: string | undefined;
  /** Delegation for storage access */
  delegation: string | undefined;
  /** Optional gateway URL for file retrieval */
  gatewayUrl?: string;
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
  /** Whether to publish the file to IPFS (default: false) */
  publishToIPFS?: boolean;
}

/**
 * Upload options for storage operations
 */
export interface UploadOptions {
  /** Signal to abort the upload */
  signal?: AbortSignal;
  /** Number of retries for failed uploads */
  retries?: number;
  /** Whether to publish the file to IPFS (default: false) */
  publishToIPFS?: boolean;
}

/**
 * Result of a file upload operation
 */
export interface UploadResult {
  /** Content ID of the uploaded file */
  cid: string;
  /** HTTP gateway URL for accessing the file */
  url: string;
}

/**
 * Result of a file retrieval operation
 */
export interface RetrieveResult {
  /** Base64 encoded file data */
  data: string;
  /** MIME type of the file */
  type: string;
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
   * @param cid - Content ID to retrieve
   */
  retrieve(cid: string): Promise<RetrieveResult>;
} 