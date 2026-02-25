# Backend Dockerfile — deploy rapide, utilise l'image de base pré-construite
# L'image de base contient : node:20-slim + openssl + npm deps + prisma client
# Rebuild la base avec : gcloud beta builds submit --project=valotik-484917 --config=backend/cloudbuild-base.yaml ./backend

# --- Stage builder : compile le TypeScript ---
FROM europe-west1-docker.pkg.dev/valotik-484917/cloud-run-source-deploy/valotik-api-base:latest AS builder

# Installer les devDependencies pour la compilation
COPY package*.json ./
RUN npm ci

# Regénérer Prisma si le schema a changé
COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# --- Stage production : image finale légère ---
FROM europe-west1-docker.pkg.dev/valotik-484917/cloud-run-source-deploy/valotik-api-base:latest

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
