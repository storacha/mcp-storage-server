import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retrieveTool } from '../../../../../src/core/server/tools/retrieve.js';
import { StorageConfig } from '../../../../../src/core/storage/types.js';
import { Signer } from '@ucanto/principal/ed25519';
import { Delegation, Capabilities } from '@ucanto/interface';
import { StorachaClient } from '../../../../../src/core/storage/client.js';

// Create mocks
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

// Mock global fetch
const originalFetch = global.fetch;

describe('Retrieve Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('should retrieve file successfully', async () => {
    // Mock successful fetch response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode('test-data'),
      headers: new Headers({ 'content-type': 'text/plain' }),
    });

    const tool = retrieveTool(mockStorageConfig);
    const result = await tool.handler({ root: 'test-cid' });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            data: Buffer.from('test-data').toString('base64'),
            type: 'text/plain',
          }),
        },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith(expect.any(URL));
  });

  it('should handle HTTP errors', async () => {
    // Mock HTTP error response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const tool = retrieveTool(mockStorageConfig);
    const result = await tool.handler({ root: 'http-error-cid' });

    expect(result).toEqual({
      content: [
        {
          error: true,
          type: 'text',
          text: 'Retrieve failed: Failed to retrieve file: HTTP error 404 Not Found',
        },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith(expect.any(URL));
  });

  it('should handle network errors', async () => {
    // Mock network error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const tool = retrieveTool(mockStorageConfig);
    const result = await tool.handler({ root: 'network-error-cid' });

    expect(result).toEqual({
      content: [
        {
          error: true,
          type: 'text',
          text: 'Retrieve failed: Failed to retrieve file: Network error',
        },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith(expect.any(URL));
  });

  it('should handle unknown error types', async () => {
    // Mock unknown error
    global.fetch = vi.fn().mockRejectedValue('Unknown error');

    const tool = retrieveTool(mockStorageConfig);
    const result = await tool.handler({ root: 'unknown-error-cid' });

    expect(result).toEqual({
      content: [
        {
          error: true,
          type: 'text',
          text: 'Retrieve failed: Failed to retrieve file: Unknown error',
        },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith(expect.any(URL));
  });

  it('should handle explicitly thrown non-Error objects', async () => {
    // Override global fetch to throw a non-Error object from within the client code
    global.fetch = vi.fn().mockImplementation(() => {
      // This simulates a situation where code inside client.retrieve throws a non-Error object
      throw { custom: 'Non-standard error object' };
    });

    const tool = retrieveTool(mockStorageConfig);
    const result = await tool.handler({ root: 'custom-error-cid' });

    expect(result).toEqual({
      content: [
        {
          error: true,
          type: 'text',
          text: 'Retrieve failed: Failed to retrieve file: Unknown error',
        },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith(expect.any(URL));
  });

  it('should handle direct Error objects with custom messages', async () => {
    // Mock the client to directly throw an Error with a custom message
    // This test specifically targets the error instanceof Error ? error.message : 'Unknown error' branch
    const errorWithMessage = new Error('Direct error message');

    // Create a custom storage config with a client that will throw our error
    const customStorageConfig = {
      ...mockStorageConfig,
      gatewayUrl: undefined, // This will cause getGatewayUrl to throw our error
    };

    // Override the getGatewayUrl method to throw our specific error
    vi.spyOn(StorachaClient.prototype, 'getGatewayUrl').mockImplementation(() => {
      throw errorWithMessage;
    });

    const tool = retrieveTool(customStorageConfig);
    const result = await tool.handler({ root: 'error-message-cid' });

    expect(result).toEqual({
      content: [
        {
          error: true,
          type: 'text',
          text: 'Retrieve failed: Failed to retrieve file: Direct error message',
        },
      ],
    });
  });

  it('should handle missing content-type header', async () => {
    // Mock response with missing content-type header
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode('test-data'),
      headers: new Headers(),
    });

    const tool = retrieveTool(mockStorageConfig);
    const result = await tool.handler({ root: 'no-content-type-cid' });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            data: Buffer.from('test-data').toString('base64'),
          }),
        },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith(expect.any(URL));
  });

  it('should validate input schema', async () => {
    const tool = retrieveTool(mockStorageConfig);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.inputSchema.shape.root).toBeDefined();
  });
});
