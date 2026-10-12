FROM node:20-alpine

WORKDIR /app

# Set production port
ENV PORT=3000

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code and build frontend
COPY . .
RUN npm run build

# Expose port for Coolify
EXPOSE 3000

# Start Express + Vite production server
CMD ["npm", "start"]
