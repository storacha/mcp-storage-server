import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { uploadTool } from './upload.js';
import { retrieveTool } from './retrieve.js';
import { identityTool } from './identity.js';
import { StorageConfig } from 'src/core/storage/types.js';

export const registerTools = (server: McpServer, storageConfig: StorageConfig) => {
  const tools = [
    identityTool(storageConfig),
    retrieveTool(storageConfig),
    uploadTool(storageConfig),
  ];

  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.inputSchema.shape, tool.handler);
  }
};
