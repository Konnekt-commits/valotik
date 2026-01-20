# D3E Collection - Backend API

API REST complète pour l'application D3E Collection - Gestion des déchets électroniques.

## Technologies

- **Node.js** avec **Express.js**
- **TypeScript** pour le typage statique
- **Prisma ORM** pour la gestion de la base de données
- **PostgreSQL** comme base de données
- **Express Validator** pour la validation des données

## Installation

### Prérequis

- Node.js 18+ installé
- PostgreSQL 14+ installé et en cours d'exécution
- npm ou yarn

### Étapes d'installation

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Installer les dépendances
npm install

# 3. Copier le fichier d'environnement
cp .env.example .env

# 4. Configurer les variables d'environnement dans .env
# DATABASE_URL="postgresql://user:password@localhost:5432/d3e_db"
# PORT=5000
# NODE_ENV=development
# FRONTEND_URL=http://localhost:3000

# 5. Générer le client Prisma
npm run prisma:generate

# 6. Créer la base de données et exécuter les migrations
npm run prisma:migrate

# 7. (Optionnel) Ouvrir Prisma Studio pour visualiser les données
npm run prisma:studio
```

## Démarrage

### Mode développement (avec hot reload)
```bash
npm run dev
```

### Mode production
```bash
# Build
npm run build

# Démarrer
npm start
```

Le serveur sera accessible sur `http://localhost:5000`

## Endpoints API

### Health Check
```
GET /api/health
```

### Demandes d'Enlèvement (Pickup Requests)

#### Créer une nouvelle demande
```http
POST /api/pickup-requests
Content-Type: application/json

{
  "clientName": "TechCorp Industries",
  "siteName": "Site Paris 15",
  "siteAddress": "15 Avenue de la République, 75015 Paris",
  "contactName": "Pierre Durand",
  "contactFunction": "Responsable IT",
  "contactPhone": "+33 1 23 45 67 89",
  "contactEmail": "p.durand@techcorp.fr",
  "description": "Enlèvement de matériel informatique...",
  "mainCategory": "informatique",
  "estimatedVolume": "3 palettes",
  "priority": "medium",
  "plannedVisitDate": "2025-10-25",
  "accessNotes": "Accès par quai de chargement"
}
```

#### Récupérer toutes les demandes
```http
GET /api/pickup-requests?page=1&limit=10&statut=diagnostic_pending&priorite=high
```

#### Récupérer une demande par ID
```http
GET /api/pickup-requests/:id
```

#### Mettre à jour une demande
```http
PUT /api/pickup-requests/:id
Content-Type: application/json

{
  "statut": "quote_pending",
  "priorite": "high"
}
```

#### Supprimer une demande
```http
DELETE /api/pickup-requests/:id
```

### Dossiers (Case Files)

#### Récupérer tous les dossiers
```http
GET /api/case-files?page=1&limit=10&statut=in_progress
```

#### Récupérer un dossier par ID
```http
GET /api/case-files/:id
```

#### Mettre à jour un dossier
```http
PUT /api/case-files/:id
Content-Type: application/json

{
  "statut": "quote_approved",
  "poidsReel": 2580,
  "valeurTotale": 18500
}
```

#### Clôturer un dossier
```http
POST /api/case-files/:id/close
```

## Structure du Projet

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuration Prisma
│   ├── controllers/
│   │   ├── pickupRequestController.ts
│   │   └── caseFileController.ts
│   ├── middlewares/
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── models/                  # (Généré par Prisma)
│   ├── routes/
│   │   ├── index.ts
│   │   ├── pickupRequestRoutes.ts
│   │   └── caseFileRoutes.ts
│   ├── types/
│   │   └── index.ts            # Types TypeScript
│   └── server.ts               # Point d'entrée
├── prisma/
│   └── schema.prisma           # Schéma de base de données
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Modèle de Données

### Entités Principales

