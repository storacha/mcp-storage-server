# Contributing to Storacha MCP Storage Server

Thank you for considering contributing to the Storacha MCP Storage Server! We welcome contributions from the community to help improve and expand the project.

## How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Project Structure

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

### Need Help?

[Discord](https://discord.gg/pqa6Dn6RnP)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project, MIT or Apache 2 License.
