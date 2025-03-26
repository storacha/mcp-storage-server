import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const server = new McpServer({
  name: "Storage MCP Server",
  version: "1.0.0",
  description: "MCP server with file storage capabilities",
});

server.tool(
  "hello",
  "Greet the user",
  {
    name: z.string().optional().describe("Name to greet"),
  },
  async (input) => {
    try {
      const name = input?.name || "world";
      return {
        content: [
          {
            type: "text",
            text: `Hello ${name}!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);
