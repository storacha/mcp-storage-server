import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./tools/index.js";

/**
 * Creates the MCP Storage Server.
 * Registers all resources, tools, and prompts.
 * 
 * @returns {Promise<McpServer>} The MCP server instance
 */
async function createMCPServer() {
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

    return server;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

export default createMCPServer; 
