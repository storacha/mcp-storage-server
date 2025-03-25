/**
 * Configuration options for the storage client
 */
export interface StorageConfig {
  /** Private key for w3up-client authentication */
  privateKey: string;
  /** Delegation for storage access */
  delegation: string;
  /** Optional gateway URL for file retrieval */
  gatewayUrl?: string;
}

/**
 * Upload options for storage operations
 */
export interface UploadOptions {
  /** Signal to abort the upload */
  signal?: AbortSignal;
  /** Number of retries for failed uploads */
  retries?: number;
  /** MIME type of the file */
  type?: string;
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
   * Upload a file to storage
   * @param data - File data (base64 encoded string or binary data)
   * @param filename - Original filename
   * @param options - Upload options
   */
  upload(data: string, filename: string, options?: UploadOptions): Promise<UploadResult>;
  
  /**
   * Retrieve a file from storage
   * @param cid - Content ID to retrieve
   */
  retrieve(cid: string): Promise<RetrieveResult>;
} 