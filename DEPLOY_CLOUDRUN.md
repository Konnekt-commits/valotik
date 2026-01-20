# Déploiement Valotik sur Google Cloud Run (Gratuit)

## Coûts estimés: 0€/mois pour usage modéré

Cloud Run offre un tier gratuit généreux:
- 2 millions de requêtes/mois
- 360,000 GB-secondes de mémoire
- 180,000 vCPU-secondes

---

## Prérequis

1. Compte Google Cloud (carte bancaire requise mais non débitée)
2. Google Cloud CLI installé

```bash
# macOS
brew install google-cloud-sdk

# Vérifier l'installation
gcloud --version
```

---

## Étape 1: Configuration Google Cloud

```bash
# Se connecter à Google Cloud
gcloud auth login

# Créer un nouveau projet (ou utiliser un existant)
gcloud projects create valotik-app --name="Valotik App"

# Sélectionner le projet
gcloud config set project valotik-app

# Activer la facturation (requis mais tier gratuit)
# Aller sur: https://console.cloud.google.com/billing

# Activer les APIs nécessaires
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

---

## Étape 2: Base de données MySQL gratuite avec PlanetScale

PlanetScale offre un tier gratuit pour MySQL:
- 5 GB de stockage
- 1 milliard de rows lues/mois
- 10 millions de rows écrites/mois

### Créer la base:

1. Aller sur https://planetscale.com
2. Créer un compte gratuit
3. Créer une nouvelle database "valotik"
4. Copier la connection string

La connection string ressemble à:
```
mysql://username:password@aws.connect.psdb.cloud/valotik?sslaccept=strict
```

---

## Étape 3: Déployer le Backend

```bash
# Aller dans le dossier backend
cd /Users/rachidgountiti/Documents/PROJEKTS/valotik/backend

# Build et déployer en une commande
gcloud run deploy valotik-api \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=mysql://user:pass@host/valotik" \
  --set-env-vars "NODE_ENV=production" \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2

# Noter l'URL de l'API (ex: https://valotik-api-xxxxx-ew.a.run.app)
```

---

## Étape 4: Appliquer les migrations Prisma

```bash
# Depuis votre machine locale, avec DATABASE_URL configuré
cd backend
DATABASE_URL="votre-url-planetscale" npx prisma db push

# Seed les données (optionnel)
DATABASE_URL="votre-url-planetscale" npx tsx src/scripts/seedOrganisme.ts
```

---

## Étape 5: Déployer le Frontend

```bash
# Retourner à la racine
cd /Users/rachidgountiti/Documents/PROJEKTS/valotik

# Build et déployer
gcloud run deploy valotik-web \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "VITE_API_URL=https://valotik-api-xxxxx-ew.a.run.app" \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2
```

---

## Étape 6: Configuration du domaine (optionnel)

```bash
# Mapper un domaine personnalisé
gcloud run domain-mappings create \
  --service valotik-web \
  --domain votre-domaine.com \
  --region europe-west1
```

---

## Commandes utiles

```bash
# Voir les logs
gcloud run services logs read valotik-api --region europe-west1

# Voir le statut
gcloud run services describe valotik-api --region europe-west1

# Mettre à jour une variable d'environnement
gcloud run services update valotik-api \
  --set-env-vars "MA_VAR=valeur" \
  --region europe-west1

# Supprimer un service (pour arrêter les frais)
gcloud run services delete valotik-api --region europe-west1
```

---

## Résumé des URLs

Après déploiement, vous aurez:
- **Frontend**: https://valotik-web-xxxxx-ew.a.run.app
- **Backend API**: https://valotik-api-xxxxx-ew.a.run.app
- **Database**: PlanetScale (gratuit)

---

## Alternative encore plus simple: Railway.app

Si Google Cloud vous semble complexe, Railway offre:
- Déploiement en 1 clic depuis GitHub
- 5$/mois de crédit gratuit
- MySQL inclus

```bash
# Installer Railway CLI
brew install railway

# Se connecter
railway login

# Déployer
railway init
railway up
```

---

## Monitoring des coûts

Pour rester dans le tier gratuit:
1. Aller sur https://console.cloud.google.com/billing
2. Créer une alerte budget à 1€
3. Vous serez notifié si vous approchez de la limite

