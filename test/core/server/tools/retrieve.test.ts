import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retrieveTool } from '../../../../src/core/server/tools/retrieve.js';
import { StorachaClient } from '../../../../src/core/storage/client.js';
import { StorageConfig } from '../../../../src/core/storage/types.js';

const mockStorageConfig: StorageConfig = {
  privateKey: 'mock-private-key',
  delegation: 'mock-delegation',
  gatewayUrl: 'https://mock-gateway.url'
};

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
} as any; // Type assertion needed because some properties are private

vi.mock('../../../../src/core/storage/client.js', () => ({
  StorachaClient: vi.fn().mockImplementation(() => ({
    config: mockStorageConfig,
    initialized: true,
    storage: mockStorageClient,
    initialize: vi.fn().mockResolvedValue(undefined),
    retrieve: vi.fn().mockResolvedValue({ url: 'test-url' }),
    getStorage: vi.fn().mockReturnValue(mockStorageClient),
    isConnected: vi.fn().mockReturnValue(true),
    getConfig: vi.fn().mockReturnValue(mockStorageConfig),
    getGatewayUrl: vi.fn().mockReturnValue('https://mock-gateway.url'),
    uploadFiles: vi.fn().mockResolvedValue({ url: 'test-url' })
  } as unknown as StorachaClient))
}));

describe('Retrieve Tool', () => {
  const mockConfig: StorageConfig = {
    privateKey: 'mock-private-key',
    delegation: 'mock-delegation',
    gatewayUrl: 'https://mock-gateway.url'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully retrieve a file', async () => {
    const tool = retrieveTool(mockConfig);
    const input = { root: 'test-cid' };
    const result = await tool.handler(input, {});

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: JSON.stringify({ url: 'test-url' })
      }]
    });
  });

  it('should handle Error instances during retrieval', async () => {
    vi.mocked(StorachaClient).mockImplementation(() => ({
      config: mockStorageConfig,
      initialized: true,
      storage: mockStorageClient,
      initialize: vi.fn().mockResolvedValue(undefined),
      retrieve: vi.fn().mockRejectedValue(new Error('Retrieval failed')),
      getStorage: vi.fn().mockReturnValue(mockStorageClient),
      isConnected: vi.fn().mockReturnValue(true),
      getConfig: vi.fn().mockReturnValue(mockStorageConfig),
      getGatewayUrl: vi.fn().mockReturnValue('https://mock-gateway.url'),
      uploadFiles: vi.fn().mockResolvedValue({ url: 'test-url' })
    } as unknown as StorachaClient));

    const tool = retrieveTool(mockConfig);
    const input = { root: 'test-cid' };
    const result = await tool.handler(input, {});

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: 'Retrieve failed: Retrieval failed',
        error: true
      }]
    });
  });

  it('should handle non-Error objects during retrieval', async () => {
    vi.mocked(StorachaClient).mockImplementation(() => ({
      config: mockStorageConfig,
      initialized: true,
      storage: mockStorageClient,
      initialize: vi.fn().mockResolvedValue(undefined),
      retrieve: vi.fn().mockRejectedValue('Unknown error'),
      getStorage: vi.fn().mockReturnValue(mockStorageClient),
      isConnected: vi.fn().mockReturnValue(true),
      getConfig: vi.fn().mockReturnValue(mockStorageConfig),
      getGatewayUrl: vi.fn().mockReturnValue('https://mock-gateway.url'),
      uploadFiles: vi.fn().mockResolvedValue({ url: 'test-url' })
    } as unknown as StorachaClient));

    const tool = retrieveTool(mockConfig);
    const input = { root: 'test-cid' };
    const result = await tool.handler(input, {});

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: 'Retrieve failed: Unknown error',
        error: true
      }]
    });
  });

  it('should validate input schema', () => {
    const tool = retrieveTool(mockConfig);
    expect(tool.inputSchema.safeParse({ root: 'test-cid' }).success).toBe(true);
    expect(tool.inputSchema.safeParse({}).success).toBe(false);
    expect(tool.inputSchema.safeParse({ root: 123 }).success).toBe(false);
  });
}); 