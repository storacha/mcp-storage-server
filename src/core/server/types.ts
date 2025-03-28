
/**
 * Configuration for the MCP server
 */
export interface McpServerConfig {
  /** Connection timeout in milliseconds */
  connectionTimeoutMs: number;
  /** Transport mode */
  transportMode: 'stdio' | 'sse';
  /** Port number */
  port: number;
  /** Host name */ 
  host: string;
}