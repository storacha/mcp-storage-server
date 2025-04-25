import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startRestTransport } from '../../../../../src/core/server/transports/rest.js';
import { McpServerConfig } from '../../../../../src/core/server/types.js';
import { RestServerTransport } from '@chatmcp/sdk/server/rest.js';

// Mock dependencies
vi.mock('@chatmcp/sdk/server/rest.js');
vi.mock('@modelcontextprotocol/sdk/server/mcp.js');

describe('REST Transport', () => {
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
      transportMode: 'rest',
      maxFileSizeBytes: 1024 * 1024 * 10, // 10MB
      endpoint: '/rest',
    };

    // Setup mock transport
    mockTransport = {
      startServer: vi.fn().mockResolvedValue(undefined),
    };

    // Mock RestServerTransport constructor
    (RestServerTransport as any).mockImplementation(() => mockTransport);
  });

  it('should initialize REST transport with correct configuration', async () => {
    // Mock successful connection
    mockServer.connect.mockResolvedValue(undefined);

    const result = await startRestTransport(mockServer, mockConfig);

    // Verify transport was created with correct options
    expect(RestServerTransport).toHaveBeenCalledWith({
      port: mockConfig.port,
      endpoint: '/rest',
    });

    // Verify server was connected to transport
    expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);

    // Verify REST server was started
    expect(mockTransport.startServer).toHaveBeenCalled();

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
    await expect(startRestTransport(mockServer, mockConfig)).rejects.toThrow('Connection failed');
  });

  it('should handle server start errors gracefully', async () => {
    // Mock server start error
    const error = new Error('Server start failed');
    mockTransport.startServer.mockRejectedValue(error);

    // Verify error is thrown
    await expect(startRestTransport(mockServer, mockConfig)).rejects.toThrow('Server start failed');
  });
});
