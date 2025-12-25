FROM node:20-alpine

WORKDIR /app

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Install pdfplumber (for PDF text extraction)
RUN pip3 install pdfplumber moviepy os-sys

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create keys directory
RUN mkdir -p /app/keys

EXPOSE 5050

CMD ["npm", "start"]
