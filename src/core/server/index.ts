import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools/index.js';
import { startStdioTransport } from './transports/stdio.js';
import { startSSETransport } from './transports/sse.js';
import { McpServerConfig } from './types.js';
import { loadConfig as loadStorageConfig } from '../storage/config.js';
/**
 * Creates the MCP Storage Server.
 * Registers all resources, tools, and prompts.
 * The server is started in the transport mode specified in the MCP_TRANSPORT_MODE environment variable.
 *
 * @returns {Promise<McpServer>} The MCP server instance
 */
async function startMCPServer(mcpConfig: McpServerConfig) {
  try {
    // Create a new MCP server instance
    const server = new McpServer({
      name: 'Storage MCP Server',
      version: '1.0.0',
      description: 'MCP server with file storage capabilities',
    });
    // Register all resources, tools, and prompts
    // registerResources(server);
    const storageConfig = await loadStorageConfig();
    registerTools(server, storageConfig);
    // registerPrompts(server);

    console.error(`Starting MCP Server in ${mcpConfig.transportMode} mode...`);
    if (mcpConfig.transportMode === 'sse') {
      await startSSETransport(server, mcpConfig);
    } else {
      await startStdioTransport(server, mcpConfig);
    }
    console.error('MCP Server initialized. Server is ready to handle requests');

    return server;
  } catch (error) {
    throw new Error(
      `Failed to initialize storage server: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error }
    );
  }
}

export default startMCPServer;
