# Storacha MCP Storage Server

A Model Context Protocol (MCP) server implementation for Storacha hot storage, allowing AI applications to store and retrieve files through a standardized interface. It enables trustless, decentralized data exchange using IPFS and CIDs, ensuring data sovereignty, verifiability, and seamless integration with agent frameworks & AI systems.

## Use Cases

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

4. Generate the Private Key and Delegation

   - Install the Storacha CLI
     ```bash
     npm i -g @storacha/cli
     ```
   - Generate Private Key
     ```bash
     storacha key create
     ```
     _Output:_
     ```txt
     Agent ID: did:key:z6MkhMZRW2aoJ6BQwkpMSJu68Jgqkz1FTpr1p69cpnN43YWG
     Private Key: LMgCYLkvOc8Sm0mOL4cWFLxsWP0ZPEYrLxcQqsV93/s5RLje0BKx05muAse1Hkvh+sxUW38OcHtpiN1zxfpTJ4ht4jxV0=
     ```
   - Set the Agent ID & Create the Delegation
     ```bash
     storacha delegation create <AgentID> --can 'store/add' --can 'filecoin/offer' --can 'upload/add' --can 'space/blob/add' --can 'space/index/add' --base64
     ```

5. Set the environment variables to configure the server

   ```env
   # Storage Client Configuration
   PRIVATE_KEY=                        # Required: The Storacha Agent private key that is authorized to upload files
   DELEGATION=                         # Optional: The base64 encoded delegation that authorizes the Agent owner of the private key to upload files. If not set, MUST be provided for each upload request.
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

There are several ways to integrate with the MCP Server, please read the [integrations.md](https://github.com/storacha/mcp-storage-server/blob/main/docs/integrations.md) guide for more information.

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
