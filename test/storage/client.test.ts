import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageConfig } from '../../src/core/storage/types.js';
import { DEFAULT_GATEWAY_URL } from '../../src/core/storage/client.js';
import * as Storage from '@web3-storage/w3up-client';


// Mock dependencies
vi.mock('@web3-storage/w3up-client', () => {
  // Create a standard mock client that implements the methods we need
  const mockClient = {
    addSpace: vi.fn().mockResolvedValue({
      did: () => 'did:mock:space'
    }),
    setCurrentSpace: vi.fn().mockResolvedValue(undefined),
    uploadDirectory: vi.fn().mockResolvedValue({ toString: () => 'test-cid' }),
  };

  return {
    create: vi.fn().mockResolvedValue(mockClient),
    Client: class MockClient {
      addSpace = vi.fn().mockResolvedValue({ did: () => 'did:mock:space' });
      setCurrentSpace = vi.fn().mockResolvedValue(undefined);
      did = vi.fn().mockReturnValue('did:test');
    }
  };
});

vi.mock('@web3-storage/w3up-client/stores/memory', () => ({
  StoreMemory: class MockStoreMemory { }
}));

vi.mock('@ucanto/principal/ed25519', () => ({
  Signer: {
    parse: vi.fn().mockReturnValue({ did: () => 'did:key:mock' })
  }
}));

vi.mock('@ipld/car', () => ({
  CarReader: {
    fromBytes: vi.fn().mockResolvedValue({
      getRoots: async () => ['test-cid'],
      blocks: async function* () {
        yield { bytes: new Uint8Array(), cid: 'test-cid' };
      },
      get: async () => ({ bytes: new Uint8Array(), cid: 'test-cid' })
    })
  },
  __esModule: true
}));

