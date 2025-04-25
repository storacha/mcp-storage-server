FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

COPY ./ /app

WORKDIR /app

# Force install without any prompts
RUN --mount=type=cache,target=/root/.pnpm-store HUSKY=0 pnpm install --force --no-optional --frozen-lockfile --ignore-scripts --prod

FROM node:22-alpine AS release

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-lock.yaml

# Set default environment variables
ENV NODE_ENV=production
ENV MCP_TRANSPORT_MODE=rest
ENV MCP_SERVER_PORT=3001

# Remove node_modules if exists to avoid prompts
RUN rm -rf node_modules || true
RUN pnpm install --force --no-optional --frozen-lockfile --ignore-scripts --prod

ENTRYPOINT ["node", "dist/index.js"]