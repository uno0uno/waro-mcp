FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm run build 2>&1 | tail -20
ENV MCP_PORT=8090 MCP_PATH=/mcp NODE_ENV=production
EXPOSE 8090
CMD ["node", "build/http.js"]
