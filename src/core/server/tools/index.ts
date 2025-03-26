import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { uploadTool } from "./upload.js";

export const registerTools = (server: McpServer) => {
  server.tool(
    uploadTool.name,
    uploadTool.description,
    uploadTool.inputSchema.shape,
    uploadTool.handler
  );
};
