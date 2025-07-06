# Use Debian-based Node image
FROM node:20-slim

WORKDIR /app

# Install Tesseract OCR
RUN apt-get update && \
    apt-get install -y tesseract-ocr && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Clean up test files that might cause issues
RUN find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
RUN find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true

# Copy source code
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p uploads && chmod 755 uploads

# Create non-root user for security
RUN useradd -m nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]