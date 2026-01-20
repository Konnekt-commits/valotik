# Guide d'Installation Complet - D3E Collection

## Vue d'Ensemble

Application complète de gestion des déchets électroniques (D3E) avec:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Base de données**: PostgreSQL 14+

---

## Prérequis

Assurez-vous d'avoir installé:

- **Node.js** version 18 ou supérieure
- **PostgreSQL** version 14 ou supérieure
- **npm** ou **yarn**

### Vérifier les installations

```bash
node --version   # Doit afficher v18.x.x ou supérieur
npm --version    # Doit afficher 8.x.x ou supérieur
psql --version   # Doit afficher PostgreSQL 14.x ou supérieur
```

---

## Installation PostgreSQL (si nécessaire)

### macOS (avec Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Télécharger depuis: https://www.postgresql.org/download/windows/

---

## Étape 1: Configuration de la Base de Données

### 1.1 Créer la base de données

```bash
# Se connecter à PostgreSQL
psql postgres

# Dans l'interface psql, exécuter:
CREATE DATABASE d3e_db;
CREATE USER d3e_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE d3e_db TO d3e_user;

# Quitter psql
\q
```

### 1.2 Vérifier la connexion

```bash
psql -U d3e_user -d d3e_db -h localhost
# Entrer le mot de passe quand demandé
# Si connexion réussie, tapez \q pour quitter
```

---

## Étape 2: Installation du Backend

### 2.1 Naviguer dans le dossier backend

```bash
cd backend
```

### 2.2 Installer les dépendances

```bash
npm install
```

### 2.3 Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres
nano .env  # ou utilisez votre éditeur préféré
```

**Contenu du fichier .env:**

```env
# URL de connexion PostgreSQL
DATABASE_URL="postgresql://d3e_user:votre_mot_de_passe_securise@localhost:5432/d3e_db"

# Port du serveur backend
PORT=5000

# Environnement
NODE_ENV=development

# URL du frontend (pour CORS)
FRONTEND_URL=http://localhost:3000
```

### 2.4 Générer le client Prisma

```bash
npm run prisma:generate
```

### 2.5 Exécuter les migrations de la base de données

```bash
npm run prisma:migrate
```

Cette commande va:
- Créer toutes les tables dans PostgreSQL
- Établir les relations entre les entités
- Configurer les index et contraintes

### 2.6 (Optionnel) Ouvrir Prisma Studio

Pour visualiser et gérer vos données graphiquement:

```bash
npm run prisma:studio
```

Accéder à: http://localhost:5555

### 2.7 Démarrer le serveur backend

```bash
# Mode développement (avec hot reload)
npm run dev

# Ou en mode production
npm run build
npm start
```

**Vérifications:**
- Le serveur doit démarrer sur `http://localhost:5000`
- Vous devriez voir: `✅ Database connected successfully`
- Tester le health check: http://localhost:5000/api/health

---

## Étape 3: Installation du Frontend

### 3.1 Retourner au répertoire racine

```bash
cd ..   # Si vous êtes dans /backend
```

### 3.2 Installer les dépendances frontend

```bash
npm install
```

### 3.3 (Optionnel) Configurer l'URL de l'API

Créer un fichier `.env` à la racine:

```bash
nano .env
```

**Contenu:**

```env
VITE_API_URL=http://localhost:5000/api
```

### 3.4 Démarrer le serveur de développement

```bash
npm run dev
```

Le frontend sera accessible sur: http://localhost:3000

---

## Étape 4: Vérification de l'Installation

### 4.1 Vérifier que tout fonctionne

1. **Backend**: Ouvrir http://localhost:5000/api/health
   - Devrait retourner: `{"success": true, "message": "API D3E Collection - Backend is running"}`

2. **Frontend**: Ouvrir http://localhost:3000
   - L'application doit s'afficher avec l'interface dark theme
   - La sidebar doit montrer les 3 dossiers de démonstration

3. **Test end-to-end**:
   - Cliquer sur "Nouvelle Demande" dans l'interface
   - Remplir le formulaire de demande d'enlèvement
   - Cliquer sur "Enregistrer la Demande"
   - Vérifier qu'une alerte de succès s'affiche
   - La page devrait se recharger avec la nouvelle demande

### 4.2 Vérifier les données dans la base

```bash
cd backend
npm run prisma:studio
```

Vérifier dans Prisma Studio:
- **ClientCompany**: Le client créé
- **ClientSite**: Le site du client
- **Contact**: Le contact sur site
- **PickupRequest**: La demande d'enlèvement
- **CaseFile**: Le dossier généré automatiquement
- **AuditLog**: Les logs d'audit

