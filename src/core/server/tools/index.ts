import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { helloTool } from "./hello.js";
import { uploadTool } from "./upload.js";

export const registerTools = (server: McpServer) => {
  server.tool(
    helloTool.name,
    helloTool.description,
    helloTool.inputSchema.shape,
    helloTool.handler
  );

  server.tool(
    uploadTool.name,
    uploadTool.description,
    uploadTool.inputSchema.shape,
    uploadTool.handler
  );
};
