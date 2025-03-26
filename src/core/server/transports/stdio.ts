import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpServerConfig } from "../types.js";


/**
 * Connect the MCP server to the stdio transport.
 * The stdio transport enables communication through standard input and output streams. 
 * This is particularly useful for local integrations and command-line tools.
 * See https://modelcontextprotocol.io/docs/concepts/transports#standard-input%2Foutput-stdio for more information.
 * 
 * @param mcpServer - The MCP server instance
 * @returns The MCP server and transport instance
 */
export const startStdioTransport = async (mcpServer: McpServer, config: McpServerConfig) => {
  try {
    // Set timeouts on stdin and stdout
    process.stdin.setTimeout(config.connectionTimeout);
    process.stdout.setTimeout(config.connectionTimeout);
    
    // Create StdIO transport
    const transport = new StdioServerTransport();
    
    console.error("Starting MCP server in stdio mode...");
    
    // Connect transport to MCP server
    await mcpServer.connect(transport);
    
    console.error("MCP server running in stdio mode");
    
    return { mcpServer, transport };
  } catch (error) {
    console.error("Error starting stdio server:", error);
    throw error;
  }
}; 