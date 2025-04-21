import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { startSSETransport } from '../../../../../src/core/server/transports/sse.js';
import { McpServerConfig } from '../../../../../src/core/server/types.js';

// Mock dependencies
vi.mock('express');
vi.mock('@modelcontextprotocol/sdk/server/sse.js');
vi.mock('@modelcontextprotocol/sdk/server/mcp.js');

describe('SSE Transport', () => {
  let mockApp: any;
  let mockRouter: any;
  let mockServer: any;
  let mockConfig: McpServerConfig;
  let mockHttpServer: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mock express app
    mockApp = {
      use: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      options: vi.fn(),
      listen: vi.fn(),
    };

    // Setup mock router
    mockRouter = {
      use: vi.fn(),
    };

    // Setup mock server
    mockServer = {
      connect: vi.fn(),
    };

    // Setup mock config
    mockConfig = {
      host: 'localhost',
      port: 3000,
      connectionTimeoutMs: 5000,
      transportMode: 'sse',
      maxFileSizeBytes: 1024 * 1024 * 10, // 10MB
    };

    // Setup mock http server
    mockHttpServer = {
      timeout: 0,
    };

    // Mock express() to return our mock app
    (express as any).mockReturnValue(mockApp);
    (express.Router as any).mockReturnValue(mockRouter);

    // Mock app.listen to return our mock http server
    mockApp.listen.mockReturnValue(mockHttpServer);
  });

  it('should initialize SSE transport with correct configuration', async () => {
    await startSSETransport(mockServer, mockConfig);

    // Verify express app was created
    expect(express).toHaveBeenCalled();

    // Verify CORS middleware was added
    expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));

    // Verify endpoints were registered
    expect(mockApp.get).toHaveBeenCalledWith('/sse', expect.any(Function));
    expect(mockApp.post).toHaveBeenCalledWith('/messages', expect.any(Function));
    expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
    expect(mockApp.get).toHaveBeenCalledWith('/', expect.any(Function));

    // Verify server was started with correct config
    expect(mockApp.listen).toHaveBeenCalledWith(mockConfig.port, expect.any(Function));

    // Verify timeout was set
    expect(mockHttpServer.timeout).toBe(mockConfig.connectionTimeoutMs);
  });

  it('should handle SSE connection requests correctly', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const mockRequest = {
      ip: '127.0.0.1',
      query: {},
      on: vi.fn(),
    };

    // Get the SSE endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const sseHandler = mockApp.get.mock.calls.find(
      (call: [string, Function]) => call[0] === '/sse'
    )[1];

    // Mock successful connection
    mockServer.connect.mockResolvedValue(undefined);

    // Call the handler
    await sseHandler(mockRequest, mockResponse);

    // Verify headers were set correctly
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-transform');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');

    // Verify transport was created and connected
    expect(SSEServerTransport).toHaveBeenCalledWith('/messages', mockResponse);
    expect(mockServer.connect).toHaveBeenCalled();
  });

  it('should handle message requests correctly', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockRequest = {
      query: { sessionId: 'test-session' },
      body: { id: 1, method: 'test' },
    };

    // Get the messages endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const messageHandler = mockApp.post.mock.calls.find(
      (call: [string, Function]) => call[0] === '/messages'
    )[1];

    // Call the handler
    await messageHandler(mockRequest, mockResponse);
  });

  it('should handle health check requests', async () => {
    const mockResponse = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    // Get the health endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const healthHandler = mockApp.get.mock.calls.find(
      (call: [string, Function]) => call[0] === '/health'
    )[1];

    // Call the handler
    healthHandler({}, mockResponse);

    // Verify health check response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        server: 'initialized',
      })
    );
  });

  it('should handle root endpoint requests', async () => {
    const mockResponse = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    // Get the root endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const rootHandler = mockApp.get.mock.calls.find(
      (call: [string, Function]) => call[0] === '/'
    )[1];

    // Call the handler
    rootHandler({}, mockResponse);

    // Verify root endpoint response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'MCP Server',
        version: '1.0.0',
        endpoints: {
          sse: '/sse',
          messages: '/messages',
          health: '/health',
        },
      })
    );
  });

  it('should handle server not initialized during SSE connection', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const mockRequest = {
      ip: '127.0.0.1',
      query: {},
    };

    // Set server to null to simulate uninitialized state
    const nullServer = null;
    await startSSETransport(nullServer as any, mockConfig);
    const sseHandler = mockApp.get.mock.calls.find(
      (call: [string, Function]) => call[0] === '/sse'
    )[1];

    await sseHandler(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(503);
    expect(mockResponse.send).toHaveBeenCalledWith('Server not initialized');
  });

  it('should handle transport creation error', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const mockRequest = {
      ip: '127.0.0.1',
      query: {},
      on: vi.fn(),
    };

    // Mock SSEServerTransport to throw an error
    (SSEServerTransport as any).mockImplementation(() => {
      throw new Error('Transport creation failed');
    });

    // Get the SSE endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const sseHandler = mockApp.get.mock.calls.find(
      (call: [string, Function]) => call[0] === '/sse'
    )[1];

    // Call the handler
    await sseHandler(mockRequest, mockResponse);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.stringContaining('Transport creation failed')
    );
  });

  it('should handle transport connection error', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const mockRequest = {
      ip: '127.0.0.1',
      query: {},
      on: vi.fn(),
    };

    // Mock transport
    const mockTransport = {
      sessionId: 'test-session',
    };
    (SSEServerTransport as any).mockReturnValue(mockTransport);

    // Mock server.connect to reject
    mockServer.connect.mockRejectedValue(new Error('Connection failed'));

    // Get the SSE endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const sseHandler = mockApp.get.mock.calls.find(
      (call: [string, Function]) => call[0] === '/sse'
    )[1];

    // Call the handler and wait for the error to be logged
    await sseHandler(mockRequest, mockResponse);
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for the next tick

    // Verify error was logged
    const errorCalls = (console.error as any).mock.calls;
    expect(errorCalls[errorCalls.length - 1][0]).toContain('Error creating SSE transport');
  });

  it('should handle connection close', async () => {
    const mockRes = {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === 'close') {
          callback();
        }
      }),
    };

    const mockRequest = {
      ip: '127.0.0.1',
      query: {},
      on: vi.fn(),
    };

    // Setup mock transport with session ID
    const mockTransport = {
      sessionId: 'test-session',
      handlePostMessage: vi.fn().mockRejectedValue(new Error('Session not found')),
    };
    (SSEServerTransport as any).mockImplementation(() => mockTransport);

    await startSSETransport(mockServer, mockConfig);
    const sseHandler = mockApp.get.mock.calls.find((call: any[]) => call[0] === '/sse')[1];

    await sseHandler(mockRequest, mockRes);

    // Verify connection was removed (indirectly through subsequent message handling)
    const mockMessageRequest = {
      query: { sessionId: 'test-session' },
      body: { id: 1, method: 'test' },
    };

    const messageHandler = mockApp.post.mock.calls.find(
      (call: any[]) => call[0] === '/messages'
    )[1];
    await messageHandler(mockMessageRequest, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: -32000,
          message: expect.stringContaining('Session not found'),
        }),
      })
    );
  });

  it('should handle missing session ID with multiple connections', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockRequest = {
      query: {},
      body: { id: 1, method: 'test' },
    };

    // Get the messages endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const messageHandler = mockApp.post.mock.calls.find(
      (call: [string, Function]) => call[0] === '/messages'
    )[1];

    // Mock multiple connections
    const mockTransport1 = { sessionId: 'session1' };
    const mockTransport2 = { sessionId: 'session2' };
    const connections = new Map();
    connections.set('session1', mockTransport1);
    connections.set('session2', mockTransport2);

    // Call the handler
    await messageHandler(mockRequest, mockResponse);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: -32602,
          message: expect.stringContaining('No session ID provided'),
        }),
      })
    );
  });

  it('should handle session ID from request body params', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockRequest = {
      query: {},
      body: {
        id: 1,
        method: 'test',
        params: { sessionId: 'test-session' },
      },
    };

    // Get the messages endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const messageHandler = mockApp.post.mock.calls.find(
      (call: [string, Function]) => call[0] === '/messages'
    )[1];

    // Call the handler
    await messageHandler(mockRequest, mockResponse);
  });

  it('should handle single connection fallback', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockRequest = {
      query: {},
      body: { id: 1, method: 'test' },
    };

    // Get the messages endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const messageHandler = mockApp.post.mock.calls.find(
      (call: [string, Function]) => call[0] === '/messages'
    )[1];

    // Mock single connection
    const mockTransport = { sessionId: 'single-session' };
    const connections = new Map();
    connections.set('single-session', mockTransport);

    // Call the handler
    await messageHandler(mockRequest, mockResponse);
  });

  it('should handle session not found error', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockRequest = {
      query: { sessionId: 'non-existent-session' },
      body: { id: 1, method: 'test' },
    };

    // Get the messages endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const messageHandler = mockApp.post.mock.calls.find(
      (call: [string, Function]) => call[0] === '/messages'
    )[1];

    // Call the handler
    await messageHandler(mockRequest, mockResponse);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Session not found',
        }),
      })
    );
  });

  it('should handle connection close events', async () => {
    const mockRes = {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === 'close') {
          callback();
        }
      }),
    };

    const mockRequest = {
      ip: '127.0.0.1',
      query: {},
      on: vi.fn(),
    };

    // Get the SSE endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const sseCall = mockApp.get.mock.calls.find((call: any[]) => call[0] === '/sse');
    if (!sseCall) {
      throw new Error('SSE handler not found');
    }
    const sseHandler = sseCall[1];

    // Mock successful connection
    mockServer.connect.mockResolvedValue(undefined);

    // Call the handler
    await sseHandler(mockRequest, mockRes);

    // Verify close event handler was registered
    expect(mockRequest.on).toHaveBeenCalledWith('close', expect.any(Function));

    // Get the close handler
    const closeCall = mockRequest.on.mock.calls.find((call: any[]) => call[0] === 'close');
    if (!closeCall) {
      throw new Error('Close handler not found');
    }
    const closeHandler = closeCall[1];

    // Call the close handler
    closeHandler();

    // Verify connection was cleaned up
    // Note: This would need access to the connections Map to verify
    // You might need to modify the implementation to expose this for testing
  });

  it('should handle OPTIONS preflight requests', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      end: vi.fn(),
      getHeader: vi.fn(),
    };

    const mockRequest = {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'content-type',
      },
    };

    await startSSETransport(mockServer, mockConfig);

    // Get the OPTIONS handler
    const optionsHandler = mockApp.options.mock.calls[0][1];
    optionsHandler(mockRequest, mockResponse);

    // Verify CORS headers were set
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      'GET,HEAD,PUT,PATCH,POST,DELETE'
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'content-type'
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Vary', 'Access-Control-Request-Headers');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Length', '0');
  });

  it('should handle message processing errors', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockRequest = {
      query: { sessionId: 'test-session' },
      body: { id: 1, method: 'test' },
    };

    // Setup mock transport with error handling
    const mockTransport = {
      sessionId: 'test-session',
      handlePostMessage: vi.fn().mockRejectedValue(new Error('Message processing failed')),
    };

    // Mock SSEServerTransport to return our mock transport
    (SSEServerTransport as any).mockImplementation(() => mockTransport);

    // Start the transport and create a connection
    await startSSETransport(mockServer, mockConfig);

    // Create a connection first
    const sseHandler = mockApp.get.mock.calls.find((call: any[]) => call[0] === '/sse')?.[1];
    if (!sseHandler) {
      throw new Error('SSE handler not found');
    }

    const sseResponse = {
      setHeader: vi.fn(),
      write: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const sseRequest = {
      ip: '127.0.0.1',
      query: {},
      on: vi.fn(),
    };

    // Create the connection
    await sseHandler(sseRequest, sseResponse);

    // Get the message handler
    const messageHandler = mockApp.post.mock.calls.find(
      (call: any[]) => call[0] === '/messages'
    )?.[1];
    if (!messageHandler) {
      throw new Error('Message handler not found');
    }

    // Handle the message
    await messageHandler(mockRequest, mockResponse);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringContaining('Message processing failed'),
        }),
      })
    );
  });

  it('should configure CORS middleware correctly', async () => {
    await startSSETransport(mockServer, mockConfig);

    // Verify CORS middleware was configured correctly
    expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));

    // Verify OPTIONS handling was configured
    expect(mockApp.options).toHaveBeenCalledWith('*', expect.any(Function));

    // Get the CORS middleware configuration
    const corsConfig = mockApp.use.mock.calls[0][0];
    expect(corsConfig).toBeDefined();
  });

  it('should handle server not initialized during message handling', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockRequest = {
      query: { sessionId: 'test-session' },
      body: { id: 1, method: 'test' },
    };

    // Set server to null to simulate uninitialized state
    const nullServer = null;
    await startSSETransport(nullServer as any, mockConfig);
    const messageHandler = mockApp.post.mock.calls.find(
      (call: [string, Function]) => call[0] === '/messages'
    )[1];

    // Call the handler
    await messageHandler(mockRequest, mockResponse);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(503);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonrpc: '2.0',
        error: expect.objectContaining({
          code: -32000,
          message: 'Server not initialized',
        }),
      })
    );
  });

  it('should handle SSE connection write errors', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn().mockImplementation(() => {
        throw new Error('Write failed');
      }),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const mockRequest = {
      ip: '127.0.0.1',
      query: {},
      on: vi.fn(),
    };

    // Setup mock transport
    const mockTransport = {
      sessionId: 'test-session',
    };
    (SSEServerTransport as any).mockImplementation(() => mockTransport);

    // Mock successful connection
    mockServer.connect.mockResolvedValue(undefined);

    // Get the SSE endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const sseHandler = mockApp.get.mock.calls.find((call: any[]) => call[0] === '/sse')?.[1];
    if (!sseHandler) {
      throw new Error('SSE handler not found');
    }

    // Call the handler
    await sseHandler(mockRequest, mockResponse);

    // Wait for the next tick to allow error to be logged
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify error was logged
    const errorCalls = (console.error as any).mock.calls;
    const hasWriteError = errorCalls.some(
      (call: any[]) => call[0] && call[0].includes && call[0].includes('Write failed')
    );
    expect(hasWriteError).toBe(true);
  });

  it('should handle SSE connection with invalid session notification', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const mockRequest = {
      ip: '127.0.0.1',
      query: {},
      on: vi.fn(),
    };

    // Setup mock transport with invalid session
    const mockTransport = {
      sessionId: undefined, // Invalid session ID
    };
    (SSEServerTransport as any).mockImplementation(() => mockTransport);

    // Mock connection to reject
    mockServer.connect.mockRejectedValue(new Error('Invalid session'));

    // Get the SSE endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const sseHandler = mockApp.get.mock.calls.find((call: any[]) => call[0] === '/sse')?.[1];
    if (!sseHandler) {
      throw new Error('SSE handler not found');
    }

    // Call the handler
    await sseHandler(mockRequest, mockResponse);

    // Wait for the next tick to allow error to be logged
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify error was logged
    const errorCalls = (console.error as any).mock.calls;
    const hasConnectionError = errorCalls.some(
      (call: any[]) =>
        call[0] && call[0].includes && call[0].includes('Error creating SSE transport')
    );
    expect(hasConnectionError).toBe(true);
  });

  it('should handle SSE connection with malformed notification', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      write: vi.fn().mockImplementation(() => {
        throw new Error('JSON stringify failed');
      }),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const mockRequest = {
      ip: '127.0.0.1',
      query: {},
      on: vi.fn(),
    };

    // Setup mock transport that will cause JSON.stringify to throw
    const mockTransport = {
      sessionId: 'test-session',
      toJSON: () => {
        throw new Error('JSON stringify failed');
      },
    };
    (SSEServerTransport as any).mockImplementation(() => mockTransport);

    // Mock successful connection
    mockServer.connect.mockResolvedValue(undefined);

    // Get the SSE endpoint handler
    await startSSETransport(mockServer, mockConfig);
    const sseHandler = mockApp.get.mock.calls.find((call: any[]) => call[0] === '/sse')?.[1];
    if (!sseHandler) {
      throw new Error('SSE handler not found');
    }

    // Call the handler
    await sseHandler(mockRequest, mockResponse);

    // Wait for the next tick to allow error to be logged
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify error was logged
    const errorCalls = (console.error as any).mock.calls;
    const hasJsonError = errorCalls.some(
      (call: any[]) =>
        call[0] && call[0].includes && call[0].includes('Error creating SSE transport')
    );
    expect(hasJsonError).toBe(true);
  });

  it('should handle malformed message requests', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockRequest = {
      query: { sessionId: 'test-session' },
      body: null, // Invalid body
    };

    // Setup mock transport
    const mockTransport = {
      sessionId: 'test-session',
      handlePostMessage: vi.fn().mockRejectedValue(new Error('Malformed message')),
    };
    (SSEServerTransport as any).mockImplementation(() => mockTransport);

    // Start the transport and create a connection
    await startSSETransport(mockServer, mockConfig);

    // Create a connection first
    const sseHandler = mockApp.get.mock.calls.find((call: any[]) => call[0] === '/sse')?.[1];
    if (!sseHandler) {
      throw new Error('SSE handler not found');
    }

    await sseHandler(
      { ip: '127.0.0.1', query: {}, on: vi.fn() },
      { setHeader: vi.fn(), write: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() }
    );

    // Get the message handler
    const messageHandler = mockApp.post.mock.calls.find(
      (call: any[]) => call[0] === '/messages'
    )?.[1];
    if (!messageHandler) {
      throw new Error('Message handler not found');
    }

    // Handle the message
    await messageHandler(mockRequest, mockResponse);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: -32000,
          message: expect.stringContaining('Internal server error'),
        }),
      })
    );
  });

  it('should handle message requests with invalid JSON-RPC format', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockRequest = {
      query: { sessionId: 'test-session' },
      body: {
        // Missing required JSON-RPC fields
        foo: 'bar',
      },
    };

    // Setup mock transport
    const mockTransport = {
      sessionId: 'test-session',
      handlePostMessage: vi.fn().mockRejectedValue(new Error('Invalid JSON-RPC request')),
    };
    (SSEServerTransport as any).mockImplementation(() => mockTransport);

    // Start the transport and create a connection
    await startSSETransport(mockServer, mockConfig);

    // Create a connection first
    const sseHandler = mockApp.get.mock.calls.find((call: any[]) => call[0] === '/sse')?.[1];
    if (!sseHandler) {
      throw new Error('SSE handler not found');
    }

    await sseHandler(
      { ip: '127.0.0.1', query: {}, on: vi.fn() },
      { setHeader: vi.fn(), write: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() }
    );

    // Get the message handler
    const messageHandler = mockApp.post.mock.calls.find(
      (call: any[]) => call[0] === '/messages'
    )?.[1];
    if (!messageHandler) {
      throw new Error('Message handler not found');
    }

    // Handle the message
    await messageHandler(mockRequest, mockResponse);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: -32000,
          message: expect.stringContaining('Internal server error'),
        }),
      })
    );
  });

  it('should handle message requests with synchronous errors', async () => {
    const mockResponse = {
      setHeader: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    const mockRequest = {
      query: { sessionId: 'test-session' },
      body: { id: 1, method: 'test' },
    };

    // Setup mock transport that throws synchronously
    const mockTransport = {
      sessionId: 'test-session',
      handlePostMessage: vi.fn().mockImplementation(() => {
        throw new Error('Synchronous error');
      }),
    };
    (SSEServerTransport as any).mockImplementation(() => mockTransport);

    // Start the transport and create a connection
    await startSSETransport(mockServer, mockConfig);

    // Create a connection first
    const sseHandler = mockApp.get.mock.calls.find((call: any[]) => call[0] === '/sse')?.[1];
    if (!sseHandler) {
      throw new Error('SSE handler not found');
    }

    await sseHandler(
      { ip: '127.0.0.1', query: {}, on: vi.fn() },
      { setHeader: vi.fn(), write: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() }
    );

    // Get the message handler
    const messageHandler = mockApp.post.mock.calls.find(
      (call: any[]) => call[0] === '/messages'
    )?.[1];
    if (!messageHandler) {
      throw new Error('Message handler not found');
    }

    // Handle the message
    await messageHandler(mockRequest, mockResponse);

    // Verify error response
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringContaining('Synchronous error'),
        }),
      })
    );
  });

  it('should handle server initialization errors', async () => {
    // Mock app.listen to throw an error
    mockApp.listen.mockImplementation(() => {
      throw new Error('Server initialization failed');
    });

    try {
      await startSSETransport(mockServer, mockConfig);
      expect.fail('Expected server initialization to fail');
    } catch (error: any) {
      expect(error.message).toContain('Server initialization failed');
    }
  });

  it('should handle server initialization with custom host', async () => {
    const customConfig = {
      ...mockConfig,
      host: '127.0.0.1',
      port: 3001,
    };

    // Mock console.error
    const mockError = vi.spyOn(console, 'error');

    // Mock app.listen to call the callback
    mockApp.listen.mockImplementation((port: number, callback: () => void) => {
      callback();
      return mockHttpServer;
    });

    await startSSETransport(mockServer, customConfig);

    // Verify server initialization was logged
    expect(mockError).toHaveBeenCalledWith(
      `MCP SSE Server running on http://${customConfig.host}:${customConfig.port}/sse`
    );

    // Clean up
    mockError.mockRestore();
  });

  it('should handle server initialization with custom timeout', async () => {
    // Setup config with custom timeout
    const customConfig = {
      ...mockConfig,
      connectionTimeoutMs: 10000,
    };

    await startSSETransport(mockServer, customConfig);

    // Verify timeout was set correctly
    expect(mockHttpServer.timeout).toBe(customConfig.connectionTimeoutMs);
  });
});
