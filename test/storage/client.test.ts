import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DEFAULT_GATEWAY_URL } from '../../src/core/storage/config.js';
import { StorachaClient } from '../../src/core/storage/client.js';
import { UploadFile } from '../../src/core/storage/types.js';

// Mock dependencies
vi.mock('@web3-storage/w3up-client', () => {
  const mockClient = {
    addSpace: vi.fn().mockResolvedValue({
      did: () => 'did:mock:space'
    }),
    setCurrentSpace: vi.fn().mockResolvedValue(undefined),
    uploadDirectory: vi.fn().mockResolvedValue({
      toString: () => 'test-cid'
    })
  };

  return {
    create: vi.fn().mockResolvedValue(mockClient),
    Client: class MockClient {
      addSpace = vi.fn().mockResolvedValue({ did: () => 'did:mock:space' });
      setCurrentSpace = vi.fn().mockResolvedValue(undefined);
      uploadDirectory = vi.fn().mockResolvedValue({
        toString: () => 'test-cid'
      });
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
  const testConfig = {
    privateKey: 'MPrivateKeyBase64Encoded',
    delegation: 'EaJlcm9vdHOAZ3ZlcnNpb24B5AYBcRIgpZ4MRVdSlJxn8T1IFPxhwqZ2paczDMRb5oBWVDNwerCoYXNYRO2hA0DMgutkv46ExjnhqdR6JFVdgyaKc38NK12V5hwB1cLftikz43OXSWdrxNKaBL+wtolepqT+RreRYzx1H8cR4bsPYXZlMC45LjFjYXR0iKJjY2FuZ3NwYWNlLypkd2l0aHg4ZGlkOmtleTp6Nk1rcUVtWVBhQXQ1NGNLcVUxNXNtdlJvc0U0REwyRFRBYVRUWVhlNTFFWU1IaniiY2NhbmZibG9iLypkd2l0aHg4ZGlkOmtleTp6Nk1rcUVtWVBhQXQ1NGNLcVUxNXNtdlJvc0U0REwyRFRBYVRUWVhlNTFFWU1IaniiY2NhbmdpbmRleC8qZHdpdGh4OGRpZDprZXk6ejZNa3FFbVlQYUF0NTRjS3FVMTVzbXZSb3NFNERMMkRUQWFUVFlYZTUxRVlNSGp4omNjYW5nc3RvcmUvKmR3aXRoeDhkaWQ6a2V5Ono2TWtxRW1ZUGFBdDU0Y0txVTE1c212Um9zRTRETDJEVEFhVFRZWGU1MUVZTUhqeGNhdWRYIu0BD/H2VCFppv0Fsz3GdriUK/4Iao2eYULV1DqcfV2w6xpjZXhwGmmgi+pjZmN0gaFlc3BhY2WhZG5hbWV1ZWxpemFhaS1hZ2VudC1zdG9yYWdlY2lzc1Qi7QGgPVuFaazEr1L3zixl3NO/VE5nHshg3MApRJ4lVEy8K2NwcmaA8wIBcRIgkjZDt7UAKikjdfCO3mP9VQmegkDkUWPoagw//BhSaDWoYXNYRO2hA0Bd3S2SatOkCxZLMTk8tm4zjToP5v9U/lGztFVujalaSJan/3X2XF0YzXah6v3XW+ae4jh99mXbpUsN6F+V/kcHYXZlMC45LjFjYXR0gaJjY2FuaXN0b3JlL2FkZGR3aXRoeDhkaWQ6a2V5Ono2TWtxRW1ZUGFBdDU0Y0txVTE1c212Um9zRTRETDJEVEFhVFRZWGU1MUVZTUhqeGNhdWRYIu0BGUXBxPv8nsHq/Vk8ftHu74UIqEYUl5LT8Nhvs8Pt/fdjZXhw9mNmY3SBoWVzcGFjZaFkbmFtZXVlbGl6YWFpLWFnZW50LXN0b3JhZ2VjaXNzWCLtAQ/x9lQhaab9BbM9xna4lCv+CGqNnmFC1dQ6nH1dsOsaY3ByZoHYKlglAAFxEiClngxFV1KUnGfxPUgU/GHCpnalpzMMxFvmgFZUM3B6sA==',
    gatewayUrl: 'https://custom-gateway.link'
  };

  let client: StorachaClient;

  beforeEach(() => {
    client = new StorachaClient(testConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with provided gateway URL', () => {
      expect(client['config'].gatewayUrl).toBe(testConfig.gatewayUrl);
    });

    it('should use default gateway URL when not provided', () => {
      const clientWithoutGateway = new StorachaClient({
        privateKey: testConfig.privateKey,
        delegation: testConfig.delegation,
      });
      expect(clientWithoutGateway['config'].gatewayUrl).toBe(DEFAULT_GATEWAY_URL);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully with valid config', async () => {
      await client.initialize();
      expect(client.isConnected()).toBe(true);
    });

    it('should throw error if private key is missing', async () => {
      const invalidClient = new StorachaClient({
        privateKey: undefined,
        delegation: testConfig.delegation,
        gatewayUrl: testConfig.gatewayUrl,
      });
      await expect(invalidClient.initialize()).rejects.toThrow('Private key is required');
    });

    it('should throw error if delegation is missing', async () => {
      const invalidClient = new StorachaClient({
        privateKey: testConfig.privateKey,
        delegation: undefined,
        gatewayUrl: testConfig.gatewayUrl,
      });
      await expect(invalidClient.initialize()).rejects.toThrow('Delegation is required');
    });

    it('should not initialize twice', async () => {
      await client.initialize();
      await client.initialize();
      expect(client.isConnected()).toBe(true);
    });

    it('should handle initialization errors', async () => {
      const mockError = new Error('Initialization failed');
      vi.spyOn(client, 'initialize').mockRejectedValueOnce(mockError);
      await expect(client.initialize()).rejects.toThrow('Initialization failed');
    });

    it('should handle non-Error objects during initialization', async () => {
      vi.spyOn(client, 'initialize').mockRejectedValueOnce('Unknown error');
      await expect(client.initialize()).rejects.toThrow('Unknown error');
    });
  });

  describe('getStorage', () => {
    it('should return null when not initialized', () => {
      expect(client.getStorage()).toBeNull();
    });

    it('should return storage client after initialization', async () => {
      await client.initialize();
      expect(client.getStorage()).not.toBeNull();
    });
  });

  describe('getConfig', () => {
    it('should return the current config', () => {
      const config = client.getConfig();
      expect(config).toEqual(testConfig);
    });

    it('should return config with default gateway URL when not provided', () => {
      const clientWithoutGateway = new StorachaClient({
        privateKey: testConfig.privateKey,
        delegation: testConfig.delegation,
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
    it('should return configured gateway URL', () => {
      expect(client.getGatewayUrl()).toBe(testConfig.gatewayUrl);
    });
  });

  describe('upload', () => {
    const mockUploadFile: UploadFile = {
      name: 'test.txt',
      content: Buffer.from('test-data').toString('base64'),
      type: 'text/plain'
    };

    beforeEach(async () => {
      await client.initialize();
    });

    it('should upload file successfully with base64 data', async () => {
      const result = await client.uploadFiles([mockUploadFile]);

      expect(result).toEqual({
        root: 'test-cid',
        rootURL: `${testConfig.gatewayUrl}/ipfs/test-cid`,
        files: [{
          name: 'test.txt',
          url: `${testConfig.gatewayUrl}/ipfs/test-cid/test.txt`,
          type: 'text/plain',
        }]
      });
      expect(client.getStorage()?.uploadDirectory).toHaveBeenCalledWith(
        [expect.any(File)],
        expect.any(Object)
      );
    });

    it('should throw error if client not initialized', async () => {
      const uninitializedClient = new StorachaClient(testConfig);
      await expect(uninitializedClient.uploadFiles([mockUploadFile])).rejects.toThrow('Client not initialized');
    });

    it('should handle non-base64 data as binary', async () => {
      const binaryFile: UploadFile = {
        name: 'test.bin',
        content: 'test-data',
        type: 'application/octet-stream'
      };

      const result = await client.uploadFiles([binaryFile]);

      expect(result).toEqual({
        root: 'test-cid',
        rootURL: `${testConfig.gatewayUrl}/ipfs/test-cid`,
        files: [{
          name: 'test.bin',
          url: `${testConfig.gatewayUrl}/ipfs/test-cid/test.bin`,
          type: 'application/octet-stream'
        }]
      });
      expect(client.getStorage()?.uploadDirectory).toHaveBeenCalledWith(
        [expect.any(File)],
        expect.any(Object)
      );
    });

    it('should handle upload errors', async () => {
      const mockError = new Error('Upload failed');
      vi.spyOn(client.getStorage()!, 'uploadDirectory').mockRejectedValueOnce(mockError);

      await expect(client.uploadFiles([mockUploadFile])).rejects.toThrow('Upload failed');
    });

    it('should handle upload abort', async () => {
      const mockAbortError = new Error('Upload aborted');
      vi.spyOn(client.getStorage()!, 'uploadDirectory').mockRejectedValueOnce(mockAbortError);

      await expect(client.uploadFiles([mockUploadFile])).rejects.toThrow('Upload aborted');
    });

    it('should handle unknown error types during upload', async () => {
      vi.spyOn(client.getStorage()!, 'uploadDirectory').mockRejectedValueOnce('Unknown error');

      await expect(client.uploadFiles([mockUploadFile])).rejects.toThrow('Unknown error');
    });

    it('should handle upload without IPFS publishing', async () => {
      const result = await client.uploadFiles([mockUploadFile], { publishToIPFS: false });

      expect(result).toEqual({
        root: 'test-cid',
        rootURL: `${testConfig.gatewayUrl}/ipfs/test-cid`,
        files: [{
          name: 'test.txt',
          url: `${testConfig.gatewayUrl}/ipfs/test-cid/test.txt`,
          type: 'text/plain'
        }]
      });
      expect(client.getStorage()?.uploadDirectory).toHaveBeenCalledWith(
        [expect.any(File)],
        expect.objectContaining({ pieceHasher: undefined })
      );
    });

    it('should use detectMimeType when file type is not provided', async () => {
      const fileWithoutType: UploadFile = {
        name: 'test.txt',
        content: Buffer.from('test-data').toString('base64')
      };

      const result = await client.uploadFiles([fileWithoutType]);

      expect(result).toEqual({
        root: 'test-cid',
        rootURL: `${testConfig.gatewayUrl}/ipfs/test-cid`,
        files: [{
          name: 'test.txt',
          url: `${testConfig.gatewayUrl}/ipfs/test-cid/test.txt`,
          type: undefined
        }]
      });
      expect(client.getStorage()?.uploadDirectory).toHaveBeenCalledWith(
        [expect.any(File)],
        expect.any(Object)
      );
    });

    it('should validate upload result structure', async () => {
      const result = await client.uploadFiles([mockUploadFile]);

      // Validate result structure
      expect(result).toHaveProperty('root');
      expect(result).toHaveProperty('rootURL');
      expect(result).toHaveProperty('files');
      expect(Array.isArray(result.files)).toBe(true);
      
      // Validate file entry structure
      const fileEntry = result.files[0];
      expect(fileEntry).toHaveProperty('name');
      expect(fileEntry).toHaveProperty('url');
      expect(fileEntry).toHaveProperty('type');
      
      // Validate URL construction
      expect(fileEntry.url).toBe(`${testConfig.gatewayUrl}/ipfs/${result.root}/${fileEntry.name}`);
    });

    it('should handle large file uploads', async () => {
      const largeFile: UploadFile = {
        name: 'large.bin',
        content: Buffer.alloc(1024 * 1024).toString('base64'), // 1MB file
        type: 'application/octet-stream'
      };

      const result = await client.uploadFiles([largeFile]);

      expect(result).toEqual({
        root: 'test-cid',
        rootURL: `${testConfig.gatewayUrl}/ipfs/test-cid`,
        files: [{
          name: 'large.bin',
          url: `${testConfig.gatewayUrl}/ipfs/test-cid/large.bin`,
          type: 'application/octet-stream'
        }]
      });
    });

    it('should handle concurrent uploads', async () => {
      const files: UploadFile[] = [
        { name: 'file1.txt', content: Buffer.from('test1').toString('base64'), type: 'text/plain' },
        { name: 'file2.txt', content: Buffer.from('test2').toString('base64'), type: 'text/plain' }
      ];

      const result = await client.uploadFiles(files);

      expect(result.files).toHaveLength(2);
      expect(result.files[0].name).toBe('file1.txt');
      expect(result.files[1].name).toBe('file2.txt');
      expect(result.files[0].url).toBe(`${testConfig.gatewayUrl}/ipfs/${result.root}/file1.txt`);
      expect(result.files[1].url).toBe(`${testConfig.gatewayUrl}/ipfs/${result.root}/file2.txt`);
    });
  });

  describe('retrieve', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode('test-data').buffer,
        headers: new Headers({ 'content-type': 'text/plain' })
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should retrieve file successfully from gateway', async () => {
      const result = await client.retrieve('test-cid');
      expect(result).toEqual({
        data: Buffer.from('test-data').toString('base64'),
        type: 'text/plain'
      });
      expect(global.fetch).toHaveBeenCalledWith(
        new URL('/ipfs/test-cid', testConfig.gatewayUrl)
      );
    });

    it('should not throw error if client not initialized', async () => {
      const uninitializedClient = new StorachaClient(testConfig);
      await expect(uninitializedClient.retrieve('test-cid')).resolves.toBeDefined();
    });

    it('should handle HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(client.retrieve('test-cid')).rejects.toThrow('HTTP error 404 Not Found');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(client.retrieve('test-cid')).rejects.toThrow('Network error');
    });

    it('should handle unknown error types during retrieve', async () => {
      global.fetch = vi.fn().mockRejectedValue('Unknown error');

      await expect(client.retrieve('test-cid')).rejects.toThrow('Unknown error');
    });

    it('should handle missing content-type header', async () => {
      const client = new StorachaClient({
        privateKey: 'test-key',
        delegation: 'test-delegation',
        gatewayUrl: 'https://test.gateway'
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('test-data')),
        headers: {
          get: () => null
        }
      });

      const result = await client.retrieve('test-cid');
      expect(result).toEqual({
        data: Buffer.from('test-data').toString('base64'),
        type: undefined
      });
    });
  });
}); 