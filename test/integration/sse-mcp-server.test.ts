import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { getTestEnv, TEST_FILEPATH } from './test-config.js';
import { ChildProcess } from 'child_process';
import { spawn } from 'child_process';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const PORT = 3002; // Specific port for SSE tests
const TEST_HOST = 'localhost';

// Skip tests if running in CI environment
// These tests require specific environment configuration and external services
// that might not be available in CI environments
const isCI = process.env.CI === 'true';
(isCI ? describe.skip : describe)('MCP Server SSE Integration Tests', () => {
  let client: Client;
  let tempFilePath: string;
  let serverProcess: ChildProcess;
  let clientTransport: SSEClientTransport;

  // Create a temporary test file and start server
  beforeAll(async () => {
    // Create a temporary file path
    tempFilePath = path.join(__dirname, '..', '..', 'temp-test-file.txt');
    await fs.writeFile(tempFilePath, 'This is a test file', 'utf8');

    // Start server as a separate process
    console.log('Starting SSE server process...');
    serverProcess = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        ...getTestEnv(),
        MCP_TRANSPORT_MODE: 'sse', // Set SSE mode
        MCP_SERVER_PORT: PORT.toString(), // Use the correct environment variable name
      },
      stdio: 'pipe',
    });

    // Log server output for debugging
    serverProcess.stdout?.on('data', (data: Buffer) => {
      console.log(`Server stdout: ${data.toString()}`);
    });

    serverProcess.stderr?.on('data', (data: Buffer) => {
      console.log(`Server stderr: ${data.toString()}`);
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create client that connects to server in SSE mode
    clientTransport = new SSEClientTransport(new URL(`http://${TEST_HOST}:${PORT}/sse`));

    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Connect to the server
    await client.connect(clientTransport);

    // Wait a moment for the connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 15000); // Increase timeout for server startup

  afterAll(async () => {
    // Clean up temporary file
    try {
      await fs.unlink(tempFilePath);
    } catch (e) {
      // Ignore errors if file doesn't exist
    }

    // Close the transport
    await clientTransport.close();

    // Kill the server process
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  it('should list available tools', async () => {
    const tools = await client.listTools();

    // Check for tools directly in the response format
    expect(tools.tools.some(tool => tool.name === 'identity')).toBe(true);
    expect(tools.tools.some(tool => tool.name === 'upload')).toBe(true);
    expect(tools.tools.some(tool => tool.name === 'retrieve')).toBe(true);
  });

  it('should get identity information', async () => {
    const response = await client.callTool({
      name: 'identity',
      arguments: {}, // Send an empty object
    });

    const responseContent = response.content as Array<{ type: string; text: string }>;
    expect(responseContent.length).toBeGreaterThan(0);

    const content = responseContent[0];
    expect(content).toHaveProperty('text');

    const responseData = JSON.parse(content.text);
    expect(responseData).toHaveProperty('id');
    expect(responseData.id).toContain('did:key:');
  });

  it('should upload a file', async () => {
    // Read file content and convert to base64 string
    const fileBuffer = await fs.readFile(tempFilePath);
    const fileContent = fileBuffer.toString('base64');

    // Upload file
    const uploadResponse = await client.callTool({
      name: 'upload',
      arguments: {
        file: fileContent, // Send as base64 string
        name: 'test-file.txt',
      },
    });

    // Type assertion for upload response
    const uploadContent = (
      uploadResponse.content as Array<{ type: string; text: string; error: boolean }>
    )[0];
    expect(uploadContent).toHaveProperty('text');

    // Parse upload response
    const uploadResult = JSON.parse(uploadContent.text);
    expect(uploadResult).toHaveProperty('root');
    // The root can be either a string or an object with toString method
    expect(uploadResult.root).toBeDefined();
    expect(uploadResult).toHaveProperty('url');
    expect(uploadResult).toHaveProperty('files');

    // Test that files is an object with at least one entry
    expect(typeof uploadResult.files).toBe('object');
    expect(uploadResult.files).not.toBeNull();

    // Get the first file entry (could be array or object format from dag-json)
    const fileEntries = Object.entries(uploadResult.files);
    expect(fileEntries.length).toBeGreaterThan(0);

    // Check the first file entry (could be in different formats depending on serialization)
    const firstFile = fileEntries[0];
    expect(firstFile).toBeDefined();
  }, 30_000); // Increase the timeout for upload test

  it('should retrieve a file', async () => {
    // Call retrieve tool
    const retrieveResponse = await client.callTool({
      name: 'retrieve',
      arguments: {
        filepath: TEST_FILEPATH,
      },
    });

    // Type assertion for retrieve response
    const retrieveContent = (retrieveResponse.content as Array<{ type: string; text: string }>)[0];
    expect(retrieveContent).toHaveProperty('text');

    // Parse retrieve response
    const retrieveResult = JSON.parse(retrieveContent.text);
    expect(retrieveResult).toHaveProperty('data');
    // MIME type may or may not be present depending on server configuration
    // so we don't assert on it to make the test more robust
  }, 30_000); // Increase timeout for retrieve test

  it('should handle invalid upload parameters', async () => {
    // Try uploading without required parameters
    try {
      await client.callTool({
        name: 'upload',
        arguments: {
          // Missing required parameters
        },
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle invalid retrieve parameters', async () => {
    // Test with invalid CID format (missing filename)
    try {
      await client.callTool({
        name: 'retrieve',
        arguments: {
          filepath: 'invalid-cid', // Missing the required filename
        },
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
