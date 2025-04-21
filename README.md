# Storacha MCP Storage Server

A Model Context Protocol (MCP) server implementation for Storacha hot storage, allowing AI applications to store and retrieve files through a standardized interface. It enables trustless, decentralized data exchange using IPFS and CIDs, ensuring data sovereignty, verifiability, and seamless integration with agent frameworks & AI systems.

## Use Cases

- **Document Storage & Analysis**: Securely upload and retrieve Blob documents.
- **Long-term Structured Data Storage**: Maintain structured data storage optimized for longevity and accessibility.
- **Data Sharing Between Agents and Systems**: Easily share data across multiple agents and diverse systems using **CIDs (Content Identifiers)**, enabling decentralized, verifiable, and efficient data exchange.
- **Application Integration**: Seamlessly integrate Storacha storage retrieval into applications via the Model Context Protocol.
- **AI Model Development**: Support AI models by providing reliable versioning and access to external datasets stored in Storacha.
- **LLM Integration**: Enhance large language models (LLMs) by connecting directly with Storacha Storage for seamless data access.
- **Web Application Backups**: Reliably store backup copies of web applications for disaster recovery.
- **Machine Learning Datasets**: Efficiently manage and access large datasets used in machine learning workflows.

## Quick Installation Guide

Get started with the Storacha MCP Storage Server in just a few simple steps.

1. **Clone the Repository**

   ```bash
   git clone https://github.com/storacha/mcp-storage-server.git && cd mcp-storage-server
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Generate Keys & Delegation**

   - **Install the CLI**
     ```bash
     npm i -g @storacha/cli
     ```
   - **Login to Storacha**
     ```bash
     storacha login
     ```
     _Output:_
     ```
     ? How do you want to login?
       Via Email
     ❯ Via GitHub
     ```
     _Select **Via GitHub** and authenticate with your GitHub account._
   - **Create a Space**
     ```bash
     storacha space create <your_space_name>
     ```
     _Replace `<your_space_name>` with a name for your new Space_.
     :warning: _Make sure you save the recovery key, so you can access your space from another device if needed._
   - **Create a Private Key**

     ```bash
     storacha key create
     ```

     _Output:_

     ```txt
     AgentId: did:key:z6MkhMZRW2aoJ6BQwkpMSJu68Jgqkz1FTpr1p69cpnN43YWG
     PrivateKey: LMgCYLkvOc8Sm0mOL4cWFLxsWP0ZPEYrLxcQqsV93/s5RLje0BKx05muAse1Hkvh+sxUW38OcHtpiN1zxfpTJ4ht4jxV0=
     ```

   - **Set the Agent ID & Create Delegation**
     ```bash
     storacha delegation create <agent_id> \
      --can 'store/add' \
      --can 'filecoin/offer' \
      --can 'upload/add' \
      --can 'space/blob/add' \
      --can 'space/index/add' --base64
     ```
     _Replace <agent_id> with the AgentId from the previous step. It grants the Agent the permission to store files into the recently created space_.

4. **Configure the MCP Client**

Next, configure your MCP client (such as Cursor) to use this server. Most MCP clients store the configuration as JSON in the following format:

```jsonc
{
  "mcpServers": {
    "storacha-storage-server": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        // The server also supports `sse` mode, the default is `stdio`.
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

Replace `<agent_private_key>` with the PrivateKey you created in step 3. Then, replace the `<base64_delegation>` with the delegation you created in step 3.

There are several ways to configure MCP clients, please read the [integrations.md](https://github.com/storacha/mcp-storage-server/blob/main/docs/integrations.md) guide for more information.

## Tools

The Storacha MCP Storage Server provides the following tools for AI systems to interact with a decentralized storage network.

### Storage Operations

#### upload

Upload a file to the Storacha Network. The file must be provided as a base64 encoded string with a filename that includes the extension for MIME type detection.

```typescript
interface UploadParams {
  // Base64 encoded file content
  file: string;
  // Filename with extension for MIME type detection
  name: string;
  // Optional: Whether to publish to Filecoin (default: false)
  publishToFilecoin?: boolean;
  // Optional: Custom delegation proof
  delegation?: string;
  // Optional: Custom gateway URL
  gatewayUrl?: string;
}
```

#### retrieve

Retrieve a file from the Storacha Network. Supported filepath formats: `CID/filename`, `/ipfs/CID/filename`, or `ipfs://CID/filename`.

```typescript
interface RetrieveParams {
  // Path in format: CID/filename, /ipfs/CID/filename, or ipfs://CID/filename
  filepath: string;
  // Optional: Whether to use multiformat base64 encoding
  useMultiformatBase64?: boolean;
}
```

#### identity

Returns the `DIDKey` of the Storacha Agent loaded from the private key storage configuration.

```typescript
interface IdentityParams {
  // No parameters required
}
```

See the [integrations.md](https://github.com/storacha/mcp-storage-server/blob/main/docs/integrations.md) guide for detailed code examples and different integration patterns.

## License

MIT or Apache 2 License

## Support

For support, please visit [Storacha Support](https://storacha.network) or open an issue in this repository.
