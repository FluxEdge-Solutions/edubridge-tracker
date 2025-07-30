# Stage 1: Base build image
FROM node:20 AS base

WORKDIR /app
COPY . .
RUN npm install

# Stage 2: Build client (Vite + React)
FROM base AS client-builder

RUN npm run build:client

# Stage 3: Build server (TypeScript)
FROM base AS server-builder

# Ensure client build is available
COPY --from=client-builder /app/build ./build

RUN npm run build:server

# Debug: Show what was built
RUN echo "DIST CONTENT:" && find build

# Stage 4: Run server
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=server-builder /app/build ./build
COPY --from=server-builder /app/package.json ./
COPY --from=server-builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "build/server.js"]
