import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startStdioTransport } from '../../../src/core/server/transports/stdio.js';
import { startSSETransport } from '../../../src/core/server/transports/sse.js';
import { McpServerConfig } from '../../../src/core/server/types.js';
import startMCPServer from '../../../src/core/server/index.js';
import { registerTools } from '../../../src/core/server/tools/index.js';

// Mock the transports
vi.mock('../../../src/core/server/transports/stdio.js', () => ({
  startStdioTransport: vi.fn().mockResolvedValue({ mcpServer: {}, transport: {} }),
}));

vi.mock('../../../src/core/server/transports/sse.js', () => ({
  startSSETransport: vi.fn().mockResolvedValue({}),
}));

// Mock the tools registration
vi.mock('../../../src/core/server/tools/index.js', () => ({
  registerTools: vi.fn(),
}));

// Mock the McpServer class
const mockTool = vi.fn();
const mockConnect = vi.fn();

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: vi.fn().mockImplementation(() => ({
      tool: mockTool,
      connect: mockConnect,
    })),
  };
});

describe('MCP Server', () => {
  const mockConfig: McpServerConfig = {
    port: 3001,
    host: 'localhost',
    connectionTimeoutMs: 30000,
    transportMode: 'stdio',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  it('should initialize server with stdio transport', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await startMCPServer(mockConfig);

    expect(registerTools).toHaveBeenCalled();
    expect(startStdioTransport).toHaveBeenCalled();
    expect(startSSETransport).not.toHaveBeenCalled();
  });

  it('should initialize server with SSE transport', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await startMCPServer({ ...mockConfig, transportMode: 'sse' });

    expect(registerTools).toHaveBeenCalled();
    expect(startSSETransport).toHaveBeenCalled();
    expect(startStdioTransport).not.toHaveBeenCalled();
  });

  it('should register tools on initialization', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await startMCPServer(mockConfig);

    expect(registerTools).toHaveBeenCalled();
  });

  it('should handle initialization errors', async () => {
    const mockError = new Error('Initialization failed');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    (startStdioTransport as any).mockRejectedValueOnce(mockError);

    await expect(startMCPServer(mockConfig)).rejects.toThrow(
      'Failed to initialize storage server: Initialization failed'
    );
  });

  it('should log server initialization', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await startMCPServer(mockConfig);

    expect(console.error).toHaveBeenCalledWith('Starting MCP Server in stdio mode...');
    expect(console.error).toHaveBeenCalledWith(
      'MCP Server initialized. Server is ready to handle requests'
    );
  });
});
