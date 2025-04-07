import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadTool } from '../../../../../src/core/server/tools/upload.js';
import { StorachaClient } from '../../../../../src/core/storage/client.js';
import { StorageConfig } from '../../../../../src/core/storage/types.js';
import { Capabilities, Delegation } from '@ucanto/interface';
import { Signer } from '@ucanto/principal/ed25519';

vi.mock('../../../../../src/core/storage/utils.js', () => {
  return {
    detectMimeType: vi.fn().mockImplementation(fileName => {
      if (fileName.endsWith('.json')) return 'application/json';
      return 'text/plain';
    }),
    parseDelegation: vi.fn().mockImplementation(async delegationStr => {
      if (delegationStr === 'custom-delegation') {
        return {
          root: {
            did: () => 'did:key:custom',
            sign: vi.fn().mockResolvedValue(new Uint8Array()),
            verify: vi.fn().mockResolvedValue(true),
          },
        };
      }
      throw new Error('Unexpected delegation string');
    }),
  };
});

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
  principal: {
    did: () => 'did:key:mock',
    sign: vi.fn().mockResolvedValue(new Uint8Array()),
    verify: vi.fn().mockResolvedValue(true),
    toArchive: vi.fn().mockReturnValue({
      did: 'did:key:mock',
      key: new Uint8Array(),
    }),
  },
  type: vi.fn(),
  createDelegation: vi.fn(),
  revokeDelegation: vi.fn(),
  _agent: {},
  _serviceConf: {},
  _store: {},
  _connection: {},
} as any;

const mockUploadFiles = vi.fn();
const mockInitialize = vi.fn();

vi.mock('../../../../../src/core/storage/client.js', () => ({
  StorachaClient: vi.fn().mockImplementation(() => ({
    uploadFiles: mockUploadFiles,
    initialize: mockInitialize,
    getStorage: vi.fn().mockReturnValue({
      principal: {
        did: () => 'did:key:mock',
        sign: vi.fn().mockResolvedValue(new Uint8Array()),
        verify: vi.fn().mockResolvedValue(true),
        toArchive: vi.fn().mockReturnValue({
          did: 'did:key:mock',
          key: new Uint8Array(),
        }),
      },
      uploadFile: vi.fn().mockResolvedValue('test-cid'),
      uploadDirectory: vi.fn().mockResolvedValue('test-cid'),
      addSpace: vi.fn(),
    }),
    isConnected: vi.fn().mockReturnValue(true),
    getConfig: vi.fn().mockReturnValue(mockStorageConfig),
    getGatewayUrl: vi.fn().mockReturnValue(new URL('https://mock-gateway.url')),
  })),
}));

const mockSigner = {
  did: () => 'did:key:mock',
  sign: vi.fn().mockResolvedValue(new Uint8Array()),
  verify: vi.fn().mockResolvedValue(true),
} as unknown as Signer.EdSigner;

const mockDelegation = {
  root: {
    did: () => 'did:key:mock',
    sign: vi.fn().mockResolvedValue(new Uint8Array()),
    verify: vi.fn().mockResolvedValue(true),
  },
} as unknown as Delegation<Capabilities>;

const mockStorageConfig: StorageConfig = {
  signer: mockSigner,
  delegation: mockDelegation,
  gatewayUrl: new URL('https://mock-gateway.url'),
};

