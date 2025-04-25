# How to integrate with Storacha MCP Storage Server

## Start Your Server

You can run the MCP server in multiple different modes:

- **Local Communication**

```bash
pnpm start:stdio
```

- **Remote Communication (SSE)**

```bash
pnpm start:sse
```

- **Remote Communication (REST)**

```bash
pnpm start:rest
```

## Client Integrations

You can integrate your client with Storacha MCP Storage Server with any of the following patterns.

### SDK (stdio mode)

Uses standard I/O streams for local communication.

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

### SDK (sse mode)

Uses Express with SSE for HTTP-based communication.

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const transport = new SSEClientTransport(new URL(`http://${HOST}:${PORT}/sse`));

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

### SDK (rest mode)

Uses Express with REST for HTTP-based communication. This mode is compatible with MCP.so cloud hosting.

```typescript
import { fetch } from 'node-fetch';

// Make direct JSON-RPC requests to the REST endpoint
async function callTool(toolName, args) {
  const response = await fetch(`http://${HOST}:${PORT}/rest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'client-request',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  return await response.json();
}

// Example: Upload a file
const fileContent = Buffer.from('test content').toString('base64');
const result = await callTool('upload', {
  file: fileContent,
  name: 'test-file.txt',
});
```

### MCP Client Config

Most MCP clients store the configuration as JSON in the following format:

```jsonc
{
  "mcpServers": {
    "storacha-storage-server-stdio": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        // The server supports `stdio`, `sse`, and `rest` modes, the default is `stdio`.
        "MCP_TRANSPORT_MODE": "stdio",
        // The Storacha Agent private key that is authorized to store data into the Space.
        "PRIVATE_KEY": "<agent_private_key>",
        // The base64 encoded delegation that proves the Agent is allowed to store data. If not set, MUST be provided for each upload request.
        "DELEGATION": "<base64_delegation>",
      },
      "shell": true,
      "cwd": "./",
    },
  },
}
```

Replace `<agent_private_key>` and `<base64_delegation>` with your actual values.

### Docker

You can run the Storacha MCP Storage Server in a Docker container, which makes it easy to deploy across different environments without worrying about dependencies or configuration. It uses SSE mode by default but can be configured to use REST mode.

### Building the Docker Image

```bash
docker build -t storacha-mcp-server .
```

### Running the Server in SSE Mode

```bash
docker run -p 3000:3000 \
  -e PRIVATE_KEY="<agent_private_key>" \
  -e DELEGATION="<base64_delegation>" \
  -e MCP_TRANSPORT_MODE="sse" \
  -e MCP_SERVER_PORT="3001" \
  storacha-mcp-server
```

### Running the Server in REST Mode

```bash
docker run -p 3001:3001 \
  -e PRIVATE_KEY="<agent_private_key>" \
  -e DELEGATION="<base64_delegation>" \
  -e MCP_TRANSPORT_MODE="rest" \
  -e MCP_SERVER_PORT="3001" \
  storacha-mcp-server
```

Replace `<agent_private_key>` and `<base64_delegation>` with your actual values.

In case you want to keep the private key and delegation in a `.env` file, you can run the following:

```bash
source .env && docker run -p 3001:3001 \
  -e PRIVATE_KEY="$PRIVATE_KEY" \
  -e DELEGATION="$DELEGATION" \
  -e MCP_TRANSPORT_MODE=rest \
  -e MCP_SERVER_PORT=3001 \
  storacha-mcp-server
```

Test the REST connection:

```bash
curl -X POST http://127.0.0.1:3001/rest -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":"2","method":"tools/list"}' | jq
```

### Environment Variables

| Variable             | Description                                | Default   |
| -------------------- | ------------------------------------------ | --------- |
| `MCP_TRANSPORT_MODE` | Transport mode (`stdio`, `sse`, or `rest`) | `stdio`   |
| `MCP_SERVER_PORT`    | Port for SSE or REST mode                  | `3001`    |
| `MCP_SERVER_HOST`    | Host for SSE or REST mode                  | `0.0.0.0` |
| `PRIVATE_KEY`        | The Storacha Agent private key             | required  |
| `DELEGATION`         | Base64 encoded delegation                  | optional  |

### Docker Compose Example

```yaml
version: '3'
services:
  storacha-mcp:
    build:
      context: .
    ports:
      - '3001:3001'
    environment:
      - PRIVATE_KEY=<agent_private_key>
      - DELEGATION=<base64_delegation>
      - MCP_TRANSPORT_MODE=rest
      - MCP_SERVER_PORT=3001
