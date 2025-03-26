import 'dotenv/config';
import { McpServerConfig } from './types.js';

export const loadConfig = (): McpServerConfig => {
  return {
    connectionTimeout: parseInt(process.env.MCP_CONNECTION_TIMEOUT || '30000'),
    transportMode: process.env.MCP_TRANSPORT_MODE as 'stdio' | 'sse',
    port: parseInt(process.env.MCP_SERVER_PORT || '3001', 10),
    host: process.env.MCP_SERVER_HOST || 'localhost',
  };
};