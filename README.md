# Storacha MCP Storage Server

A Model Context Protocol (MCP) server implementation for Storacha storage, enabling AI applications to interact with decentralized storage through a standardized interface.

## Features

- **File Operations**
  - Upload files to Storacha's decentralized storage network
  - Retrieve files via Storacha's HTTP gateway
- **Identity Management**
  - Get the DID key of the Storacha agent
- **Dual Transport Modes**
  - HTTP with Server-Sent Events (SSE) for real-time communication
  - Stdio transport for local integrations
- **Standardized Interface**
  - MCP-compliant API for tool discovery and invocation
  - JSON-RPC message handling
- **Security**
  - Bearer Token
  - CORS configuration
  - Input validation
  - Secure error handling

## Usa Cases

- **Document Storage & Analysis**: Securely upload and retrieve Blob documents.
- **Long-term Structured Data Storage**: Maintain structured data storage optimized for longevity and accessibility.
- **Data Sharing Between Agents and Systems**: Easily share data across multiple agents and diverse systems using **CIDs (Content Identifiers)**, enabling decentralized, verifiable, and efficient data exchange.
- **Application Integration**: Seamlessly integrate Storacha storage retrieval into applications via the Model Context Protocol.
- **AI Model Development**: Support AI models by providing reliable access to external datasets stored in Storacha.
- **LLM Integration**: Enhance large language models (LLMs) by connecting directly with Storacha Storage for seamless data access.
- **Web Application Backups**: Reliably store backup copies of web applications for disaster recovery.
- **Machine Learning Datasets**: Efficiently manage and access large datasets used in machine learning workflows.

## Installation

1. Clone the repository

   ```bash
   git clone https://github.com/storacha/mcp-storage-server.git
   cd mcp-storage-server
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Create a `.env` file

   ```bash
   cp .env.example .env
   ```

4. Configure the server using the following environment variables

   ```env
   # MCP Server Configuration
   MCP_SERVER_PORT=3001                # Optional: The port the server will listen on (default: 3001)
   MCP_SERVER_HOST=0.0.0.0             # Optional: The host address to bind to (default: 0.0.0.0)
   MCP_CONNECTION_TIMEOUT=30000        # Optional: The connection timeout in milliseconds (default: 30000)
   MCP_TRANSPORT_MODE=stdio            # Optional: The transport mode to use (stdio or sse) (default: stdio)

   # Security
   SHARED_ACCESS_TOKEN=                # Optional: Set this to require authentication for uploads

   # Storage Client Configuration
   PRIVATE_KEY=                        # Required: The Storacha Agent private key that is authorized to upload files
   DELEGATION=                         # Optional: The base64 encoded delegation that authorizes the Agent owner of the private key to upload files. If not set, MUST be provided for each upload request.
   GATEWAY_URL=https://storacha.link   # Optional: Custom gateway URL for file retrieval (default: https://storacha.link)

   # File Limits
   MAX_FILE_SIZE=104857600             # Optional: Maximum file size in bytes (default: 100MB)
   ```

### Starting the Server

Option 1 - Run the Stdio Server (recommended for local server communication)

```bash
pnpm start:stdio
```

Option 2 - Run the SSE Server (recommended for remote server communication)

```bash
pnpm start:sse
```

## MCP Client Integration (stdio mode)

##### Connect to the MCP Server

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Create the transport for communication
const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js'],
  env: {
    ...loadEnvVars(),
    MCP_TRANSPORT_MODE: 'stdio',
  },
});

// Instantiate the MCP client
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
await client.connect(transport);
```

##### List Tools

```typescript
const response = await client.listTools();
console.log(response.tools.map(tool => tool.name));
// output: ['identity', 'retrieve', 'upload']
```

##### Get the Agent's DID Key

```typescript
// Get the agent's DID key
const response = await client.callTool({
  name: 'identity',
  arguments: {}, // Send an empty object
});
console.log('Agent DID:', JSON.parse(response.content[0].text));
// output:  {"id":"did:key:z6MkjiNpY1QhuULQUkF5thrDbVz2fZwg49zYMg4a7zY1KDr9"}
```

##### Upload a file

```typescript
// Upload a file to the storage space defined in the delegation set in the MCP Server
const fileBuffer = new Uint8Array([1, 2, 3]);
const base64File = Buffer.from(fileBuffer).toString('base64');
const result = await client.invoke('upload', {
  file: base64File,
  name: 'example.txt',
  type: 'text/plain',
});
// output: {"root":"bafk...123","rootURL":"https://storacha.link/ipfs/bafk...123","files":[{"name":"test.txt","type":"text/plain","url":"https://storacha.link/ipfs/bafk...123/test.txt"}]}
```

##### Upload a file using a custom delegation

```typescript
// Upload a file to the storage space defined in the delegation set in the upload request
const result = await client.invoke('upload', {
  file: base64File,
  name: 'example.txt',
  type: 'text/plain',
  delegation: base64Delegation,
});
```

_Read the [step-by-step guide](https://docs.storacha.network/concepts/ucan/#step-by-step-delegation-with-w3cli) to learn how to create a delegation using the CLI._

## Testing with MCP Inspector

The MCP Inspector provides a visual interface for testing and debugging MCP servers. To test the Storacha MCP server:

1. Start the MCP Inspector

```bash
pnpm inspect:stdio
```

2. Start the Storacha MCP server

```bash
pnpm start:stdio
```

3. Connect to your server
   - Open the Browser and access the Inspector UI at http://localhost:5173/#tools
   - Enter the server URL (e.g., `http://localhost:3001`)
   - The Inspector will automatically discover available tools
   - You can test the upload and retrieve tools directly from the interface

### Debugging Tips

- Check the server logs for connection issues
- Verify environment variables are set correctly
- Ensure the server is running in SSE or Stdio mode for Inspector compatibility

## Development

### Project Structure

```
/
├── src/
│   ├── core/
│   │   ├── server/
│   │   │   ├── index.ts           # Main server entry point
│   │   │   ├── config.ts          # Server configuration
│   │   │   ├── types.ts           # TypeScript type definitions
│   │   │   ├── tools/             # MCP tools implementation
│   │   │   │   ├── index.ts       # Tool registration
│   │   │   │   ├── upload.ts      # Upload tool
│   │   │   │   ├── retrieve.ts    # Retrieve tool
│   │   │   │   └── identity.ts    # Identity tool
│   │   │   └── transports/        # Transport implementations
│   │   │       ├── sse.ts         # SSE transport
│   │   │       └── stdio.ts       # Stdio transport
│   │   └── storage/               # Storage client implementation
│   │       ├── client.ts          # Storage client
│   │       ├── config.ts          # Storage configuration
│   │       ├── types.ts           # Storage types
│   │       └── utils.ts           # Storage utilities
├── test/
│   ├── core/
│   │   ├── server/
│   │   │   ├── config.test.ts     # Configuration tests
│   │   │   ├── index.test.ts      # Server tests
│   │   │   ├── tools/             # Tool tests
│   │   │   └── transports/        # Transport tests
│   │   └── storage/               # Storage tests
│   ├── integration/               # Integration tests
│   └── setup.ts                   # Test setup
├── .env.example                   # Example environment variables
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── .husky/                        # Git hooks
│   └── pre-commit                 # Pre-commit hook
├── package.json                   # Project dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Project documentation
```

### Building

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT or Apache 2 License

## Support

For support, please visit [Storacha Support](https://storacha.network) or open an issue in this repository.
