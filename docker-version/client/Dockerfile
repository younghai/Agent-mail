FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json client/package.json
RUN pnpm install --frozen-lockfile --filter @agent-mail/client
COPY client ./client
WORKDIR /app/client
ENV VITE_API_BASE_URL=http://mail-server:8080
ENV VITE_LOCAL_SERVICE_TOKEN=local-dev-token-change-me
RUN pnpm run build

FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json client/package.json
RUN pnpm install --frozen-lockfile --filter @agent-mail/client
COPY --from=builder /app/client /app/client
WORKDIR /app/client
ENV CLIENT_PORT=5000
ENV VITE_API_BASE_URL=http://mail-server:8080
EXPOSE 5000
USER node
CMD ["pnpm", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5000"]
