# Stage 1: Build React App
FROM node:14 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve React App with Nginx
FROM nginx:latest

# Copy SSL certificate and key files from specified paths
COPY /etc/letsencrypt/live/tailgpt.iot.ax/fullchain.pem /etc/nginx/ssl/ssl_certificate.crt
COPY /etc/letsencrypt/live/tailgpt.iot.ax/privkey.pem /etc/nginx/ssl/private.key

# Copy built React app from the previous stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Expose ports
EXPOSE 80
EXPOSE 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
