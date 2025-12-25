# Use Python slim as base (has Python + pip)
FROM python:3.11-slim

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install pdfplumber using pip (with flag to bypass PEP 668)
RUN pip install pdfplumber moviepy os-sys --break-system-packages

WORKDIR /app

# Copy and install Node dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directory for GCP key (Render secret file)
RUN mkdir -p /app/keys

EXPOSE 5050

CMD ["npm", "start"]
