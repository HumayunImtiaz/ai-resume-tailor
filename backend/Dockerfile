# ============================================
# Stage 1: Builder
# Install dependencies & compile TypeScript
# ============================================
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# ============================================
# Stage 2: Production Runner
# Only keep production artifacts
# ============================================
FROM node:20-alpine AS runner

# Install OpenSSL for Prisma at runtime
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Generate Prisma client for production image
RUN npx prisma generate

# Copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# Hugging Face Spaces require apps to listen on port 7860
ENV PORT=7860
ENV NODE_ENV=production

EXPOSE 7860

# Run Prisma migrations, then start the server
CMD npx prisma migrate deploy && node dist/server.js
