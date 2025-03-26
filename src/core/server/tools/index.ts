import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { uploadTool } from "./upload.js";
import { retrieveTool } from "./retrieve.js";
export const registerTools = (server: McpServer) => {
  server.tool(
    uploadTool.name,
    uploadTool.description,
    uploadTool.inputSchema.shape,
    uploadTool.handler
  );
  server.tool(
    retrieveTool.name,
    retrieveTool.description,
    retrieveTool.inputSchema.shape,
    retrieveTool.handler
  );
};
