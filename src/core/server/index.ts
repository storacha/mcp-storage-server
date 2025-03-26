import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools/index.js";
import { startStdioTransport } from "./transports/stdio.js";
import { startSSETransport } from "./transports/sse.js";
import { loadConfig } from "./config.js";

/**
 * Creates the MCP Storage Server.
 * Registers all resources, tools, and prompts.
 * The server is started in the transport mode specified in the MCP_TRANSPORT_MODE environment variable.
 * 
 * @returns {Promise<McpServer>} The MCP server instance
 */
async function startMCPServer() {
  try {

    // Create a new MCP server instance
    const server = new McpServer({
      name: "Storage MCP Server",
      version: "1.0.0",
      description: "MCP server with file storage capabilities",
    });

    // Register all resources, tools, and prompts
    // registerResources(server);
    registerTools(server);
    // registerPrompts(server);

    // Log server information
    console.error(`MCP Server initialized`);
    console.error("Server is ready to handle requests");

    const config = loadConfig();
    if (config.transportMode === 'sse') {
      await startSSETransport(server, config);
    } else {
      await startStdioTransport(server, config);
    }

    return server;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

export default startMCPServer; 
