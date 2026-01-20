# Backend Dockerfile - Cloud Run optimisé
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances (y compris dev pour build)
RUN npm ci

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY . .

# Build TypeScript
RUN npm run build

# Stage de production
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Installer seulement les dépendances de production
RUN npm ci --only=production
RUN npx prisma generate

# Copier le build
COPY --from=builder /app/dist ./dist

# Cloud Run utilise PORT 8080
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
