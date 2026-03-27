# Use a lightweight Node.js image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (for efficient caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Expose backend port
EXPOSE 8080

# Set environment variables for Node (optional, safe defaults)
ENV NODE_ENV=production
ENV PORT=8080

# Start the server
CMD ["npm", "start"]
