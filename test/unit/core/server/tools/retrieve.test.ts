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
    // Mock the client's retrieve method
    vi.spyOn(StorachaClient.prototype, 'retrieve').mockResolvedValue({
      data: Buffer.from('test-data').toString('base64'),
      type: 'text/plain',
    });

    const tool = retrieveTool(mockStorageConfig);
    const result = await tool.handler({ filepath: 'test-cid/file.txt' });

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
    expect(StorachaClient.prototype.retrieve).toHaveBeenCalledWith('test-cid/file.txt');
  });

  it('should handle errors gracefully', async () => {
    // Mock client.retrieve to throw an error
    vi.spyOn(StorachaClient.prototype, 'retrieve').mockRejectedValue(
      new Error('Failed to retrieve file: Some error message')
    );

    const tool = retrieveTool(mockStorageConfig);
    const result = await tool.handler({ filepath: 'error-path/file.txt' });

    expect(result).toEqual({
      content: [
        {
          error: true,
          type: 'text',
          text: '{"name":"Error","message":"Failed to retrieve file: Some error message","cause":null}',
        },
      ],
    });
    expect(StorachaClient.prototype.retrieve).toHaveBeenCalledWith('error-path/file.txt');
  });

  it('should handle non-Error objects', async () => {
    // Mock client.retrieve to throw a non-Error object
    vi.spyOn(StorachaClient.prototype, 'retrieve').mockRejectedValue('Some non-error');

    const tool = retrieveTool(mockStorageConfig);
    const result = await tool.handler({ filepath: 'non-error-path/file.txt' });

    expect(result).toEqual({
      content: [
        {
          error: true,
          type: 'text',
          text: '{"name":"Error","message":"Unknown error","cause":null}',
        },
      ],
    });
    expect(StorachaClient.prototype.retrieve).toHaveBeenCalledWith('non-error-path/file.txt');
  });

  it('should accept various IPFS path formats', async () => {
    // Mock the client's retrieve method
    const retrieveMock = vi.spyOn(StorachaClient.prototype, 'retrieve').mockResolvedValue({
      data: Buffer.from('test-data').toString('base64'),
      type: 'text/plain',
    });

    const tool = retrieveTool(mockStorageConfig);

    // Test with standard format
    await tool.handler({
      filepath: 'bafybeibv7vzycdcnydl5n5lbws6lul2omkm6a6b5wmqt77sicrwnhesy7y/bmoney.txt',
    });
    expect(retrieveMock).toHaveBeenLastCalledWith(
      'bafybeibv7vzycdcnydl5n5lbws6lul2omkm6a6b5wmqt77sicrwnhesy7y/bmoney.txt'
    );

    // Test with /ipfs/ prefix
    await tool.handler({
      filepath: '/ipfs/bafybeibv7vzycdcnydl5n5lbws6lul2omkm6a6b5wmqt77sicrwnhesy7y/bmoney.txt',
    });
    expect(retrieveMock).toHaveBeenLastCalledWith(
      '/ipfs/bafybeibv7vzycdcnydl5n5lbws6lul2omkm6a6b5wmqt77sicrwnhesy7y/bmoney.txt'
    );

    // Test with ipfs:// protocol
    await tool.handler({
      filepath: 'ipfs://bafybeibv7vzycdcnydl5n5lbws6lul2omkm6a6b5wmqt77sicrwnhesy7y/bmoney.txt',
    });
    expect(retrieveMock).toHaveBeenLastCalledWith(
      'ipfs://bafybeibv7vzycdcnydl5n5lbws6lul2omkm6a6b5wmqt77sicrwnhesy7y/bmoney.txt'
    );
  });

  it('should validate that filepath is not empty', async () => {
    const tool = retrieveTool(mockStorageConfig);
    const schema = tool.inputSchema;

    // Empty string should fail validation
    const emptyResult = schema.safeParse({ filepath: '' });
    expect(emptyResult.success).toBe(false);

    // Non-empty string should pass validation
    const validResult = schema.safeParse({ filepath: 'valid-path' });
    expect(validResult.success).toBe(true);
  });
});
