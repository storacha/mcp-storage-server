import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DEFAULT_GATEWAY_URL } from '../../src/core/storage/config.js';
import { StorachaClient } from '../../src/core/storage/client.js';
import { UploadFile, StorageConfig } from '../../src/core/storage/types.js';
import { Signer } from '@ucanto/principal/ed25519';
import { Delegation, Capabilities } from '@ucanto/interface';

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
    parse: vi.fn().mockReturnValue({
      did: () => 'did:key:mock',
      sign: vi.fn().mockResolvedValue(new Uint8Array()),
      verify: vi.fn().mockResolvedValue(true)
    } as unknown as Signer.EdSigner)
  }
}));

vi.mock('../../src/core/storage/utils.js', () => ({
  parseDelegation: vi.fn().mockResolvedValue({
    root: {
      did: () => 'did:key:mock',
      sign: vi.fn().mockResolvedValue(new Uint8Array()),
      verify: vi.fn().mockResolvedValue(true)
    }
  } as unknown as Delegation<Capabilities>)
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
  // Create helper function for URL construction
  const buildGatewayUrl = (gateway: URL | undefined, path: string) => {
    if (!gateway) {
      gateway = new URL(DEFAULT_GATEWAY_URL);
    }
    return new URL(`/ipfs/${path}`, gateway).toString();
  };

  const mockSigner = {
    did: () => 'did:key:mock',
    sign: vi.fn().mockResolvedValue(new Uint8Array()),
    verify: vi.fn().mockResolvedValue(true)
  } as unknown as Signer.EdSigner;

  const mockDelegation = {
    root: {
      did: () => 'did:key:mock',
      sign: vi.fn().mockResolvedValue(new Uint8Array()),
      verify: vi.fn().mockResolvedValue(true)
    }
  } as unknown as Delegation<Capabilities>;

  const mockGatewayUrl = new URL('https://custom-gateway.link');

  const testConfig: StorageConfig = {
    signer: mockSigner,
    delegation: mockDelegation,
    gatewayUrl: mockGatewayUrl
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
        signer: testConfig.signer,
        delegation: testConfig.delegation,
      });
      expect(clientWithoutGateway['config'].gatewayUrl).toEqual(new URL(DEFAULT_GATEWAY_URL));
    });
  });

  describe('initialize', () => {
    it('should initialize successfully with valid config', async () => {
      await client.initialize();
      expect(client.isConnected()).toBe(true);
    });

    it('should throw error if private key is missing', async () => {
      const invalidClient = new StorachaClient({
        signer: undefined as unknown as Signer.EdSigner,
        delegation: testConfig.delegation,
        gatewayUrl: testConfig.gatewayUrl,
      });
      await expect(invalidClient.initialize()).rejects.toThrow('Private key is required');
    });

    it('should throw error if delegation is missing', async () => {
      const invalidClient = new StorachaClient({
        signer: testConfig.signer,
        delegation: undefined as unknown as Delegation<Capabilities>,
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
        signer: testConfig.signer,
        delegation: testConfig.delegation,
      });
      const config = clientWithoutGateway.getConfig();
      expect(config).toEqual({
        signer: testConfig.signer,
        delegation: testConfig.delegation,
        gatewayUrl: new URL(DEFAULT_GATEWAY_URL)
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
        rootURL: buildGatewayUrl(testConfig.gatewayUrl, 'test-cid'),
        files: [{
          name: 'test.txt',
          type: 'text/plain',
          url: buildGatewayUrl(testConfig.gatewayUrl, 'test-cid/test.txt')
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
        rootURL: buildGatewayUrl(testConfig.gatewayUrl, 'test-cid'),
        files: [{
          name: 'test.bin',
          type: 'application/octet-stream',
          url: buildGatewayUrl(testConfig.gatewayUrl, 'test-cid/test.bin')
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

    it('should handle upload without Filecoin publishing', async () => {
      const result = await client.uploadFiles([mockUploadFile], { publishToFilecoin: false });

      expect(result).toEqual({
        root: 'test-cid',
        rootURL: buildGatewayUrl(testConfig.gatewayUrl, 'test-cid'),
        files: [{
          name: 'test.txt',
          type: 'text/plain',
          url: buildGatewayUrl(testConfig.gatewayUrl, 'test-cid/test.txt')
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
        rootURL: buildGatewayUrl(testConfig.gatewayUrl, 'test-cid'),
        files: [{
          name: 'test.txt',
          type: undefined,
          url: buildGatewayUrl(testConfig.gatewayUrl, 'test-cid/test.txt')
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
      expect(fileEntry.url).toBe(buildGatewayUrl(testConfig.gatewayUrl, `${result.root}/${fileEntry.name}`));
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
        rootURL: buildGatewayUrl(testConfig.gatewayUrl, 'test-cid'),
        files: [{
          name: 'large.bin',
          type: 'application/octet-stream',
          url: buildGatewayUrl(testConfig.gatewayUrl, 'test-cid/large.bin')
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
      expect(result.files[0].url).toBe(buildGatewayUrl(testConfig.gatewayUrl, `${result.root}/file1.txt`));
      expect(result.files[1].url).toBe(buildGatewayUrl(testConfig.gatewayUrl, `${result.root}/file2.txt`));
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
        signer: mockSigner,
        delegation: mockDelegation,
        gatewayUrl: mockGatewayUrl
      });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('test-data')),
        headers: new Headers()
      });

      const result = await client.retrieve('test-cid');
      expect(result).toEqual({
        data: Buffer.from('test-data').toString('base64'),
        type: undefined
      });
    });
  });
}); 