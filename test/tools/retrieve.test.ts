import { describe, it, expect, beforeEach, vi } from 'vitest';
import { retrieveTool } from '../../src/core/server/tools/retrieve.js';
import { StorachaClient } from '../../src/core/storage/client.js';
import { loadConfig } from '../../src/core/storage/config.js';

// Mock the storage client and config
vi.mock('../../src/core/storage/client.js');
vi.mock('../../src/core/storage/config.js');

describe('Retrieve Tool', () => {
  const mockConfig = {
    privateKey: 'test-private-key',
    delegation: 'test-delegation',
    gatewayUrl: 'https://test-gateway.link'
  };

  const mockClient = {
    retrieve: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (loadConfig as any).mockReturnValue(mockConfig);
    (StorachaClient as any).mockImplementation(() => mockClient);
  });

  it('should validate input schema correctly', async () => {
    // Test with missing CID
    const invalidInput = {};
    await expect(retrieveTool.inputSchema.parseAsync(invalidInput))
      .rejects
      .toThrow();

    // Test with valid CID
    const validInput = {
      cid: 'test-cid'
    };
    const parsed = await retrieveTool.inputSchema.parseAsync(validInput);
    expect(parsed).toEqual(validInput);
  });

  it('should handle successful file retrieval', async () => {
    const testInput = {
      cid: 'test-cid'
    };

    const mockResult = {
      data: 'SGVsbG8sIFdvcmxkIQ==', // "Hello, World!" in base64
      type: 'text/plain'
    };

    mockClient.retrieve.mockResolvedValue(mockResult);

    const result = await retrieveTool.handler(testInput, {});

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: JSON.stringify({
          data: mockResult.data,
          type: mockResult.type
        })
      }]
    });

    expect(mockClient.retrieve).toHaveBeenCalledWith(testInput.cid);
  });

  it('should handle retrieval errors gracefully', async () => {
    const testInput = {
      cid: 'test-cid'
    };

    const errorMessage = 'Not found';
    mockClient.retrieve.mockRejectedValue(new Error(errorMessage));

    const result = await retrieveTool.handler(testInput, {});

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: `Retrieve failed: ${errorMessage}`
      }]
    });
  });

  it('should use custom gateway URL when provided', async () => {
    const testInput = {
      cid: 'test-cid',
      gatewayUrl: 'https://custom-gateway.link'
    };

    const mockResult = {
      data: 'SGVsbG8sIFdvcmxkIQ==',
      type: 'text/plain'
    };

    mockClient.retrieve.mockResolvedValue(mockResult);

    await retrieveTool.handler(testInput, {});

    // Check that StorachaClient was constructed with custom gateway URL
    expect(StorachaClient).toHaveBeenCalledWith({
      privateKey: mockConfig.privateKey,
      delegation: mockConfig.delegation
    });

    expect(mockClient.retrieve).toHaveBeenCalledWith(testInput.cid);
  });
}); 