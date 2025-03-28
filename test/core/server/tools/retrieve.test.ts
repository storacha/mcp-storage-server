import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retrieveTool } from '../../../../src/core/server/tools/retrieve.js';
import { StorachaClient } from '../../../../src/core/storage/client.js';
import { loadConfig } from '../../../../src/core/storage/config.js';

// Mock dependencies
vi.mock('../../../../src/core/storage/config.js');

describe('Retrieve Tool', () => {
  const mockConfig = {
    privateKey: 'test-private-key',
    delegation: 'test-delegation'
  };

  const mockResult = {
    data: 'test-data',
    type: 'test/type'
  };

  beforeEach(() => {
    // Setup mocks
    vi.mocked(loadConfig).mockReturnValue(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully retrieve a file', async () => {
    const mockRetrieve = vi.fn().mockResolvedValue(mockResult);
    vi.spyOn(StorachaClient.prototype, 'retrieve').mockImplementation(mockRetrieve);

    const input = { root: 'test-cid' };
    const result = await retrieveTool.handler(input, {});

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: JSON.stringify(mockResult)
      }]
    });
    expect(loadConfig).toHaveBeenCalled();
    expect(mockRetrieve).toHaveBeenCalledWith(input.root);
  });

  it('should handle Error instances during retrieval', async () => {
    const mockError = new Error('Test error');
    vi.spyOn(StorachaClient.prototype, 'retrieve').mockRejectedValue(mockError);

    const input = { root: 'test-cid' };
    const result = await retrieveTool.handler(input, {});

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: 'Retrieve failed: Test error'
      }]
    });
  });

  it('should handle non-Error objects during retrieval', async () => {
    vi.spyOn(StorachaClient.prototype, 'retrieve').mockRejectedValue('Unknown error object');

    const input = { root: 'test-cid' };
    const result = await retrieveTool.handler(input, {});

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: 'Retrieve failed: Unknown error'
      }]
    });
  });

  it('should validate input schema', () => {
    expect(retrieveTool.inputSchema.safeParse({ root: 'test-cid' }).success).toBe(true);
    expect(retrieveTool.inputSchema.safeParse({}).success).toBe(false);
    expect(retrieveTool.inputSchema.safeParse({ root: 123 }).success).toBe(false);
  });
}); 