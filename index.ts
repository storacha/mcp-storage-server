#!/usr/bin/env node

import 'dotenv/config';
import createMCPServer from './src/core/server/index.js';
import { startSSETransport } from './src/core/server/transports/sse.js';
import { startStdioTransport } from './src/core/server/transports/stdio.js';

/**
 * Main entry point for the MCP Storage Server.
 * Server mode is determined by the NODE_ENV environment variable:
 * - 'stdio': Starts the server in stdio mode (default)
 * - 'http': Starts the server in HTTP mode with SSE transport
 */
async function main() {
  try {
    const mcpServer = await createMCPServer();
    if (process.env.NODE_ENV === 'http') {
      await startSSETransport(mcpServer);
    } else {
      await startStdioTransport(mcpServer);
    }
  } catch (error) {
    console.error("Error starting MCP Storage Server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 