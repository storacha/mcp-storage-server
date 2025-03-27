import { StorageClient, StorageConfig, UploadResult, RetrieveResult, UploadOptions, UploadFile } from './types.js';
import { Signer } from '@ucanto/principal/ed25519';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';
import * as Storage from '@web3-storage/w3up-client';
import { parseDelegation, detectMimeType } from './utils.js';
export const DEFAULT_GATEWAY_URL = 'https://storacha.link';

/**
 * Implementation of the StorageClient interface for Storacha network
 */
export class StorachaClient implements StorageClient {
  private config: StorageConfig;
  private initialized: boolean = false;
  private storage: Storage.Client | null = null;

  constructor(config: StorageConfig) {
    this.config = {
      ...config,
      gatewayUrl: config.gatewayUrl?.trim() || DEFAULT_GATEWAY_URL
    };
  }

  /**
   * Initialize the storage client and establish connection based on the storage config
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!this.config.privateKey) {
      throw new Error('Private key is required');
    }

    if (!this.config.delegation) {
      throw new Error('Delegation is required');
    }

    try {
      const principal = Signer.parse(this.config.privateKey);
      const store = new StoreMemory();
      this.storage = await Storage.create({ principal, store });

      const delegationProof = await parseDelegation(this.config.delegation);
      const space = await this.storage.addSpace(delegationProof);
      await this.storage.setCurrentSpace(space.did());

      this.initialized = true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize storage client: ${message}`);
    }
  }

  /**
   * Get the storage client
   * @returns The storage client
   */
  getStorage(): Storage.Client | null {
    return this.storage;
  }

  /**
   * Check if the client is connected and ready
   */
  isConnected(): boolean {
    return this.initialized;
  }

  /**
   * Get the storage config
   * @returns The storage config
   */
  getConfig(): StorageConfig {
    return this.config;
  }

  /**
   * Get the configured gateway URL
   * @returns The configured gateway URL
   * @throws Error if gateway URL is not set
   */
  getGatewayUrl(): string {
    if (!this.config.gatewayUrl?.trim()) {
      throw new Error('Gateway URL is not set');
    }
    return this.config.gatewayUrl;
  }

  /**
   * Upload files to Storacha network
   * The Storage Client needs to be initialized to upload files.
   * 
   * @param files - Array of files to upload
   * @param options - Upload options
   * @returns The uploaded files' Content ID and URL
   */
  async uploadFiles(files: UploadFile[], options: UploadOptions = {}): Promise<UploadResult> {
    if (!this.initialized || !this.storage) {
      throw new Error('Client not initialized');
    }

    try {
      if (options.signal?.aborted) {
        throw new Error('Upload aborted');
      }

      const fileObjects = files.map(file => {
        const buffer = Buffer.from(file.content, 'base64');
        return new File([buffer], file.name, { 
          type: file.type || detectMimeType(file.name)
        });
      });

      const cid = await this.storage.uploadDirectory(fileObjects, {
        // If publishToIPFS is false, we don't provide a pieceHasher, so the content is not pinned to IPFS
        ...(options.publishToIPFS === false ? { pieceHasher: undefined } : {}),
        retries: options.retries ?? 3,
        signal: options.signal
      });

      return {
        cid: cid.toString(),
        url: new URL(`/ipfs/${cid.toString()}`, this.getGatewayUrl()).toString()
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError' || options.signal?.aborted) {
        throw new Error('Upload aborted');
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Upload failed: ${message}`);
    }
  }

  /**
   * Retrieve a file from Storacha network
   * The Storage Client does not need to be initialized to retrieve a file because it routes requests to the gateway,
   * and doesn't need to access the storage directly.
   * 
   * @param cid - Content ID to retrieve
   * @returns The retrieved file data as a base64 encoded string
   */
  async retrieve(cid: string): Promise<RetrieveResult> {
    try {
      const response = await fetch(new URL(`/ipfs/${cid}`, this.getGatewayUrl()));
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      return {
        data: base64Data,
        type: contentType
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve file: ${message}`);
    }
  }

}