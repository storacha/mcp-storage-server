import { z } from 'zod';

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

/**
 * MCP tool definition
 */
export interface McpTool {
  /** Name of the tool */
  name: string;
  /** Description of the tool */
  description: string;
  /** Input schema for the tool */
  inputSchema: z.ZodObject<any, any, any, any>;
  /** Handler function for the tool */
  handler: (input: any, extra: any) => Promise<{
    content: { type: string; text: string; error?: boolean }[];
  }>;
}
