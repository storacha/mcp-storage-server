# Storacha MCP Storage Server

A Model Context Protocol (MCP) server implementation for decentralized storage using the Storacha network. This server enables AI systems to store and retrieve files through a standardized interface.

## Features

- **MCP Compliance**: Implements the Model Context Protocol for standardized tool discovery and invocation
- **Decentralized Storage**: Uses Storacha network for reliable, decentralized file storage
- **HTTP Gateway**: Fast file retrieval through Storacha's HTTP gateway

## Prerequisites

- Node.js 18.x or later
- pnpm 9.x or later
- A Storacha private key and delegation for storage access

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/storacha/mcp-storage-server.git
   cd mcp-storage-server
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```env
   PORT=3000                      # Server port
   HOST=0.0.0.0                   # Server host
   SHARED_ACCESS_TOKEN=           # Optional access token
   PRIVATE_KEY=                   # Your Storacha private key
   DELEGATION=                    # Your storage delegation
   GATEWAY_URL=                   # Custom gateway URL (optional)
   MAX_FILE_SIZE=104857600        # Maximum file size (100MB)
   ```

## Development

Start the development server with automatic reloading:
```bash
pnpm dev
```

Build the project:
```bash
pnpm build
```

Run the production server:
```bash
pnpm start
```

Clean the build output:
```bash
pnpm clean
```

## API Endpoints

### MCP Discovery Document
```http
GET /.well-known/mcp.json
```
Returns the MCP discovery document describing available tools.

### MCP Tool Invocation
```http
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "callTool",
  "params": {
    "name": "upload",
    "input": {
      "file": "base64_encoded_file_data",
      "filename": "example.txt"
    }
  },
  "id": 1
}
```

### Health Check
```http
GET /health
```
Returns server health status.

## Available Tools

### Upload Tool
Uploads a file to the Storacha network.

**Input Schema:**
```typescript
{
  file: string;      // Base64 encoded file data
  filename: string;  // Original filename
  type?: string;     // MIME type (optional)
}
```

**Output Schema:**
```typescript
{
  cid: string;       // Content ID on Storacha network
  url: string;       // HTTP gateway URL for the file
}
```

### Retrieve Tool
Retrieves a file from the Storacha network.

**Input Schema:**
```typescript
{
  cid: string;       // Content ID to retrieve
}
```

**Output Schema:**
```typescript
{
  data: string;      // Base64 encoded file data
  type: string;      // MIME type of the file
}
```

## Architecture

The server uses a layered architecture.

**HTTP Layer** (Express)
   - Handles HTTP requests
   - Manages CORS and middleware
   - Routes requests to MCP server

**MCP Layer** (MCP Server)
   - Processes JSON-RPC messages
   - Manages tool registration and execution
   - Handles request validation

**Storage Layer** (Storage Client)
   - Interfaces with Storacha network
   - Manages file uploads and retrievals
   - Handles content addressing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT and/or Apache 2 License

## Support

For support, please visit [Storacha Support](https://storacha.network) or open an issue in this repository. 