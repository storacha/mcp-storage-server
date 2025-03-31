import express from "express";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpServerConfig } from "../types.js";

/**
 * SSE transport enables server-to-client streaming with HTTP POST requests for client-to-server communication.
 * 
 * Useful when you need:
 * - Web browser access to the storage server
 * - Real-time updates for file operations
 * - Remote access from different machines
 * - Integration with web applications
 * - Scalable deployment options
 *
 * See https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse for more information.
 * 
 * @param mcpServer - The MCP server instance
 * @returns The MCP server and transport instance
 */
export const startSSETransport = async (mcpServer: McpServer, config: McpServerConfig) => {
  const app = express();
  const router = express.Router();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Content-Type', 'Access-Control-Allow-Origin']
  }));

  // Add OPTIONS handling for preflight requests
  app.options('*', cors());

  // Keep track of active connections with session IDs
  const connections = new Map<string, SSEServerTransport>();

  // SSE endpoint
  // @ts-ignore
  app.get("/sse", async (req, res) => {
    console.error(`Received SSE connection request from ${req.ip}`);
    console.error(`Query parameters: ${JSON.stringify(req.query)}`);

    if (!mcpServer) {
      console.error("Server not initialized yet, rejecting SSE connection");
      return res.status(503).send("Server not initialized");
    }

    // Generate a unique session ID if one is not provided

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    // Create transport - handle before writing to response
    try {
      
      const transport = new SSEServerTransport("/messages", res);
      connections.set(transport.sessionId, transport);
      console.error(`Creating SSE transport for session: ${transport.sessionId}`);      // Create and store the transport keyed by session ID


      // Handle connection close
      req.on("close", () => {
        console.error(`SSE connection closed for session: ${transport.sessionId}`);
        connections.delete(transport.sessionId);
      });

      // Connect transport to server - this must happen before sending any data
      mcpServer.connect(transport).then(() => {
        console.error(`SSE connection established for session: ${transport.sessionId}`);

        // Send a valid JSON-RPC notification
        // We'll use the 'system.notify' method to inform the client about the session
        const jsonRpcNotification = {
          jsonrpc: "2.0",
          method: "system.notify",
          params: {
            event: "session_init",
            sessionId: transport.sessionId
          }
        };

        res.write(`data: ${JSON.stringify(jsonRpcNotification)}\n\n`);
      }).catch((error: Error) => {
        console.error(`Error connecting transport to server: ${error}`);
        connections.delete(transport.sessionId);
      });
    } catch (error) {
      console.error(`Error creating SSE transport: ${error}`);
      res.status(500).send(`Internal server error: ${error}`);
    }
  });

  // Message handling endpoint
  // @ts-ignore
  app.post("/messages", async (req, res) => {
    // Extract the session ID from the URL query parameters
    let sessionId = req.query.sessionId?.toString();

    console.error(`Received message for sessionId ${sessionId}`);
    console.error(`Message body: ${JSON.stringify(req.body)}`);

    if (!mcpServer) {
      console.error("Server not initialized yet");
      return res.status(503).json({
        jsonrpc: "2.0",
        id: req.body?.id,
        error: {
          code: -32000,
          message: "Server not initialized"
        }
      });
    }

    if (!sessionId) {
      // Try to extract session ID from the request body if it's a custom message
      if (req.body?.params?.sessionId) {
        sessionId = req.body.params.sessionId;
        console.error(`Using session ID from request body: ${sessionId}`);
      }
      
      if (!sessionId) {
        console.error("No session ID provided and multiple connections exist");
        return res.status(400).json({
          jsonrpc: "2.0",
          id: req.body?.id,
          error: {
            code: -32602,
            message: "No session ID provided. Please provide a sessionId query parameter or connect to /sse first."
          }
        });
      }
    }

    const transport = connections.get(sessionId);
    if (!transport) {
      console.error(`Session not found: ${sessionId}`);
      return res.status(404).json({
        jsonrpc: "2.0",
        id: req.body?.id,
        error: {
          code: -32000,
          message: "Session not found"
        }
      });
    }

    console.error(`Handling message for session: ${sessionId}`);
    try {
      await transport.handlePostMessage(req, res).catch((error: Error) => {
        console.error(`Error handling post message: ${error}`);
        res.status(500).json({
          jsonrpc: "2.0",
          id: req.body?.id,
          error: {
            code: -32000,
            message: `Internal server error: ${error.message}`
          }
        });
      });
    } catch (error) {
      console.error(`Exception handling post message: ${error}`);
      res.status(500).json({
        jsonrpc: "2.0",
        id: req.body?.id,
        error: {
          code: -32000,
          message: `Internal server error: ${error}`
        }
      });
    }
  });

  // Add a simple health check endpoint - required by MCP
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      server: mcpServer ? "initialized" : "initializing",
      activeConnections: connections.size,
      connectedSessionIds: Array.from(connections.keys())
    });
  });

  // Add a root endpoint for basic info
  app.get("/", (req, res) => {
    res.status(200).json({
      name: "MCP Server",
      version: "1.0.0",
      endpoints: {
        sse: "/sse",
        messages: "/messages",
        health: "/health"
      },
      status: mcpServer ? "ready" : "initializing",
      activeConnections: connections.size
    });
  });

  // Use the router
  app.use(router);

  // Start the HTTP server
  const httpServer = app.listen(config.port, () => {
    console.error(`MCP SSE Server running on http://${config.host}:${config.port}/sse`);
  });

  // Set server timeout
  httpServer.timeout = config.connectionTimeoutMs;

  return httpServer;
}; 