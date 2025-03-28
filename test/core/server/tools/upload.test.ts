import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadTool } from '../../../../src/core/server/tools/upload.js';
import { StorachaClient } from '../../../../src/core/storage/client.js';
import { loadConfig } from '../../../../src/core/storage/config.js';
import { z } from 'zod';

// Mock dependencies
vi.mock('../../../../src/core/storage/config.js');
vi.mock('../../../../src/core/storage/client.js', () => {
  const mockStorachaClient = vi.fn();
  mockStorachaClient.prototype.initialize = vi.fn();
  mockStorachaClient.prototype.uploadFiles = vi.fn();
  mockStorachaClient.prototype.isConnected = vi.fn();
  mockStorachaClient.prototype.getStorage = vi.fn();
  mockStorachaClient.prototype.getConfig = vi.fn();
  mockStorachaClient.prototype.getGatewayUrl = vi.fn();
  mockStorachaClient.prototype.retrieve = vi.fn();
  return { StorachaClient: mockStorachaClient };
});

describe('Upload Tool', () => {
  const mockConfig = {
    privateKey: 'test-private-key',
    delegation: 'test-delegation',
    gatewayUrl: 'https://test-gateway.url'
  };

  const mockResult = {
    root: 'test-cid',
    rootURL: 'https://test-gateway.url/test-cid',
    files: [{
      name: 'test.txt',
      content: 'dGVzdCBkYXRh',
      url: 'https://test-gateway.url/test-cid'
    }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadConfig).mockReturnValue(mockConfig);
    vi.mocked(StorachaClient.prototype.initialize).mockResolvedValue();
    vi.mocked(StorachaClient.prototype.uploadFiles).mockResolvedValue(mockResult);
    vi.mocked(StorachaClient.prototype.getConfig).mockReturnValue(mockConfig);
    vi.mocked(StorachaClient.prototype.getGatewayUrl).mockReturnValue(mockConfig.gatewayUrl);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    const schema = z.object({
      file: z.string()
        .refine((str) => Buffer.from(str, 'base64').toString('base64') === str, 'Invalid base64 string'),
      name: z.string().optional(),
      type: z.string().optional(),
      delegation: z.string().optional(),
      gatewayUrl: z.string().optional()
    });

    it('should validate valid base64 input', () => {
      const validBase64 = Buffer.from('test').toString('base64');
      expect(schema.safeParse({ file: validBase64 }).success).toBe(true);
    });

    it('should reject invalid base64 input', () => {
      expect(schema.safeParse({ file: 'not-base64!' }).success).toBe(false);
    });

    it('should reject malformed base64 input', () => {
      expect(schema.safeParse({ file: 'invalid=base64' }).success).toBe(false);
    });

    it('should reject non-base64 characters', () => {
      expect(schema.safeParse({ file: 'test@#$%' }).success).toBe(false);
    });

    it('should accept empty string as valid base64', () => {
      expect(schema.safeParse({ file: '' }).success).toBe(true);
    });

    it('should reject base64 with invalid padding', () => {
      expect(schema.safeParse({ file: 'test=' }).success).toBe(false);
    });

    it('should accept optional parameters', () => {
      const input = {
        file: Buffer.from('test').toString('base64'),
        name: 'test.txt',
        type: 'text/plain',
        delegation: 'test-delegation',
        gatewayUrl: 'https://custom-gateway.url'
      };
      expect(schema.safeParse(input).success).toBe(true);
    });
  });

  describe('file handling', () => {
    it('should handle base64 string input', async () => {
      const testData = 'dGVzdCBkYXRh'; // base64 encoded "test data"
      const input = {
        file: testData,
        name: 'test.txt'
      };

      await uploadTool.handler(input, {});

      expect(StorachaClient.prototype.uploadFiles).toHaveBeenCalledWith([{
        name: 'test.txt',
        content: testData,
        type: 'text/plain'
      }], {
        retries: 3,
        publishToIPFS: undefined
      });
    });

    it('should handle IPFS publishing when publishToIPFS is true', async () => {
      const testData = 'dGVzdCBkYXRh';
      const input = {
        file: testData,
        name: 'test.txt',
        publishToIPFS: true
      };
      const mockPieceHasher = { hash: vi.fn() };
      await uploadTool.handler(input, { pieceHasher: mockPieceHasher });

      expect(StorachaClient.prototype.uploadFiles).toHaveBeenCalledWith([{
        name: 'test.txt',
        content: testData,
        type: 'text/plain'
      }], {
        publishToIPFS: true,
        retries: 3
      });
    });

    it('should not use pieceHasher when publishToIPFS is false', async () => {
      const testData = 'dGVzdCBkYXRh';
      const input = {
        file: testData,
        name: 'test.txt',
        publishToIPFS: false
      };
      const mockPieceHasher = { hash: vi.fn() };
      await uploadTool.handler(input, { pieceHasher: mockPieceHasher });

      expect(StorachaClient.prototype.uploadFiles).toHaveBeenCalledWith([{
        name: 'test.txt',
        content: testData,
        type: 'text/plain'
      }], {
        publishToIPFS: false,
        retries: 3
      });
    });

    it('should handle base64 string input with detected MIME type', async () => {
      const input = {
        file: 'dGVzdCBkYXRh',
        name: 'test.json'
      };

      await uploadTool.handler(input, {});

      expect(StorachaClient.prototype.uploadFiles).toHaveBeenCalledWith([{
        name: 'test.json',
        content: 'dGVzdCBkYXRh',
        type: 'application/json'
      }], {
        retries: 3,
        publishToIPFS: undefined
      });
    });

    it('should use correct MIME type for known extensions', async () => {
      const input = {
        file: 'dGVzdCBkYXRh',
        name: 'test.xyz'
      };

      await uploadTool.handler(input, {});

      expect(StorachaClient.prototype.uploadFiles).toHaveBeenCalledWith([{
        name: 'test.xyz',
        content: 'dGVzdCBkYXRh',
        type: 'chemical/x-xyz'
      }], {
        retries: 3,
        publishToIPFS: undefined
      });
    });

    it('should use provided type over detected type', async () => {
      const input = {
        file: 'dGVzdCBkYXRh',
        name: 'test.json',
        type: 'text/plain'
      };

      await uploadTool.handler(input, {});

      expect(StorachaClient.prototype.uploadFiles).toHaveBeenCalledWith([{
        name: 'test.json',
        content: 'dGVzdCBkYXRh',
        type: 'text/plain'
      }], {
        retries: 3,
        publishToIPFS: undefined
      });
    });
  });

  describe('configuration', () => {
    it('should use custom delegation if provided', async () => {
      const testData = 'test data';
      const input = {
        file: testData,
        name: 'test.txt',
        delegation: 'custom-delegation'
      };

      await uploadTool.handler(input, {});

      expect(StorachaClient).toHaveBeenCalledWith({
        privateKey: mockConfig.privateKey,
        delegation: 'custom-delegation',
        gatewayUrl: mockConfig.gatewayUrl
      });
    });

    it('should use custom gateway URL if provided', async () => {
      const testData = 'test data';
      const input = {
        file: testData,
        name: 'test.txt',
        gatewayUrl: 'https://custom-gateway.url'
      };

      await uploadTool.handler(input, {});

      expect(StorachaClient).toHaveBeenCalledWith({
        privateKey: mockConfig.privateKey,
        delegation: mockConfig.delegation,
        gatewayUrl: 'https://custom-gateway.url'
      });
    });

    it('should use custom file name and type if provided', async () => {
      const input = {
        file: 'dGVzdA==',
        name: 'custom-name.txt',
        type: 'text/plain'
      };

      await uploadTool.handler(input, {});

      expect(StorachaClient.prototype.uploadFiles).toHaveBeenCalledWith([{
        name: 'custom-name.txt',
        content: 'dGVzdA==',
        type: 'text/plain'
      }], {
        retries: 3
      });
    });
  });

  describe('error handling', () => {
    it('should handle missing delegation error', async () => {
      // Mock config with no delegation
      vi.mocked(loadConfig).mockReturnValue({
        privateKey: 'test-private-key',
        delegation: undefined,
        gatewayUrl: 'https://test-gateway.url'
      });

      const testData = 'test data';
      const input = { 
        file: testData,
        name: 'test.txt'
      };

      const result = await uploadTool.handler(input, {});

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Upload failed: Delegation is required. Please provide it either in the request or via the DELEGATION environment variable.',
          error: true
        }]
      });
    });

    it('should handle Error instances during upload', async () => {
      const mockError = new Error('Upload failed');
      vi.mocked(StorachaClient.prototype.uploadFiles).mockRejectedValue(mockError);

      const testData = 'test data';
      const input = { 
        file: testData,
        name: 'test.txt'
      };

      const result = await uploadTool.handler(input, {});

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Upload failed: Upload failed',
          error: true
        }]
      });
    });

    it('should handle non-Error objects during upload', async () => {
      vi.mocked(StorachaClient.prototype.uploadFiles).mockRejectedValue('Unknown error object');

      const testData = 'test data';
      const input = { 
        file: testData,
        name: 'test.txt'
      };

      const result = await uploadTool.handler(input, {});

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Upload failed: Unknown error',
          error: true
        }]
      });
    });

    it('should handle initialization errors', async () => {
      const mockError = new Error('Initialization failed');
      vi.mocked(StorachaClient.prototype.initialize).mockRejectedValue(mockError);

      const testData = 'test data';
      const input = { 
        file: testData,
        name: 'test.txt'
      };

      const result = await uploadTool.handler(input, {});

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