FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY mail-server/package.json mail-server/package.json
RUN pnpm install --frozen-lockfile --filter agentic-inbox-mail-server --prod
COPY mail-server ./mail-server
WORKDIR /app/mail-server
EXPOSE 8080
USER node
CMD ["node", "src/index.js"]
