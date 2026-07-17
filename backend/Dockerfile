# =====================================================
# Stage 1: Builder
# Compiles TypeScript to JavaScript
# =====================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build


# =====================================================
# Stage 2: Production
# Minimal runtime image — no dev dependencies
# =====================================================
FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy data seed file for initial state
COPY db.json ./db.json

EXPOSE 4000

CMD ["node", "dist/server.js"]
