import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpServerConfig } from '../types.js';

/**
 * Connect the MCP server to the stdio transport.
 * The stdio transport enables communication through standard input and output streams.
 * This is particularly useful for local integrations and command-line tools.
 * Especially with LLM models, this is actually preferred for security and performance reasons.
 *
 * Advantage of using stdio transport:
 * - No network setup required
 * - Simple for local tools and CLI applications
 * - Direct process-to-process communication
 * - Lower latency for local operations
 * - No need for complex HTTP/WebSocket handling
 *
 * See https://modelcontextprotocol.io/docs/concepts/transports#standard-input%2Foutput-stdio for more information.
 *
 * @param mcpServer - The MCP server instance
 * @returns The MCP server and transport instance
 */
export const startStdioTransport = async (mcpServer: McpServer, config: McpServerConfig) => {
  try {
    // Set timeouts on stdin and stdout
    process.stdin.setTimeout(config.connectionTimeoutMs);
    process.stdout.setTimeout(config.connectionTimeoutMs);

    // Create StdIO transport
    const transport = new StdioServerTransport();

    console.error('Starting MCP server in stdio mode...');

    // Connect transport to MCP server
    await mcpServer.connect(transport);

    console.error('MCP server running in stdio mode');

    return { mcpServer, transport };
  } catch (error) {
    throw new Error(
      `Starting stdio server: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
};
