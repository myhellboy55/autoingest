# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Baked in at build time — set via docker-compose build args
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install a simple HTTP server to serve static files
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

# Serve the built app
CMD ["serve", "-s", "dist", "-l", "5173"]
