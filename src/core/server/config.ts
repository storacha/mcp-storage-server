import 'dotenv/config';
import { McpServerConfig } from './types.js';
// Required for REST transport mode in MCP.so Cloud
import { getParamValue } from '@chatmcp/sdk/utils/index.js';

export const loadConfig = (): McpServerConfig => {
  const port = parseInt(getParamValue('port') || process.env.MCP_SERVER_PORT || '3001', 10);
  const host = process.env.MCP_SERVER_HOST?.trim() || '0.0.0.0';
  const connectionTimeoutMs = parseInt(process.env.MCP_CONNECTION_TIMEOUT || '30000', 10);
  const transportMode =
    getParamValue('transportMode') || process.env.MCP_TRANSPORT_MODE?.trim() || 'stdio';
  const maxFileSizeBytes = parseInt(process.env.MAX_FILE_SIZE || '104857600', 10);
  const endpoint = getParamValue('endpoint') || process.env.MCP_ENDPOINT?.trim() || '/rest';

  if (isNaN(port) || port < 0 || port > 65535) {
    throw new Error('Invalid port number');
  }

  if (isNaN(connectionTimeoutMs) || connectionTimeoutMs < 0) {
    throw new Error('Invalid connection timeout');
  }

  if (transportMode !== 'stdio' && transportMode !== 'sse' && transportMode !== 'rest') {
    throw new Error('Invalid transport mode');
  }

  if (isNaN(maxFileSizeBytes) || maxFileSizeBytes < 0) {
    throw new Error('Invalid max file size');
  }

  return {
    port,
    host,
    connectionTimeoutMs,
    transportMode: transportMode as 'stdio' | 'sse' | 'rest',
    maxFileSizeBytes,
    endpoint: endpoint || '/',
  };
};
