# =====================================================
# Stage 1: Builder
# Compiles TypeScript to JavaScript
# =====================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared types so path alias @buggybooks/types resolves
COPY shared ./shared

# Copy backend manifests and dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

# Copy source and compile
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# =====================================================
# Stage 2: Production
# Minimal runtime image - no dev dependencies
# =====================================================
FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/backend/dist ./dist

# Copy data seed file for initial state
COPY backend/db.json ./db.json

EXPOSE 4000

CMD ["node", "dist/server.js"]