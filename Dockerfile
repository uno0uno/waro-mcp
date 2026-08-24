FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && test -f build/http.js
ENV MCP_PORT=8090 MCP_PATH=/mcp NODE_ENV=production
EXPOSE 8090
CMD ["node", "build/http.js"]
