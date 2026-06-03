# Build stage (not used in dev but good for production)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/status', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "server.js"]
