FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Debug: List contents of build directory
RUN ls -la /app/build

# Production stage
FROM nginx:alpine

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R 755 /var/cache/nginx /var/run /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Create a custom nginx configuration
RUN echo 'user nginx; \
worker_processes auto; \
pid /var/run/nginx.pid; \
events { \
    worker_connections 1024; \
} \
http { \
    include /etc/nginx/mime.types; \
    default_type application/octet-stream; \
    sendfile on; \
    keepalive_timeout 65; \
    server { \
        listen 80; \
        location / { \
            root /usr/share/nginx/html; \
            index index.html index.htm; \
            try_files $uri $uri/ /index.html; \
        } \
    } \
}' > /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Set proper permissions for the web root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Switch to nginx user
USER nginx

EXPOSE 80

# Use nginx's default CMD
CMD ["nginx", "-g", "daemon off;"] 