---

## Structure Complète du Projet

```
valotik/
├── backend/                      # Backend API
│   ├── src/
│   │   ├── config/              # Configuration (Prisma)
│   │   ├── controllers/         # Logique métier
│   │   ├── middlewares/         # Validation et gestion erreurs
│   │   ├── routes/              # Routes API
│   │   └── server.ts            # Point d'entrée
│   ├── prisma/
│   │   └── schema.prisma        # Schéma de base de données
│   ├── .env                     # Variables d'environnement
│   ├── package.json
│   └── tsconfig.json
│
├── src/
│   └── services/
│       └── api.ts               # Service API frontend
│
├── d3e-collection-app.tsx       # Application principale
├── index.css                    # Styles globaux
├── main.tsx                     # Point d'entrée frontend
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── INSTALLATION.md              # Ce fichier

```

---

## Scripts Utiles

### Backend

```bash
cd backend

# Développement
npm run dev                      # Démarrer en mode dev

# Production
npm run build                    # Compiler TypeScript
npm start                        # Démarrer le serveur compilé

# Base de données
npm run prisma:generate          # Générer le client Prisma
npm run prisma:migrate           # Exécuter les migrations
npm run prisma:studio            # Ouvrir Prisma Studio
npx prisma migrate reset         # Réinitialiser la DB (⚠️ supprime toutes les données)
```

### Frontend

```bash
# À la racine du projet
npm run dev                      # Démarrer en mode développement
npm run build                    # Build pour production
npm run preview                  # Prévisualiser le build de production
```

---

## Endpoints API Disponibles

### Health Check
```
GET /api/health
```

### Demandes d'Enlèvement (Pickup Requests)

```http
POST   /api/pickup-requests       # Créer une demande
GET    /api/pickup-requests       # Lister toutes les demandes
GET    /api/pickup-requests/:id   # Obtenir une demande
PUT    /api/pickup-requests/:id   # Mettre à jour une demande
DELETE /api/pickup-requests/:id   # Supprimer une demande
```

### Dossiers (Case Files)

```http
GET  /api/case-files           # Lister tous les dossiers
GET  /api/case-files/:id       # Obtenir un dossier
PUT  /api/case-files/:id       # Mettre à jour un dossier
POST /api/case-files/:id/close # Clôturer un dossier
```

---

## Dépannage

### Erreur: "Database connection failed"

**Solution:**
1. Vérifier que PostgreSQL est démarré: `pg_isready`
2. Vérifier l'URL dans `backend/.env`
3. Tester la connexion manuellement: `psql -U d3e_user -d d3e_db`

### Erreur: "Port 5000 already in use"

**Solution:**
```bash
# Trouver le processus
lsof -ti:5000

# Tuer le processus
kill -9 $(lsof -ti:5000)

# Ou changer le port dans backend/.env
```

### Erreur: "Cannot find module '@prisma/client'"

**Solution:**
```bash
cd backend
npm run prisma:generate
```

### Erreur CORS lors de l'appel API

**Solution:**
Vérifier que `FRONTEND_URL` dans `backend/.env` correspond à l'URL du frontend (par défaut: `http://localhost:3000`)

### Erreur: "Module not found: Error: Can't resolve './src/services/api'"

**Solution:**
Vérifier que le fichier `src/services/api.ts` existe à la racine du projet.

---

## Fonctionnalités Disponibles

### ✅ Implémenté

- Interface utilisateur dark theme avec Tailwind CSS
- Navigation par onglets (Synthèse, Demande, Devis, Logistique, Inventaire, Analytics)
- Sidebar avec liste de dossiers filtrables
- Formulaire de création de demande d'enlèvement (panneau latéral)
- Backend API REST complet
- Validation des données avec express-validator
- Gestion automatique des clients, sites et contacts
- Génération automatique de références de dossiers
- Audit logging complet
- Pagination et filtrage des données

### 🚧 À Implémenter

- Authentification JWT
- Gestion des lots
- Génération de devis
- Gestion des ordres de transport
- Upload de documents
- Génération de PDF
- Tests unitaires et d'intégration
- Documentation Swagger/OpenAPI

---

## Support

Pour toute question ou problème:

1. Consulter la documentation complète dans `backend/README.md`
2. Consulter les spécifications dans `d3e_app_spec.md`
3. Vérifier les logs du serveur backend
4. Vérifier la console du navigateur pour les erreurs frontend

---

**Valotik © 2025**
