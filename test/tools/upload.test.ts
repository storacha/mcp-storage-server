import { describe, it, expect, beforeEach, vi } from 'vitest';
import { uploadTool } from '../../src/core/server/tools/upload.js';
import { StorachaClient } from '../../src/core/storage/client.js';
import { loadConfig } from '../../src/core/storage/config.js';

// Mock the storage client and config
vi.mock('../../src/core/storage/client.js');
vi.mock('../../src/core/storage/config.js');

describe('Upload Tool', () => {
  const mockConfig = {
    privateKey: 'test-private-key',
    delegation: 'test-delegation',
    gatewayUrl: 'https://test-gateway.link'
  };

  const mockClient = {
    initialize: vi.fn(),
    upload: vi.fn(),
    isConnected: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (loadConfig as any).mockReturnValue(mockConfig);
    (StorachaClient as any).mockImplementation(() => mockClient);
  });

  it('should validate input schema correctly', async () => {
    // Test with invalid base64
    const invalidInput = {
      file: 'not-base64!',
      name: 'test.txt'
    };
    await expect(uploadTool.inputSchema.parseAsync(invalidInput))
      .rejects
      .toThrow('Invalid base64 string');

    // Test with valid base64
    const validInput = {
      file: 'SGVsbG8sIFdvcmxkIQ==', // "Hello, World!" in base64
      name: 'test.txt'
    };
    const parsed = await uploadTool.inputSchema.parseAsync(validInput);
    expect(parsed).toEqual(validInput);
  });

  it('should handle successful file upload', async () => {
    const testInput = {
      file: 'SGVsbG8sIFdvcmxkIQ==',
      name: 'test.txt',
      type: 'text/plain'
    };

    const mockResult = {
      cid: 'test-cid',
      url: 'https://test-gateway.link/ipfs/test-cid'
    };

    mockClient.upload.mockResolvedValue(mockResult);

    const result = await uploadTool.handler(testInput, {});

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: JSON.stringify({
          cid: mockResult.cid,
          url: mockResult.url,
          size: 13, // "Hello, World!" length
          type: 'text/plain'
        })
      }]
    });

    expect(mockClient.upload).toHaveBeenCalledWith(
      testInput.file,
      testInput.name,
      {
        type: testInput.type,
        retries: 3
      }
    );
  });

  it('should handle upload errors gracefully', async () => {
    const testInput = {
      file: 'SGVsbG8sIFdvcmxkIQ==',
      name: 'test.txt'
    };

    const errorMessage = 'Network error';
    mockClient.upload.mockRejectedValue(new Error(errorMessage));

    const result = await uploadTool.handler(testInput, {});

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: `Upload failed: ${errorMessage}`
      }]
    });
  });

  it('should use custom delegation when provided', async () => {
    const testInput = {
      file: 'SGVsbG8sIFdvcmxkIQ==',
      name: 'test.txt',
      delegation: 'custom-delegation'
    };

    const mockResult = {
      cid: 'test-cid',
      url: 'https://test-gateway.link/ipfs/test-cid'
    };

    mockClient.upload.mockResolvedValue(mockResult);

    await uploadTool.handler(testInput, {});

    // Check that StorachaClient was constructed with custom delegation
    expect(StorachaClient).toHaveBeenCalledWith(
      expect.objectContaining({
        privateKey: mockConfig.privateKey,
        delegation: 'custom-delegation',
        gatewayUrl: mockConfig.gatewayUrl
      })
    );

    expect(mockClient.upload).toHaveBeenCalledWith(
      testInput.file,
      testInput.name,
      {
        type: 'application/octet-stream',
        retries: 3
      }
    );
  });

  it('should use custom gateway URL when provided', async () => {
    const testInput = {
      file: 'SGVsbG8sIFdvcmxkIQ==',
      name: 'test.txt',
      gatewayUrl: 'https://custom-gateway.link'
    };

    const mockResult = {
      cid: 'test-cid',
      url: 'https://custom-gateway.link/ipfs/test-cid'
    };

    mockClient.upload.mockResolvedValue(mockResult);

    await uploadTool.handler(testInput, {});

    // Check that StorachaClient was constructed with custom gateway URL
    expect(StorachaClient).toHaveBeenCalledWith(
      expect.objectContaining({
        privateKey: mockConfig.privateKey,
        delegation: mockConfig.delegation,
        gatewayUrl: 'https://custom-gateway.link'
      })
    );

    expect(mockClient.upload).toHaveBeenCalledWith(
      testInput.file,
      testInput.name,
      {
        type: 'application/octet-stream',
        retries: 3
      }
    );
  });
}); 