describe('StorachaClient', () => {
  const testConfig: StorageConfig = {
    privateKey: 'MPrivateKeyBase64Encoded',
    delegation: 'EaJlcm9vdHOAZ3ZlcnNpb24B5AYBcRIgpZ4MRVdSlJxn8T1IFPxhwqZ2paczDMRb5oBWVDNwerCoYXNYRO2hA0DMgutkv46ExjnhqdR6JFVdgyaKc38NK12V5hwB1cLftikz43OXSWdrxNKaBL+wtolepqT+RreRYzx1H8cR4bsPYXZlMC45LjFjYXR0iKJjY2FuZ3NwYWNlLypkd2l0aHg4ZGlkOmtleTp6Nk1rcUVtWVBhQXQ1NGNLcVUxNXNtdlJvc0U0REwyRFRBYVRUWVhlNTFFWU1IaniiY2NhbmZibG9iLypkd2l0aHg4ZGlkOmtleTp6Nk1rcUVtWVBhQXQ1NGNLcVUxNXNtdlJvc0U0REwyRFRBYVRUWVhlNTFFWU1IaniiY2NhbmdpbmRleC8qZHdpdGh4OGRpZDprZXk6ejZNa3FFbVlQYUF0NTRjS3FVMTVzbXZSb3NFNERMMkRUQWFUVFlYZTUxRVlNSGp4omNjYW5nc3RvcmUvKmR3aXRoeDhkaWQ6a2V5Ono2TWtxRW1ZUGFBdDU0Y0txVTE1c212Um9zRTRETDJEVEFhVFRZWGU1MUVZTUhqeGNhdWRYIu0BD/H2VCFppv0Fsz3GdriUK/4Iao2eYULV1DqcfV2w6xpjZXhwGmmgi+pjZmN0gaFlc3BhY2WhZG5hbWV1ZWxpemFhaS1hZ2VudC1zdG9yYWdlY2lzc1gi7QGgPVuFaazEr1L3zixl3NO/VE5nHshg3MApRJ4lVEy8K2NwcmaA8wIBcRIgkjZDt7UAKikjdfCO3mP9VQmegkDkUWPoagw//BhSaDWoYXNYRO2hA0Bd3S2SatOkCxZLMTk8tm4zjToP5v9U/lGztFVujalaSJan/3X2XF0YzXah6v3XW+ae4jh99mXbpUsN6F+V/kcHYXZlMC45LjFjYXR0gaJjY2FuaXN0b3JlL2FkZGR3aXRoeDhkaWQ6a2V5Ono2TWtxRW1ZUGFBdDU0Y0txVTE1c212Um9zRTRETDJEVEFhVFRZWGU1MUVZTUhqeGNhdWRYIu0BGUXBxPv8nsHq/Vk8ftHu74UIqEYUl5LT8Nhvs8Pt/fdjZXhw9mNmY3SBoWVzcGFjZaFkbmFtZXVlbGl6YWFpLWFnZW50LXN0b3JhZ2VjaXNzWCLtAQ/x9lQhaab9BbM9xna4lCv+CGqNnmFC1dQ6nH1dsOsaY3ByZoHYKlglAAFxEiClngxFV1KUnGfxPUgU/GHCpnalpzMMxFvmgFZUM3B6sA==',
    gatewayUrl: 'https://test.storacha.link'
  };

  let StorachaClient: any;

  beforeEach(async () => {
    const module = await import('../../src/core/storage/client.js');
    StorachaClient = module.StorachaClient;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('constructor', () => {
    it('should create instance with default gateway URL', () => {
      const clientWithoutGateway = new StorachaClient({
        privateKey: testConfig.privateKey,
        delegation: testConfig.delegation,
      });
      expect(clientWithoutGateway['config'].gatewayUrl).toBe(DEFAULT_GATEWAY_URL);
    });

    it('should use provided gateway URL', () => {
      const client = new StorachaClient(testConfig);
      expect(client['config'].gatewayUrl).toBe(testConfig.gatewayUrl);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully with valid config', async () => {
      const client = new StorachaClient(testConfig);
      await client.initialize();
      expect(client.isConnected()).toBe(true);
    });

    it('should throw error if private key is missing', async () => {
      const clientWithoutKey = new StorachaClient({
        delegation: testConfig.delegation,
        gatewayUrl: testConfig.gatewayUrl,
        privateKey: undefined
      });
      await expect(clientWithoutKey.initialize()).rejects.toThrow('Private key is required');
    });

    it('should throw error if delegation is missing', async () => {
      const clientWithoutDelegation = new StorachaClient({
        privateKey: testConfig.privateKey,
        gatewayUrl: testConfig.gatewayUrl,
        delegation: undefined
      });
      await expect(clientWithoutDelegation.initialize()).rejects.toThrow('Delegation is required');
    });

    it('should not initialize twice', async () => {
      const client = new StorachaClient(testConfig);
      await client.initialize();
      await client.initialize();
      expect(client.isConnected()).toBe(true);
    });

    it('should handle initialization errors', async () => {
      const client = new StorachaClient(testConfig);
      
      // Mock Storage.create to throw an error
      const mockError = new Error('Storage creation failed');
      vi.mocked(Storage.create).mockRejectedValueOnce(mockError);
      
      await expect(client.initialize()).rejects.toThrow('Failed to initialize storage client: Storage creation failed');
    });

    it('should handle non-Error objects during initialization', async () => {
      const client = new StorachaClient(testConfig);
      
      // Mock Storage.create to throw a non-Error object
      vi.mocked(Storage.create).mockRejectedValueOnce('Unknown initialization error');
      
      await expect(client.initialize()).rejects.toThrow('Failed to initialize storage client: Unknown error');
    });
  });

  describe('getStorage', () => {
    it('should return null when not initialized', () => {
      const client = new StorachaClient(testConfig);
      expect(client.getStorage()).toBeNull();
    });

    it('should return storage client after initialization', async () => {
      const client = new StorachaClient(testConfig);
      await client.initialize();
      const storage = client.getStorage();
      expect(storage).toBeDefined();
      expect(storage).not.toBeNull();
      expect(storage?.uploadDirectory).toBeDefined();
    });
  });

  describe('getConfig', () => {
    it('should return the current config', () => {
      const client = new StorachaClient(testConfig);
      const config = client.getConfig();
      expect(config).toEqual({
        ...testConfig,
        gatewayUrl: testConfig.gatewayUrl?.trim() || DEFAULT_GATEWAY_URL
      });
    });

    it('should return config with default gateway URL when not provided', () => {
      const clientWithoutGateway = new StorachaClient({
        privateKey: testConfig.privateKey,
        delegation: testConfig.delegation
      });
      const config = clientWithoutGateway.getConfig();
      expect(config).toEqual({
        privateKey: testConfig.privateKey,
        delegation: testConfig.delegation,
        gatewayUrl: DEFAULT_GATEWAY_URL
      });
    });
  });

  describe('getGatewayUrl', () => {
    it('should throw error if gateway URL is not set', () => {
      const client = new StorachaClient({
        privateKey: testConfig.privateKey,
        delegation: testConfig.delegation,
      });
      // Directly modify the config to simulate unset gateway URL
      client['config'].gatewayUrl = undefined;
      expect(() => client.getGatewayUrl()).toThrow('Gateway URL is not set');
    });

    it('should return configured gateway URL', () => {
      const client = new StorachaClient(testConfig);
      expect(client.getGatewayUrl()).toBe(testConfig.gatewayUrl);
    });
  });

  describe('upload', () => {
    const testData = 'SGVsbG8sIFdvcmxkIQ=='; // "Hello, World!" in base64
    const testFilename = 'test.txt';
    let client: any;

    beforeEach(async () => {
      client = new StorachaClient(testConfig);
      await client.initialize();
    });

    it('should upload file successfully with base64 data', async () => {
      const result = await client.uploadFiles([{
        name: testFilename,
        content: testData,
        type: 'text/plain'
      }]);
      expect(result.cid).toBe('test-cid');
    });

    it('should throw error if client not initialized', async () => {
      const uninitializedClient = new StorachaClient(testConfig);
      await expect(uninitializedClient.uploadFiles([{
        name: testFilename,
        content: testData,
        type: 'text/plain'
      }])).rejects.toThrow('Client not initialized');
    });

    it('should handle non-base64 data as binary', async () => {
      const binaryData = 'Hello, World!';
      const result = await client.uploadFiles([{
        name: testFilename,
        content: binaryData,
        type: 'application/octet-stream'
      }]);
      expect(result.cid).toBe('test-cid');
    });

    it('should handle upload errors', async () => {
      const mockError = new Error('Upload error');
      vi.mocked(client.getStorage()?.uploadDirectory).mockRejectedValueOnce(mockError);
      await expect(client.uploadFiles([{
        name: testFilename,
        content: testData,
        type: 'text/plain'
      }])).rejects.toThrow('Upload failed: Upload error');
    });

    it('should handle upload abort', async () => {
      const abortController = new AbortController();
      // Abort the upload
      abortController.abort();

      await expect(client.uploadFiles([{
        name: testFilename,
        content: testData,
        type: 'text/plain'
      }], {
        signal: abortController.signal
      })).rejects.toThrow('Upload aborted');
    });

    it('should handle unknown error types during upload', async () => {
      // Mock a non-Error object being thrown
      vi.mocked(client.getStorage()?.uploadDirectory).mockRejectedValueOnce('Unknown error object');
      
      await expect(client.uploadFiles([{
        name: testFilename,
        content: testData,
        type: 'text/plain'
      }])).rejects.toThrow('Upload failed: Unknown error');
    });

    it('should handle upload without IPFS publishing', async () => {
      const result = await client.uploadFiles([{
        name: testFilename,
        content: testData,
        type: 'text/plain'
      }], {
        publishToIPFS: false
      });

      expect(result.cid).toBe('test-cid');
      expect(client.getStorage()?.uploadDirectory).toHaveBeenCalledWith(
        [expect.any(File)],
        {
          retries: 3,
          pieceHasher: undefined,
          signal: undefined
        }
      );
    });

    it('should use detectMimeType when file type is not provided', async () => {
      const result = await client.uploadFiles([{
        name: 'test.txt',
        content: testData
      }]);

      expect(result.cid).toBe('test-cid');
      expect(client.getStorage()?.uploadDirectory).toHaveBeenCalledWith(
        [expect.any(File)],
        {
          retries: 3,
          signal: undefined
        }
      );
    });
  });

  describe('retrieve', () => {
    const testCid = 'QmTest123';
    const testContent = 'Hello, World!';
    const testContentBase64 = Buffer.from(testContent).toString('base64');

    beforeEach(async () => {
      // Mock fetch globally to test the retrieval
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode(testContent).buffer,
        headers: new Headers({ 'content-type': 'text/plain' })
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should retrieve file successfully from gateway', async () => {
      const client = new StorachaClient(testConfig);
      await client.initialize();
      const result = await client.retrieve(testCid);

      expect(global.fetch).toHaveBeenCalledWith(
        new URL(`/ipfs/${testCid}`, testConfig.gatewayUrl)
      );

      expect(result).toEqual({
        data: testContentBase64,
        type: 'text/plain'
      });

      // Verify the returned data is valid base64 that decodes to our test content
      expect(Buffer.from(result.data, 'base64').toString()).toBe(testContent);
    });

    it('should not throw error if client not initialized', async () => {
      const uninitializedClient = new StorachaClient(testConfig);
      await expect(uninitializedClient.retrieve(testCid))
        .resolves.toBeDefined();
    });

    it('should handle HTTP errors', async () => {
      const client = new StorachaClient(testConfig);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(client.retrieve(testCid))
        .rejects.toThrow('Failed to retrieve file: HTTP error 404 Not Found');
    });

    it('should handle network errors', async () => {
      const client = new StorachaClient(testConfig);

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(client.retrieve(testCid))
        .rejects.toThrow('Failed to retrieve file: Network error');
    });

    it('should handle unknown error types during retrieve', async () => {
      const client = new StorachaClient(testConfig);
      
      // Mock fetch to throw a non-Error object
      global.fetch = vi.fn().mockRejectedValue('Unknown error object');
      
      await expect(client.retrieve('test-cid'))
        .rejects.toThrow('Failed to retrieve file: Unknown error');
    });

    it('should handle missing content-type header', async () => {
      const client = new StorachaClient({});
      const mockResponse = new Response(new ArrayBuffer(8), {
        status: 200,
        headers: new Headers() // No content-type header
      });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await client.retrieve('test-cid');
      expect(result.type).toBe('application/octet-stream');
    });
  });
}); 