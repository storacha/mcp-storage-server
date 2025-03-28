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
    DELEGATION=                         # Optional: The base64 encoded delegation that authorizes the Agent owner of the private key to upload files
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


## MCP Client Integration

```typescript
import { McpClient } from '@modelcontextprotocol/sdk/client';

const client = new McpClient({
  transport: 'sse',
  url: 'http://localhost:3000'
});

// Get the agent's DID key
const identity = await client.invoke('identity');
console.log('Agent DID:', JSON.parse(identity.content[0].text).did);

// Upload a file with delegation from request
const result = await client.invoke('upload', {
  file: fileBuffer,
  name: 'example.txt',
  type: 'text/plain',
  delegation: 'your-delegation-proof', // Optional: Provide delegation in the request
  publishToIPFS: true // Optional: Publish content to IPFS network (default: false)
});

// Upload a file using delegation from environment variable
const result = await client.invoke('upload', {
  file: fileBuffer,
  name: 'example.txt',
  type: 'text/plain'
});
```

## IPFS Publishing

The Storacha MCP Storage Server provides flexibility in how content is published and accessed:

- **Private Storage (Default)**: When `publishToIPFS` is set to `false` (default), content is stored only within the Storacha network. The content is accessible through its CID but remains private to the Storacha network.
  
- **Public IPFS Storage**: When `publishToIPFS` is set to `true`, the content is published to the IPFS network, making it publicly accessible to anyone with the CID. This is useful for:
  - Sharing content with the broader IPFS network
  - Ensuring content persistence across multiple IPFS nodes
  - Making content available through any IPFS gateway

Example of uploading with IPFS publishing:
```typescript
// Upload and publish to IPFS
const result = await client.invoke('upload', {
  file: fileBuffer,
  name: 'public-document.pdf',
  type: 'application/pdf',
  publishToIPFS: true
});

// The content will be available through both Storacha and IPFS networks
console.log('Content CID:', result.cid);
console.log('Storacha URL:', result.url);
```

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
│   │   └── server/
│   │       ├── index.ts           # Main server entry point
│   │       ├── config.ts          # Server configuration
│   │       ├── types.ts           # TypeScript type definitions
│   │       ├── tools/             # MCP tools implementation
│   │       │   ├── index.ts       # Tool registration
│   │       │   ├── upload.ts      # Upload tool
│   │       │   ├── retrieve.ts    # Retrieve tool
│   │       │   └── identity.ts    # Identity tool
│   │       └── transports/        # Transport implementations
│   │           ├── sse.ts         # SSE transport
│   │           └── stdio.ts       # Stdio transport
│   └── storage/                   # Storage client implementation
├── package.json
└── tsconfig.json
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

MIT and/or Apache 2 License

## Support

For support, please visit [Storacha Support](https://storacha.network) or open an issue in this repository.