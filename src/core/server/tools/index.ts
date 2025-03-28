import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { uploadTool } from "./upload.js";
import { retrieveTool } from "./retrieve.js";
import { identityTool } from "./identity.js";

export const registerTools = (server: McpServer) => {
  for (const tool of [uploadTool, retrieveTool, identityTool]) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema.shape,
      tool.handler,
    );
  }
};
