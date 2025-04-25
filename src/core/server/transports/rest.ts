import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpServerConfig } from '../types.js';
import { RestServerTransport } from '@chatmcp/sdk/server/rest.js';

/**
 * Connect the MCP server to the REST transport.
 * The REST transport enables communication through HTTP REST API endpoints.
 * This is particularly useful for remote integrations and web applications.
 *
 * Advantages of using REST transport:
 * - Network-accessible API endpoints
 * - Standard HTTP/HTTPS protocol
 * - Support for concurrent requests
 * - Easy integration with web services
 * - Compatible with various client implementations
 *
 * See https://docs.mcp.so/server-hosting for more information.
 *
 * @param mcpServer - The MCP server instance
 * @param config - The MCP server configuration
 * @returns The MCP server and transport instance
 */
export const startRestTransport = async (mcpServer: McpServer, config: McpServerConfig) => {
  try {
    const transport = new RestServerTransport({
      port: config.port,
      endpoint: config.endpoint,
    });

    await mcpServer.connect(transport);

    await transport.startServer();

    return { mcpServer, transport };
  } catch (error) {
    throw new Error(
      `Starting REST server: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
};
