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
  /** Maximum file size in bytes */
  maxFileSizeBytes: number;
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
  // @eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: (input: z.AnyZodObject) => Promise<{
    content: { type: string; text: string; error?: boolean }[];
  }>;
}