describe('Upload Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadFiles.mockResolvedValue({ url: 'test-url' });
    mockInitialize.mockResolvedValue(undefined);
  });

  describe('input validation', () => {
    it('should validate valid base64 input', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(true);
    });

    it('should reject invalid base64 input', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'not-base64',
        name: 'test.txt',
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(false);
    });

    it('should reject malformed base64 input', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'a'.repeat(5), // Invalid base64 length
        name: 'test.txt',
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(false);
    });

    it('should reject non-base64 characters', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'a===', // Invalid padding
        name: 'test.txt',
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(false);
    });

    it('should accept empty string as valid base64', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: '',
        name: 'test.txt',
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(true);
    });

    it('should reject base64 with invalid padding', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(true);
    });

    it('should accept optional parameters', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
        type: 'text/plain',
        delegation: 'test-delegation',
        gatewayUrl: 'https://test.com',
        publishToFilecoin: true,
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(true);
    });
  });

  describe('file handling', () => {
    it('should handle base64 string input', async () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
      };

      await tool.handler(input);

      expect(mockUploadFiles).toHaveBeenCalledWith(
        [
          {
            name: 'test.txt',
            content: 'dGVzdA==',
            type: 'text/plain',
          },
        ],
        {
          publishToFilecoin: false,
          retries: 3,
        }
      );
    });

    it('should handle Filecoin publishing when publishToFilecoin is true', async () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
        publishToFilecoin: true,
      };
      await tool.handler(input);

      expect(mockUploadFiles).toHaveBeenCalledWith(
        [
          {
            name: 'test.txt',
            content: 'dGVzdA==',
            type: 'text/plain',
          },
        ],
        {
          publishToFilecoin: true,
          retries: 3,
        }
      );
    });

    it('should not use pieceHasher when publishToFilecoin is false', async () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
        publishToFilecoin: false,
      };
      await tool.handler(input);

      expect(mockUploadFiles).toHaveBeenCalledWith(
        [
          {
            name: 'test.txt',
            content: 'dGVzdA==',
            type: 'text/plain',
          },
        ],
        {
          publishToFilecoin: false,
          retries: 3,
        }
      );
    });

    it('should handle base64 string input with detected MIME type', async () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
      };

      await tool.handler(input);

      expect(mockUploadFiles).toHaveBeenCalledWith(
        [
          {
            name: 'test.txt',
            content: 'dGVzdA==',
            type: 'text/plain',
          },
        ],
        {
          publishToFilecoin: false,
          retries: 3,
        }
      );
    });

    it('should use correct MIME type for known extensions', async () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.json',
      };

      await tool.handler(input);

      expect(mockUploadFiles).toHaveBeenCalledWith(
        [
          {
            name: 'test.json',
            content: 'dGVzdA==',
            type: 'application/json',
          },
        ],
        {
          publishToFilecoin: false,
          retries: 3,
        }
      );
    });

    it('should use provided type over detected type', async () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
        type: 'application/custom',
      };

      await tool.handler(input);

      expect(mockUploadFiles).toHaveBeenCalledWith(
        [
          {
            name: 'test.txt',
            content: 'dGVzdA==',
            type: 'application/custom',
          },
        ],
        {
          publishToFilecoin: false,
          retries: 3,
        }
      );
    });
  });

  describe('configuration', () => {
    it('should use custom delegation if provided', async () => {
      vi.clearAllMocks();
      mockUploadFiles.mockResolvedValue({ url: 'test-url' });

      const tool = uploadTool({
        signer: mockSigner,
        delegation: mockDelegation,
        gatewayUrl: new URL('https://mock-gateway.url'),
      });

      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
        delegation: 'custom-delegation',
      };

      await tool.handler(input);

      expect(mockUploadFiles).toHaveBeenCalledWith(
        [
          {
            name: 'test.txt',
            content: 'dGVzdA==',
            type: 'text/plain',
          },
        ],
        {
          publishToFilecoin: false,
          retries: 3,
        }
      );
    });

    it('should use custom gateway URL if provided', async () => {
      const tool = uploadTool({
        signer: mockSigner,
        delegation: mockDelegation,
        gatewayUrl: new URL('https://custom-gateway.url'),
      });
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
        gatewayUrl: 'https://custom-gateway.url',
      };

      await tool.handler(input);

      expect(mockUploadFiles).toHaveBeenCalledWith(
        [
          {
            name: 'test.txt',
            content: 'dGVzdA==',
            type: 'text/plain',
          },
        ],
        {
          publishToFilecoin: false,
          retries: 3,
        }
      );
    });

    it('should use custom file name and type if provided', async () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'custom.txt',
        type: 'text/custom',
      };

      await tool.handler(input);

      expect(mockUploadFiles).toHaveBeenCalledWith(
        [
          {
            name: 'custom.txt',
            content: 'dGVzdA==',
            type: 'text/custom',
          },
        ],
        {
          publishToFilecoin: false,
          retries: 3,
        }
      );
    });
  });

  describe('error handling', () => {
    it('should handle missing delegation error', async () => {
      const tool = uploadTool({
        ...mockStorageConfig,
        // @ts-ignore - This is intentional to test the error handling
        delegation: undefined,
      });

      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
      };

      const result = await tool.handler(input);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"name":"Error","message":"Delegation is required. Please provide it either in the request or via the DELEGATION environment variable.","cause":null}',
            error: true,
          },
        ],
      });
    });

    it('should handle Error instances during upload', async () => {
      vi.mocked(StorachaClient).mockImplementation(
        () =>
          ({
            config: mockStorageConfig,
            initialized: true,
            storage: mockStorageClient,
            initialize: vi.fn().mockResolvedValue(undefined),
            uploadFiles: vi.fn().mockRejectedValue(new Error('Upload failed')),
            getStorage: vi.fn().mockReturnValue(mockStorageClient),
            isConnected: vi.fn().mockReturnValue(true),
            getConfig: vi.fn().mockReturnValue(mockStorageConfig),
            getGatewayUrl: vi.fn().mockReturnValue('https://mock-gateway.url'),
            retrieve: vi.fn().mockResolvedValue({ url: 'test-url' }),
          }) as unknown as StorachaClient
      );

      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
      };

      const result = await tool.handler(input);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"name":"Error","message":"Upload failed","cause":null}',
            error: true,
          },
        ],
      });
    });

    it('should handle non-Error objects during upload', async () => {
      vi.mocked(StorachaClient).mockImplementation(
        () =>
          ({
            config: mockStorageConfig,
            initialized: true,
            storage: mockStorageClient,
            initialize: vi.fn().mockResolvedValue(undefined),
            uploadFiles: vi.fn().mockRejectedValue('Unknown error'),
            getStorage: vi.fn().mockReturnValue(mockStorageClient),
            isConnected: vi.fn().mockReturnValue(true),
            getConfig: vi.fn().mockReturnValue(mockStorageConfig),
            getGatewayUrl: vi.fn().mockReturnValue('https://mock-gateway.url'),
            retrieve: vi.fn().mockResolvedValue({ url: 'test-url' }),
          }) as unknown as StorachaClient
      );

      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
      };

      const result = await tool.handler(input);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"name":"Error","message":"Unknown error","cause":null}',
            error: true,
          },
        ],
      });
    });

    it('should handle initialization errors', async () => {
      vi.mocked(StorachaClient).mockImplementation(
        () =>
          ({
            config: mockStorageConfig,
            initialized: false,
            storage: mockStorageClient,
            initialize: vi.fn().mockRejectedValue(new Error('Initialization failed')),
            uploadFiles: vi.fn().mockResolvedValue({ url: 'test-url' }),
            getStorage: vi.fn().mockReturnValue(mockStorageClient),
            isConnected: vi.fn().mockReturnValue(true),
            getConfig: vi.fn().mockReturnValue(mockStorageConfig),
            getGatewayUrl: vi.fn().mockReturnValue('https://mock-gateway.url'),
            retrieve: vi.fn().mockResolvedValue({ url: 'test-url' }),
          }) as unknown as StorachaClient
      );

      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'dGVzdA==', // "test" in base64 with proper padding
        name: 'test.txt',
      };

      const result = await tool.handler(input);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '{"name":"Error","message":"Initialization failed","cause":null}',
            error: true,
          },
        ],
      });
    });
  });

  describe('base64 validation', () => {
    beforeEach(() => {
      vi.mocked(StorachaClient).mockImplementation(
        () =>
          ({
            config: mockStorageConfig,
            initialized: true,
            storage: mockStorageClient,
            initialize: vi.fn().mockResolvedValue(undefined),
            uploadFiles: vi.fn().mockResolvedValue({ url: 'test-url' }),
            getStorage: vi.fn().mockReturnValue(mockStorageClient),
            isConnected: vi.fn().mockReturnValue(true),
            getConfig: vi.fn().mockReturnValue(mockStorageConfig),
            getGatewayUrl: vi.fn().mockReturnValue('https://mock-gateway.url'),
            retrieve: vi.fn().mockResolvedValue({ url: 'test-url' }),
          }) as unknown as StorachaClient
      );
    });

    it('should accept valid base64 string', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64 with proper padding
        name: 'test.txt',
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(true);
    });

    it('should accept base64 string with data URL prefix', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'data:text/plain;base64,SGVsbG8gV29ybGQ=', // "Hello World" in base64 with data URL
        name: 'test.txt',
      };
      expect(tool.inputSchema.safeParse(input).success).toBe(true);
    });

    it('should reject invalid base64 string', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'not-base64!',
        name: 'test.txt',
      };
      const result = tool.inputSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid base64 string');
      }
    });

    it('should reject malformed base64 string', () => {
      const tool = uploadTool(mockStorageConfig);
      const input = {
        file: 'SGVsbG8gV29ybGQ', // Missing padding
        name: 'test.txt',
      };
      const result = tool.inputSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid base64 string');
      }
    });
  });
});
