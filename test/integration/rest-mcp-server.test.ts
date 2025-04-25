import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestEnv, TEST_FILEPATH } from './test-config.js';
import fetch from 'node-fetch';
import { spawn, ChildProcess } from 'child_process';

// Skip tests if running in CI environment
// These tests require specific environment configuration and external services
// that might not be available in CI environments
const isCI = process.env.CI === 'true';
(isCI ? describe.skip : describe)('MCP Server REST Integration Tests', () => {
  let testFileContent: string;
  let testFileBase64: string = '';
  console.log('testFileBase64', testFileBase64);
  let serverProcess: ChildProcess;
  let baseUrl: string;
  const PORT = 3001; // Specific port for REST tests

  // Helper function to wait for a specified time
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper function to send POST requests to the server
  const post = async (url: string, body: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: body.id,
        method: body.method,
        params: body.params,
      }),
    });
    return response;
  };

  // Helper function to check if server is ready using POST
  const isServerReady = async (url: string) => {
    try {
      // Use a JSON-RPC initialize to check if the server is alive
      const requestBody = {
        id: 'test',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test',
            version: '1.0.0',
          },
        },
      };

      const response = await post(url, requestBody);
      let responseText;
      try {
        responseText = await response.text();
        console.log(`Raw response: ${responseText}`);
      } catch (err) {
        console.log(`Error reading response text: ${err}`);
      }

      const data = responseText ? JSON.parse(responseText) : null;
      console.log('Server response:', JSON.stringify(data));
      return data?.result && data.result.serverInfo;
    } catch (error: any) {
      console.log(`Server check failed: ${error.message}`);
      if (error.cause) {
        console.log(`Cause: ${error.cause}`);
      }
      return false;
    }
  };

  // Create a test file in memory and start server
  beforeAll(async () => {
    console.log('Starting REST integration test setup');

    // Create an in-memory test file
    testFileContent = 'This is a test file for upload';
    testFileBase64 = Buffer.from(testFileContent).toString('base64');

    // Set up environment variables for the server
    const env = {
      ...process.env,
      ...getTestEnv(),
      NODE_ENV: 'development',
      MCP_TRANSPORT_MODE: 'rest', // Use REST mode
      MCP_SERVER_PORT: PORT.toString(),
    };

    console.log(
      'Starting server with env:',
      JSON.stringify({
        NODE_ENV: env.NODE_ENV,
        MCP_TRANSPORT_MODE: env.MCP_TRANSPORT_MODE,
        MCP_SERVER_PORT: env.MCP_SERVER_PORT,
        PRIVATE_KEY: env.PRIVATE_KEY ? 'set' : 'not set',
        DELEGATION: env.DELEGATION ? 'set' : 'not set',
      })
    );

    // Start the server as a separate process
    serverProcess = spawn('node', ['dist/index.js'], {
      env,
      stdio: 'pipe',
    });

    // Add listeners for server process output
    serverProcess.stdout?.on('data', data => {
      console.log(`Server stdout: ${data}`);
    });

    serverProcess.stderr?.on('data', data => {
      console.log(`Server stderr: ${data}`);
    });

    serverProcess.on('error', error => {
      console.error(`Server process error: ${error.message}`);
    });

    // Wait for the server to start with retries
    baseUrl = `http://localhost:${PORT}/rest`;
    const maxRetries = 5;
    let retries = 0;
    let ready = false;

    console.log(`Waiting for server to start at ${baseUrl}...`);

    await wait(2000);

    // Then check with retries
    while (!ready && retries < maxRetries) {
      console.log(`Checking if server is ready (attempt ${retries + 1}/${maxRetries})...`);
      ready = await isServerReady(baseUrl);

      if (!ready) {
        console.log(`Server not ready yet, waiting...`);
        await wait(1000);
        retries++;
      }
    }

    if (!ready) {
      throw new Error(`Server failed to start after ${maxRetries} attempts`);
    }

    console.log('REST Server is ready for tests');
  }, 60000);

  afterAll(async () => {
    console.log('Cleaning up after tests');
    if (serverProcess) {
      console.log('Terminating server process');
      serverProcess.kill();
    }
  });

  it('should list available tools', async () => {
    console.log('Testing: list available tools');
    const response = await post(baseUrl, {
      id: 'test',
      method: 'tools/list',
      params: {},
    });

    expect(response.status).toBe(200);

    // Get the response body
    const responseText = await response.text();
    console.log('Tools response text:', responseText);

    const data = JSON.parse(responseText);

    // Verify the response has the expected structure
    expect(data).toHaveProperty('result');
    expect(data.result).toHaveProperty('tools');
    expect(Array.isArray(data.result.tools)).toBe(true);

    // Check for the expected tools
    const tools = data.result.tools || [];
    expect(tools.some((tool: { name: string }) => tool.name === 'identity')).toBe(true);
    expect(tools.some((tool: { name: string }) => tool.name === 'upload')).toBe(true);
    expect(tools.some((tool: { name: string }) => tool.name === 'retrieve')).toBe(true);
  });

  it('should get identity information', async () => {
    console.log('Testing: get identity information');
    const response = await post(baseUrl, {
      id: 'test',
      method: 'tools/call',
      params: {
        name: 'identity',
        arguments: {
          random_string: 'random', // Dummy parameter
        },
      },
    });

    expect(response.status).toBe(200);

    // Get the response body
    const responseText = await response.text();
    console.log('Identity response text:', responseText);

    const data = JSON.parse(responseText);

    // Verify the response has the expected structure
    expect(data).toHaveProperty('result');
    expect(data.result).toHaveProperty('content');
    expect(Array.isArray(data.result.content)).toBe(true);
    expect(data.result.content.length).toBeGreaterThan(0);

    // Get the tool result content
    const content = data.result.content[0];
    expect(content).toHaveProperty('type');
    expect(content).toHaveProperty('text');

    // Parse the text content and verify it's the identity info
    const identityInfo = JSON.parse(content.text);
    expect(identityInfo).toHaveProperty('id');
    expect(identityInfo.id).toContain('did:key:');
  });

  it('should upload a file', async () => {
    console.log('Testing: upload a file');
    const response = await post(baseUrl, {
      id: 'test',
      method: 'tools/call',
      params: {
        name: 'upload',
        arguments: {
          file: testFileBase64, // Send as base64 string
          name: 'test-file.txt',
        },
      },
    });

    expect(response.status).toBe(200);

    // Get the response body
    const responseText = await response.text();
    console.log('Upload response text:', responseText);

    const data = JSON.parse(responseText);

    // Verify the response has the expected structure
    expect(data).toHaveProperty('result');
    expect(data.result).toHaveProperty('content');
    expect(Array.isArray(data.result.content)).toBe(true);
    expect(data.result.content.length).toBeGreaterThan(0);

    // Get the content
    const content = data.result.content[0];
    expect(content).toHaveProperty('type');
    expect(content).toHaveProperty('text');

    // Parse the text content and verify it's the upload result
    const uploadResult = JSON.parse(content.text);
    expect(uploadResult).toHaveProperty('root');
    expect(uploadResult.root).toBeDefined();
    expect(uploadResult).toHaveProperty('url');
    expect(uploadResult).toHaveProperty('files');

    // Test that files is an object with at least one entry
    expect(typeof uploadResult.files).toBe('object');
    expect(uploadResult.files).not.toBeNull();

    // Get the first file entry
    const fileEntries = Object.entries(uploadResult.files);
    expect(fileEntries.length).toBeGreaterThan(0);
    expect(fileEntries[0]).toBeDefined();
  }, 30000); // Increase the timeout for upload test

  it('should retrieve a file', async () => {
    console.log('Testing: retrieve a file');
    const response = await post(baseUrl, {
      id: 'test',
      method: 'tools/call',
      params: {
        name: 'retrieve',
        arguments: {
          filepath: TEST_FILEPATH,
        },
      },
    });

    expect(response.status).toBe(200);

    // Get the response body
    const responseText = await response.text();
    console.log('Retrieve response text:', responseText);

    const data = JSON.parse(responseText);

    // Verify the response has the expected structure
    expect(data).toHaveProperty('result');
    expect(data.result).toHaveProperty('content');
    expect(Array.isArray(data.result.content)).toBe(true);
    expect(data.result.content.length).toBeGreaterThan(0);

    // Get the content
    const content = data.result.content[0];
    expect(content).toHaveProperty('type');
    expect(content).toHaveProperty('text');

    // Just verify we have content
    expect(content.text).toBeTruthy();
  }, 30000);

  it('should handle invalid upload parameters', async () => {
    console.log('Testing: invalid upload parameters');
    const response = await post(baseUrl, {
      id: 'test',
      method: 'tools/call',
      params: {
        name: 'upload',
        arguments: {
          // Missing required parameters
        },
      },
    });

    // For invalid parameters, we expect an error response with error details
    const responseText = await response.text();
    console.log('Invalid upload response text:', responseText);

    const data = JSON.parse(responseText);
    expect(data).toHaveProperty('error');
  });

  it('should handle invalid retrieve parameters', async () => {
    console.log('Testing: invalid retrieve parameters');
    const response = await post(baseUrl, {
      id: 'test',
      method: 'tools/call',
      params: {
        name: 'retrieve',
        arguments: {
          filepath: 'invalid-cid', // Missing the required filename structure
        },
      },
    });

    // For invalid parameters, we expect a response with an error content
    const responseText = await response.text();
    console.log('Invalid retrieve response text:', responseText);

    const data = JSON.parse(responseText);

    // Retrieve tool returns error as part of content
    expect(data).toHaveProperty('result');
    expect(data.result).toHaveProperty('content');
    expect(data.result.content[0]).toHaveProperty('error', true);
  });
});
