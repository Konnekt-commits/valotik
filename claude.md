# Configuration Projet Valotik

## Environnement Cloud

### Google Cloud Platform
- **Projet ID**: `valotik-484917`
- **Région**: `europe-west1`
- **Artifact Registry**: `europe-west1-docker.pkg.dev/valotik-484917/cloud-run-source-deploy`

### Cloud Run Services

#### Backend API
- **Service**: `valotik-api`
- **URL**: `https://valotik-api-546691893264.europe-west1.run.app`
- **Image**: `europe-west1-docker.pkg.dev/valotik-484917/cloud-run-source-deploy/valotik-api:latest`
- **Cloudbuild**: `backend/cloudbuild.yaml`
- **IMPORTANT**: Le build doit utiliser `./backend` comme contexte (pas `.`)

#### Frontend Web
- **Service**: `valotik-web`
- **URL**: `https://valotik-web-546691893264.europe-west1.run.app`
- **Image**: `europe-west1-docker.pkg.dev/valotik-484917/cloud-run-source-deploy/valotik-web:latest`
- **Cloudbuild**: `cloudbuild.yaml` (racine)
- **Build arg**: `VITE_API_URL=https://valotik-api-546691893264.europe-west1.run.app`

### Base de données MySQL
- **Projet**: `crm-kanban-b2b` (autre projet GCP)
- **Instance**: `lead-manager-db`
- **IP**: `34.78.178.75`
- **Database**: `valotik`
- **User**: `valotik`
- **Password**: `Valotik2026!`
- **DATABASE_URL**: `mysql://valotik:Valotik2026!@34.78.178.75/valotik`

## Cloud Build Triggers

Les triggers sont configurés pour déployer automatiquement sur push vers `main`.

### Configuration requise dans cloudbuild.yaml
```yaml
options:
  logging: CLOUD_LOGGING_ONLY
```
Sans cette option, le build échoue avec l'erreur "build.service_account" / "logs_bucket".

## Pages de l'application

- **Page principale D3E**: `https://valotik-web-546691893264.europe-west1.run.app/`
- **RH Insertion**: `https://valotik-web-546691893264.europe-west1.run.app/rh-insertion.html`

## Seeds de données

Depuis le dossier `backend/`:
```bash
npx tsx prisma/seed-insertion.ts      # Salariés en insertion
npx tsx src/scripts/seedOrganisme.ts  # Organisme et convention
npx tsx prisma/seed.ts                # Données D3E principales
```

## Structure des fichiers clés

```
valotik/
├── cloudbuild.yaml              # Build frontend
├── Dockerfile                   # Dockerfile frontend (nginx)
├── nginx.conf                   # Config nginx SPA
├── index.html                   # Entry point D3E
├── rh-insertion.html            # Entry point RH Insertion
├── main.tsx                     # Main D3E app
├── rh-insertion-app.tsx         # App RH Insertion
├── d3e-collection-app.tsx       # Composant D3E
├── backend/
│   ├── cloudbuild.yaml          # Build backend (context: ./backend)
│   ├── Dockerfile               # Dockerfile backend (node:20-slim)
│   ├── src/server.ts            # Serveur Express
│   └── prisma/schema.prisma     # Schéma BDD
```

## Problèmes connus et solutions

### CORS
Le backend utilise `origin: true` dans server.ts pour autoriser toutes les origines.

### Prisma sur Alpine
Utiliser `node:20-slim` au lieu de `node:20-alpine` et installer OpenSSL.

### Build backend depuis mauvais répertoire
Le cloudbuild backend DOIT spécifier `./backend` comme contexte Docker, sinon il build le frontend.

## API Endpoints principaux

- `GET /api/health` - Health check
- `GET /api/insertion/employees` - Salariés insertion
- `GET /api/organisme` - Données organisme
- `GET /api/case-files` - Dossiers D3E
