import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageConfig } from '../../src/core/storage/types.js';
import { DEFAULT_GATEWAY_URL } from '../../src/core/storage/client.js';


// Mock dependencies
vi.mock('@web3-storage/w3up-client', () => {
  // Create a standard mock client that implements the methods we need
  const mockClient = {
    addSpace: vi.fn().mockResolvedValue({
      did: () => 'did:mock:space'
    }),
    setCurrentSpace: vi.fn().mockResolvedValue(undefined),
    uploadFile: vi.fn().mockResolvedValue({ toString: () => 'test-cid' }),
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
      const result = await client.upload(testData, testFilename);
      expect(result.cid).toBe('test-cid');
    });

    it('should throw error if client not initialized', async () => {
      const uninitializedClient = new StorachaClient(testConfig);
      await expect(uninitializedClient.upload(testData, testFilename))
        .rejects.toThrow('Client not initialized');
    });

    it('should handle non-base64 data as binary', async () => {
      const client = new StorachaClient(testConfig);
      await client.initialize();
      const binaryData = 'Hello, World!';
      const result = await client.upload(binaryData, testFilename);
      expect(result.cid).toBe('test-cid');
    });

    it('should handle upload errors', async () => {
      const client = new StorachaClient(testConfig);
      await client.initialize();
      const mockError = new Error('Upload error');
      vi.mocked(client.getStorage()?.uploadFile).mockRejectedValueOnce(mockError);
      await expect(client.upload(testData, testFilename))
        .rejects.toThrow('Upload failed: Upload error');
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
        `${testConfig.gatewayUrl}/ipfs/${testCid}`
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
  });
}); 