#!/usr/bin/env node

import 'dotenv/config';
// import { startStdioServer } from './src/stdio-server.js';
import { startSSEServer } from './src/sse-server.js';

/**
 * Main entry point for the MCP Storage Server.
 * Server mode is determined by the NODE_ENV environment variable:
 * - 'stdio': Starts the server in stdio mode (default)
 * - 'http': Starts the server in HTTP mode with SSE transport
 */
async function main() {
  try {
    // Determine server mode from environment variable
    // const serverMode = process.env.NODE_ENV || 'stdio';
    await startSSEServer();
    // if (serverMode === 'http') {
    //   // Start HTTP server with SSE transport
    //   await startSSEServer();
    //   console.error('MCP server started in HTTP mode');
    // } else {
    //   // Start server in stdio mode (default)
    //   await startStdioServer();
    //   console.error('MCP server started in stdio mode');
    // }
  } catch (error) {
    console.error('Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the server
main().catch(error => {
  console.error('Uncaught error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}); 