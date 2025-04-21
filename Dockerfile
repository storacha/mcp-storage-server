FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && \
    pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install only production dependencies
RUN npm install -g pnpm && \
    HUSKY=0 pnpm install --prod --ignore-scripts

# Expose the port for SSE mode
EXPOSE 3000

# Set default environment variables
ENV NODE_ENV=production
ENV MCP_TRANSPORT_MODE=sse
ENV MCP_SERVER_PORT=3000

# Run the server in SSE mode
CMD ["node", "dist/index.js"] 