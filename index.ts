#!/usr/bin/env node

import 'dotenv/config';
import startMCPServer from './src/core/server/index.js';
import { loadConfig } from './src/core/server/config.js';
/**
 * Main entry point for the MCP Storage Server.
 * Server mode is determined by the MCP_TRANSPORT_MODE environment variable:
 * - 'stdio': Starts the server in stdio mode (default)
 * - 'http': Starts the server in HTTP mode with SSE transport
 */
async function main() {
  try {
    const config = loadConfig();
    await startMCPServer(config);
  } catch (error) {
    console.error("Error starting MCP Storage Server:", error);
    process.exit(1);
  }
}

main();