import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server-logic.js";

// Start StdIO server
export const startStdioServer = async () => {
  try {
    // Create StdIO transport
    const transport = new StdioServerTransport();
    
    console.error("Starting MCP server in stdio mode...");
    
    // Connect transport to MCP server
    await server.connect(transport);
    
    console.error("MCP server running in stdio mode");
    
    return { server, transport };
  } catch (error) {
    console.error("Error starting stdio server:", error);
    throw error;
  }
}; 