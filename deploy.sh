#!/bin/bash
# Script de déploiement Valotik sur Cloud Run

# Variables
PROJECT_ID="valotik-484917"
REGION="europe-west1"
REPO="valotik"

# Clone et build
cd ~
rm -rf valotik
git clone https://github.com/Konnekt-commits/valotik.git
cd valotik/backend

# Config Docker pour Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Créer le repo Artifact Registry (ignore si existe)
gcloud artifacts repositories create ${REPO} --repository-format=docker --location=${REGION} 2>/dev/null || true

# Build et push l'image backend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/backend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/backend:latest

# Déployer sur Cloud Run
gcloud run deploy valotik-api \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/backend:latest \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --port 8080

echo ""
echo "✅ Backend déployé!"
echo "Copie l'URL ci-dessus"
