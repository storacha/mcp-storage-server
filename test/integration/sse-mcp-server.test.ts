import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { TEST_CID, getTestEnv } from './test-config.js';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const TEST_PORT = 3001;
const TEST_HOST = 'localhost';

// Skip tests if running in CI environment
// These tests require specific environment configuration and external services
// that might not be available in CI environments
const isCI = process.env.CI === 'true';
(isCI ? describe.skip : describe)('MCP Server SSE Integration Tests', () => {
  let client: Client;
  let tempFilePath: string;
  let serverProcess: any;
  let clientTransport: SSEClientTransport;

  // Create a temporary test file and start server
  beforeAll(async () => {
    // Create a temporary file for testing
    tempFilePath = path.join(__dirname, 'test-file.txt');
    await fs.writeFile(tempFilePath, 'This is a test file for upload');

    // Start the server in SSE mode
    const { spawn } = await import('child_process');
    serverProcess = spawn('node', ['dist/index.js'], {
      env: {
        ...getTestEnv(),
        MCP_TRANSPORT_MODE: 'sse', // Set SSE mode
        PORT: TEST_PORT.toString(), // Set port for SSE server
      },
      stdio: 'pipe',
    });

    // Log server output for debugging
    serverProcess.stdout.on('data', (data: Buffer) => {
      console.log(`Server stdout: ${data.toString()}`);
    });

    serverProcess.stderr.on('data', (data: Buffer) => {
      console.error(`Server stderr: ${data.toString()}`);
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create client that connects to server in SSE mode
    clientTransport = new SSEClientTransport(new URL(`http://${TEST_HOST}:${TEST_PORT}/sse`));

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
        type: 'text/plain',
      },
    });

    // Type assertion for upload response
    const uploadContent = (uploadResponse.content as Array<{ type: string; text: string }>)[0];
    expect(uploadContent).toHaveProperty('text');

    // Parse upload response
    const uploadResult = JSON.parse(uploadContent.text);
    expect(uploadResult).toHaveProperty('root');
    expect(typeof uploadResult.root).toBe('string');
    expect(uploadResult).toHaveProperty('rootURL');
    expect(uploadResult).toHaveProperty('files');
    expect(Array.isArray(uploadResult.files)).toBe(true);
    expect(uploadResult.files.length).toBeGreaterThan(0);
    expect(uploadResult.files[0]).toHaveProperty('name');
    expect(uploadResult.files[0]).toHaveProperty('type');
    expect(uploadResult.files[0]).toHaveProperty('url');
  }, 30_000); // Increase the timeout for upload test

  // Skip retrieve test in normal test runs as it requires external services
  it.skip('should retrieve a file', async () => {
    // Use the test CID from our config
    const testCid = TEST_CID;

    const retrieveResponse = await client.callTool({
      name: 'retrieve',
      arguments: {
        root: testCid,
      },
    });

    // Type assertion for retrieve response
    const retrieveContent = (retrieveResponse.content as Array<{ type: string; text: string }>)[0];
    expect(retrieveContent).toHaveProperty('text');

    // Parse retrieve response
    // const retrieveResult = JSON.parse(retrieveContent.text);
    // FIXME: Add assertions for the retrieve result
  }, 10000);

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
    // Try retrieving with an invalid CID
    try {
      await client.callTool({
        name: 'retrieve',
        arguments: {
          root: 'invalid-cid',
        },
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