- **ClientCompany** : Entreprises clientes
- **ClientSite** : Sites des clients
- **Contact** : Contacts sur les sites
- **PickupRequest** : Demandes d'enlèvement
- **CaseFile** : Dossiers de collecte
- **Diagnosis** : Diagnostics sur site
- **Lot** : Lots de matériel
- **Quotation** : Devis
- **QuotationLine** : Lignes de devis
- **TransportOrder** : Ordres de transport
- **Component** : Composants issus du démantèlement
- **InventoryItem** : Articles en inventaire
- **StorageLocation** : Emplacements de stockage
- **Document** : Documents attachés
- **User** : Utilisateurs
- **AuditLog** : Journaux d'audit

## Validation des Données

Toutes les routes POST/PUT utilisent `express-validator` pour valider les données entrantes.

Exemple de champs validés pour la création d'une demande:
- clientName (obligatoire, non vide)
- contactEmail (obligatoire, format email)
- contactPhone (obligatoire)
- priority (obligatoire, valeurs: high/medium/low)

## Gestion des Erreurs

L'API utilise un format de réponse standardisé:

### Succès
```json
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie"
}
```

### Erreur
```json
{
  "success": false,
  "error": "Message d'erreur",
  "data": [ ... ] // Détails optionnels
}
```

## Pagination

Toutes les routes de liste supportent la pagination:
```
GET /api/pickup-requests?page=2&limit=20
```

Réponse:
```json
{
  "success": true,
  "data": {
    "pickupRequests": [...],
    "pagination": {
      "total": 156,
      "page": 2,
      "limit": 20,
      "pages": 8
    }
  }
}
```

## Filtrage

Les routes supportent le filtrage par paramètres de requête:
```
GET /api/pickup-requests?statut=diagnostic_pending&priorite=high
GET /api/case-files?clientId=abc123&statut=in_progress
```

## Audit Logging

Toutes les opérations importantes (CREATE, UPDATE, DELETE) sont enregistrées dans la table `AuditLog` avec:
- Type d'entité
- ID de l'entité
- Action effectuée
- Payload de la requête
- Horodatage

## Sécurité

- **Helmet.js** : Protection contre les vulnérabilités web communes
- **CORS** : Configuration stricte des origines autorisées
- **Validation** : Validation et sanitisation de toutes les entrées
- **Rate Limiting** : À implémenter en production

## Base de Données

### Créer une nouvelle migration
```bash
npm run prisma:migrate
```

### Réinitialiser la base de données
```bash
npx prisma migrate reset
```

### Visualiser les données avec Prisma Studio
```bash
npm run prisma:studio
```

## Scripts Utiles

- `npm run dev` : Démarrer en mode développement
- `npm run build` : Compiler TypeScript
- `npm start` : Démarrer le serveur compilé
- `npm run prisma:generate` : Générer le client Prisma
- `npm run prisma:migrate` : Exécuter les migrations
- `npm run prisma:studio` : Ouvrir Prisma Studio

## Variables d'Environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| DATABASE_URL | URL de connexion PostgreSQL | postgresql://user:pass@localhost:5432/d3e_db |
| PORT | Port du serveur | 5000 |
| NODE_ENV | Environnement | development / production |
| FRONTEND_URL | URL du frontend (pour CORS) | http://localhost:3000 |

## Prochaines Étapes

- [ ] Implémenter l'authentification (JWT)
- [ ] Ajouter le rate limiting
- [ ] Créer des endpoints pour les lots
- [ ] Créer des endpoints pour les devis
- [ ] Créer des endpoints pour les transports
- [ ] Ajouter les uploads de fichiers
- [ ] Implémenter la génération de PDF
- [ ] Ajouter des tests unitaires
- [ ] Ajouter des tests d'intégration
- [ ] Documenter avec Swagger/OpenAPI

## Support

Pour toute question ou problème, veuillez consulter la documentation complète dans `d3e_app_spec.md`.

---

**Valotik © 2025**
