FROM python:3.11-slim

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install ONLY pdfplumber (required for PDF text extraction)
RUN pip install pdfplumber --break-system-packages

WORKDIR /app

# Copy and install Node dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directory for GCP key
RUN mkdir -p /app/keys

EXPOSE 5050

CMD ["npm", "start"]
