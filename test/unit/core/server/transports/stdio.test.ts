import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { startStdioTransport } from '../../../../../src/core/server/transports/stdio.js';
import { McpServerConfig } from '../../../../../src/core/server/types.js';

// Mock dependencies
vi.mock('@modelcontextprotocol/sdk/server/stdio.js');
vi.mock('@modelcontextprotocol/sdk/server/mcp.js');

describe('Stdio Transport', () => {
  let mockServer: any;
  let mockConfig: McpServerConfig;
  let mockTransport: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock server
    mockServer = {
      connect: vi.fn(),
    };

    // Setup mock config
    mockConfig = {
      host: 'localhost',
      port: 3000,
      connectionTimeoutMs: 5000,
      transportMode: 'stdio',
      maxFileSizeBytes: 1024 * 1024 * 10, // 10MB
    };

    // Setup mock transport
    mockTransport = {
      // Add any methods that might be called on the transport
    };

    // Mock StdioServerTransport constructor
    (StdioServerTransport as any).mockImplementation(() => mockTransport);

    // Mock process.stdin and process.stdout
    (process.stdin as any).setTimeout = vi.fn();
    (process.stdout as any).setTimeout = vi.fn();
  });

  it('should initialize stdio transport with correct configuration', async () => {
    // Mock successful connection
    mockServer.connect.mockResolvedValue(undefined);

    const result = await startStdioTransport(mockServer, mockConfig);

    // Verify timeouts were set
    expect(process.stdin.setTimeout).toHaveBeenCalledWith(mockConfig.connectionTimeoutMs);
    expect(process.stdout.setTimeout).toHaveBeenCalledWith(mockConfig.connectionTimeoutMs);

    // Verify transport was created
    expect(StdioServerTransport).toHaveBeenCalled();

    // Verify server was connected to transport
    expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);

    // Verify return value
    expect(result).toEqual({
      mcpServer: mockServer,
      transport: mockTransport,
    });
  });

  it('should handle connection errors gracefully', async () => {
    // Mock connection error
    const error = new Error('Connection failed');
    mockServer.connect.mockRejectedValue(error);

    // Verify error is thrown
    await expect(startStdioTransport(mockServer, mockConfig)).rejects.toThrow('Connection failed');
  });

  it('should set correct timeouts on stdio streams', async () => {
    await startStdioTransport(mockServer, mockConfig);

    // Verify timeouts were set with correct values
    expect(process.stdin.setTimeout).toHaveBeenCalledWith(mockConfig.connectionTimeoutMs);
    expect(process.stdout.setTimeout).toHaveBeenCalledWith(mockConfig.connectionTimeoutMs);
  });
});
