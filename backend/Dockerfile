FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directory for GCP key (Render will mount it)
RUN mkdir -p /app/keys

EXPOSE 5050

CMD ["npm", "start"]