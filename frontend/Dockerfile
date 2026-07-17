# =====================================================
# Stage 1: Builder
# Builds the Vite/React production bundle
# =====================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL is injected at build time via --build-arg
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# =====================================================
# Stage 2: Production (nginx)
# Serves the static Vite bundle
# =====================================================
FROM nginx:alpine AS production

# Remove default nginx config and replace with SPA config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the production Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
