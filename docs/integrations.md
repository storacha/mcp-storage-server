# How to integrate with Storacha MCP Storage Server

## MCP SDK

### Client Integration (STDIO mode)

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

### Client Integration (SSE mode)

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

## MCP Server Config

### Cursor IDE MCP Server Config

```jsonc
{
  "mcpServers": {
    "storacha-storage-server": {
      "command": "node",
      "args": [
        // Absolute path to the mcp-storage-server/dist/index.js
        "/path/to/mcp-storage-server/dist/index.js",
      ],
      "env": {
        "MCP_TRANSPORT_MODE": "stdio",
        // Required: The Storacha Agent private key that is authorized to upload files
        "PRIVATE_KEY": "...",
        // Optional: The base64 encoded delegation that authorizes the Agent owner of the private key to upload files. If not set, MUST be provided for each upload request.
        "DELEGATION": "...",
      },
      "shell": true,
      // Absolute path to the root folder of the project
      "cwd": "/path/to/mcp-storage-server",
    },
  },
}
```
