import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadTool } from '../../../../src/core/server/tools/upload.js';
import { StorachaClient } from '../../../../src/core/storage/client.js';
import { StorageConfig } from '../../../../src/core/storage/types.js';

const mockStorageClient = {
  capability: {},
  coupon: {},
  did: 'did:mock',
  authorize: vi.fn(),
  delegate: vi.fn(),
  upload: vi.fn(),
  uploadCAR: vi.fn(),
  uploadFile: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
  get: vi.fn(),
  addSpace: vi.fn(),
  setCurrentSpace: vi.fn(),
  createSpace: vi.fn(),
  listSpaces: vi.fn(),
  currentSpace: vi.fn(),
  provision: vi.fn(),
  claim: vi.fn(),
  proofs: vi.fn(),
  subscriptions: vi.fn(),
  plan: vi.fn(),
  usage: vi.fn(),
  uploadDirectory: vi.fn(),
  login: vi.fn(),
  accounts: vi.fn(),
  getReceipt: vi.fn(),
  defaultProvider: vi.fn(),
  createProvider: vi.fn(),
  getProvider: vi.fn(),
  listProviders: vi.fn(),
  removeProvider: vi.fn(),
  setDefaultProvider: vi.fn(),
  getSpace: vi.fn(),
  removeSpace: vi.fn(),
  getSpaceProviders: vi.fn(),
  setSpaceProviders: vi.fn(),
  getSpaceReceipts: vi.fn(),
  spaces: vi.fn(),
  shareSpace: vi.fn(),
  addProof: vi.fn(),
  delegations: vi.fn(),
  store: vi.fn(),
  agent: vi.fn(),
  connection: vi.fn(),
  signer: vi.fn(),
  principal: vi.fn(),
  type: vi.fn(),
  createDelegation: vi.fn(),
  revokeDelegation: vi.fn(),
  _agent: {},
  _serviceConf: {},
  _store: {},
  _connection: {}
} as any;

const mockUploadFiles = vi.fn();
const mockInitialize = vi.fn();

vi.mock('../../../../src/core/storage/client.js', () => ({
  StorachaClient: vi.fn().mockImplementation(() => ({
    uploadFiles: mockUploadFiles,
    initialize: mockInitialize,
    getStorage: vi.fn(),
    isConnected: vi.fn(),
    getConfig: vi.fn(),
    getGatewayUrl: vi.fn()
  }))
}));