```

### MCP Client Configuration for Docker SSE Mode

When using the Docker container in SSE mode, configure your MCP client to connect to the SSE endpoint.

For Cursor IDE or other MCP clients, you can use this configuration:

```jsonc
{
  "mcpServers": {
    "storacha-storage-server-sse": {
      "url": "http://localhost:3000/sse",
    },
  },
}
```

### MCP.so Cloud Hosting

The Storacha MCP Storage Server can be deployed to MCP.so cloud using the REST transport mode. This allows your server to be accessible from anywhere without having to manage your own infrastructure.

Find the Storacha MCP Storage Server on the [MCP Playground](https://mcp.so/playground?server=storacha-storage), set the Private Key and the Delegation, and you are ready to go.

For more details on hosting your MCP server on MCP.so, see the [official documentation](https://docs.mcp.so/server-hosting).

### Tools

#### List Tools

```typescript
const response = await client.listTools();
console.log(response.tools.map(tool => tool.name));
// output: ['identity', 'retrieve', 'upload']
```

#### Identity: get the Agent's DID Key

```typescript
// Get the agent's DID key
const response = await client.callTool({
  name: 'identity',
  arguments: {}, // Send an empty object
});
console.log('Agent DID:', JSON.parse(response.content[0].text));
// output: {"id":"did:key:z6MkjiNpY1QhuULQUkF5thrDbVz2fZwg49zYMg4a7zY1KDr9"}
```

##### Upload: store files

```typescript
// Upload a file to the storage space defined in the delegation set in the MCP Server
const fileBuffer = new Uint8Array([1, 2, 3]);
const base64File = Buffer.from(fileBuffer).toString('base64');
const response = await client.callTool({
  name: 'upload',
  arguments: {
    file: base64File,
    name: 'example.txt',
  },
});
console.log(response.content[0].text);
// output: {"files":{"example.txt":{"/":"bafkreidr7okkzyl5ntqq6na4icgemmlhqpsznofxy6os4aokh3ut3fwwhy"}},"root":{"/":"bafybeie6poiv6nbaapjzvje2cqkm43j745446x4ghshnzvp6pdlbpmxc4e"},"url":"https://storacha.link/ipfs/bafybeie6poiv6nbaapjzvje2cqkm43j745446x4ghshnzvp6pdlbpmxc4e"}
```

##### Upload: store files using a custom delegation

```typescript
// Upload a file to the storage space defined in the delegation set in the upload request
const response = await client.callTool({
  name: 'upload',
  arguments: {
    file: base64File,
    name: 'example.txt',
    delegation: base64Delegation,
  },
});
console.log(response.content[0].text);
// output: {"files":{"example.txt":{"/":"bafkreidr7okkzyl5ntqq6na4icgemmlhqpsznofxy6os4aokh3ut3fwwhy"}},"root":{"/":"bafybeie6poiv6nbaapjzvje2cqkm43j745446x4ghshnzvp6pdlbpmxc4e"},"url":"https://storacha.link/ipfs/bafybeie6poiv6nbaapjzvje2cqkm43j745446x4ghshnzvp6pdlbpmxc4e"}
```

_Read the [step-by-step guide](https://docs.storacha.network/concepts/ucan/#step-by-step-delegation-with-w3cli) to learn how to create a delegation using the CLI._

#### Retrieve: get a file by CID and filepath

```typescript
const response = await client.callTool({
  name: 'retrieve',
  arguments: {
    filepath: 'bafybeie6poiv6nbaapjzvje2cqkm43j745446x4ghshnzvp6pdlbpmxc4e/example.txt',
  },
});
console.log(response.content[0].text); // Base64 encoded data
// output: {"data":"IyBDdX...3Agc2VydmVy"}
```
