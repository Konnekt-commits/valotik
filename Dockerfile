# Frontend Dockerfile — deploy rapide, utilise l'image de base pré-construite
# L'image de base contient : node:20-alpine + npm deps
# Rebuild la base avec : gcloud beta builds submit --project=valotik-484917 --config=cloudbuild-base.yaml

# --- Stage builder : Vite build ---
FROM europe-west1-docker.pkg.dev/valotik-484917/cloud-run-source-deploy/valotik-web-base:latest AS builder

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Stage production : nginx ---
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