describe('Upload Tool', () => {
  const mockConfig: StorageConfig = {
    privateKey: 'mock-private-key',
    delegation: 'mock-delegation',
    gatewayUrl: 'https://mock-gateway.url'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadFiles.mockResolvedValue({ url: 'test-url' });
    mockInitialize.mockResolvedValue(undefined);
  });

  describe('input validation', () => {
    it('should validate valid base64 input', () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt'
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(true);
    });

    it('should reject invalid base64 input', () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: 'not-base64',
        name: 'test.txt'
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(false);
    });

    it('should reject malformed base64 input', () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: 'a'.repeat(5), // Invalid base64 length
        name: 'test.txt'
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(false);
    });

    it('should reject non-base64 characters', () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: '!@#$%^&*',
        name: 'test.txt'
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(false);
    });

    it('should accept empty string as valid base64', () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: '',
        name: 'test.txt'
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(true);
    });

    it('should reject base64 with invalid padding', () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: 'a===', // Invalid padding
        name: 'test.txt'
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(false);
    });

    it('should accept optional parameters', () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt',
        type: 'text/plain',
        delegation: 'test-delegation',
        gatewayUrl: 'https://test.com',
        publishToFilecoin: true
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(true);
    });
  });

  describe('file handling', () => {
    it('should handle base64 string input', async () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt'
      };

      await tool.handler(input, { storageConfig: mockConfig });

      expect(mockUploadFiles).toHaveBeenCalledWith([{
        name: 'test.txt',
        content: Buffer.from('test').toString('base64'),
        type: 'text/plain'
      }], {
        publishToFilecoin: false,
        retries: 3
      });
    });

    it('should handle Filecoin publishing when publishToFilecoin is true', async () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt',
        publishToFilecoin: true
      };
      const mockPieceHasher = { hash: vi.fn() };
      await tool.handler(input, { storageConfig: mockConfig, pieceHasher: mockPieceHasher });

      expect(mockUploadFiles).toHaveBeenCalledWith([{
        name: 'test.txt',
        content: Buffer.from('test').toString('base64'),
        type: 'text/plain',
      }], {
        publishToFilecoin: true,
        retries: 3
      });
    });

    it('should not use pieceHasher when publishToFilecoin is false', async () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt',
        publishToFilecoin: false
      };
      const mockPieceHasher = { hash: vi.fn() };
      await tool.handler(input, { storageConfig: mockConfig, pieceHasher: mockPieceHasher });

      expect(mockUploadFiles).toHaveBeenCalledWith([{
        name: 'test.txt',
        content: Buffer.from('test').toString('base64'),
        type: 'text/plain',
      }], {
        publishToFilecoin: false,
        retries: 3
      });
    });

    it('should handle base64 string input with detected MIME type', async () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt'
      };

      await tool.handler(input, { storageConfig: mockConfig });

      expect(mockUploadFiles).toHaveBeenCalledWith([{
        name: 'test.txt',
        content: Buffer.from('test').toString('base64'),
        type: 'text/plain'
      }], {
        publishToFilecoin: false,
        retries: 3
      });
    });

    it('should use correct MIME type for known extensions', async () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.json'
      };

      await tool.handler(input, { storageConfig: mockConfig });

      expect(mockUploadFiles).toHaveBeenCalledWith([{
        name: 'test.json',
        content: Buffer.from('test').toString('base64'),
        type: 'application/json'
      }], {
        publishToFilecoin: false,
        retries: 3
      });
    });

    it('should use provided type over detected type', async () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt',
        type: 'application/custom'
      };

      await tool.handler(input, { storageConfig: mockConfig });

      expect(mockUploadFiles).toHaveBeenCalledWith([{
        name: 'test.txt',
        content: Buffer.from('test').toString('base64'),
        type: 'application/custom'
      }], {
        publishToFilecoin: false,
        retries: 3
      });
    });
  });

  describe('configuration', () => {
    it('should use custom delegation if provided', async () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt',
        delegation: 'custom-delegation'
      };

      await tool.handler(input, {
        storageConfig: {
          privateKey: mockConfig.privateKey,
          delegation: 'custom-delegation',
          gatewayUrl: mockConfig.gatewayUrl
        }
      });

      expect(mockUploadFiles).toHaveBeenCalledWith([{
        name: 'test.txt',
        content: Buffer.from('test').toString('base64'),
        type: 'text/plain'
      }], {
        publishToFilecoin: false,
        retries: 3
      });
    });

    it('should use custom gateway URL if provided', async () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt',
        gatewayUrl: 'https://custom-gateway.url'
      };

      await tool.handler(input, {
        storageConfig: {
          privateKey: mockConfig.privateKey,
          delegation: mockConfig.delegation,
          gatewayUrl: 'https://custom-gateway.url'
        }
      });

      expect(mockUploadFiles).toHaveBeenCalledWith([{
        name: 'test.txt',
        content: Buffer.from('test').toString('base64'),
        type: 'text/plain'
      }], {
        publishToFilecoin: false,
        retries: 3
      });
    });

    it('should use custom file name and type if provided', async () => {
      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'custom.txt',
        type: 'text/custom',
      };

      await tool.handler(input, { storageConfig: mockConfig });

      expect(mockUploadFiles).toHaveBeenCalledWith([{
        name: 'custom.txt',
        content: Buffer.from('test').toString('base64'),
        type: 'text/custom'
      }], {
        publishToFilecoin: false,
        retries: 3
      });
    });
  });

  describe('error handling', () => {
    it('should handle missing delegation error', async () => {
      const tool = uploadTool({
        privateKey: mockConfig.privateKey,
        gatewayUrl: mockConfig.gatewayUrl
      } as StorageConfig);

      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt'
      };

      const result = await tool.handler(input, { storageConfig: mockConfig });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Upload failed: Delegation is required. Please provide it either in the request or via the DELEGATION environment variable.',
          error: true
        }]
      });
    });

    it('should handle Error instances during upload', async () => {
      vi.mocked(StorachaClient).mockImplementation(() => ({
        config: mockConfig,
        initialized: true,
        storage: mockStorageClient,
        initialize: vi.fn().mockResolvedValue(undefined),
        uploadFiles: vi.fn().mockRejectedValue(new Error('Upload failed')),
        getStorage: vi.fn().mockReturnValue(mockStorageClient),
        isConnected: vi.fn().mockReturnValue(true),
        getConfig: vi.fn().mockReturnValue(mockConfig),
        getGatewayUrl: vi.fn().mockReturnValue('https://mock-gateway.url'),
        retrieve: vi.fn().mockResolvedValue({ url: 'test-url' })
      } as unknown as StorachaClient));

      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt'
      };

      const result = await tool.handler(input, { storageConfig: mockConfig });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Upload failed: Upload failed',
          error: true
        }]
      });
    });

    it('should handle non-Error objects during upload', async () => {
      vi.mocked(StorachaClient).mockImplementation(() => ({
        config: mockConfig,
        initialized: true,
        storage: mockStorageClient,
        initialize: vi.fn().mockResolvedValue(undefined),
        uploadFiles: vi.fn().mockRejectedValue('Unknown error'),
        getStorage: vi.fn().mockReturnValue(mockStorageClient),
        isConnected: vi.fn().mockReturnValue(true),
        getConfig: vi.fn().mockReturnValue(mockConfig),
        getGatewayUrl: vi.fn().mockReturnValue('https://mock-gateway.url'),
        retrieve: vi.fn().mockResolvedValue({ url: 'test-url' })
      } as unknown as StorachaClient));

      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt'
      };

      const result = await tool.handler(input, { storageConfig: mockConfig });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Upload failed: Unknown error',
          error: true
        }]
      });
    });

    it('should handle initialization errors', async () => {
      vi.mocked(StorachaClient).mockImplementation(() => ({
        config: mockConfig,
        initialized: true,
        storage: mockStorageClient,
        initialize: vi.fn().mockRejectedValue(new Error('Initialization failed')),
        uploadFiles: vi.fn().mockResolvedValue({ url: 'test-url' }),
        getStorage: vi.fn().mockReturnValue(mockStorageClient),
        isConnected: vi.fn().mockReturnValue(true),
        getConfig: vi.fn().mockReturnValue(mockConfig),
        getGatewayUrl: vi.fn().mockReturnValue('https://mock-gateway.url'),
        retrieve: vi.fn().mockResolvedValue({ url: 'test-url' })
      } as unknown as StorachaClient));

      const tool = uploadTool(mockConfig);
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt'
      };

      const result = await tool.handler(input, { storageConfig: mockConfig });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Upload failed: Initialization failed',
          error: true
        }]
      });
    });
  });
}); 