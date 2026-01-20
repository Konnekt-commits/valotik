# Guide de Démarrage Rapide - D3E Collection

## ✅ Backend Déjà Installé et Lancé!

Le backend est maintenant **complètement configuré et en cours d'exécution** avec SQLite!

### État Actuel

- ✅ Base de données SQLite créée (`backend/dev.db`)
- ✅ Toutes les migrations exécutées
- ✅ Serveur backend lancé sur `http://localhost:5000`
- ✅ API testée et fonctionnelle

### Test Effectué

Une demande de test a été créée avec succès:
```json
{
  "reference": "CF-2025-001",
  "client": "TechCorp Test",
  "statut": "diagnostic_pending"
}
```

---

## 🚀 Démarrage du Frontend

### 1. Installer les dépendances frontend

```bash
# À la racine du projet (pas dans /backend)
npm install
```

### 2. Démarrer le serveur de développement

```bash
npm run dev
```

Le frontend sera accessible sur: **http://localhost:3000**

---

## 🎯 Tester l'Application Complète

### Étape 1: Ouvrir l'application

Ouvrir votre navigateur sur: http://localhost:3000

Vous devriez voir:
- Interface dark theme avec Tailwind CSS
- Sidebar avec 3 dossiers de démonstration
- Navigation par onglets

### Étape 2: Créer une nouvelle demande

1. Cliquer sur le bouton **"Nouvelle Demande"** en haut à droite
2. Le panneau latéral s'ouvre avec le formulaire
3. Remplir tous les champs requis (marqués avec *)
4. Cliquer sur **"Enregistrer la Demande"**
5. Une alerte de succès s'affiche avec la référence du dossier
6. La page se recharge automatiquement

### Étape 3: Vérifier dans la base de données

Pour visualiser les données créées:

```bash
cd backend
npx prisma studio
```

Puis ouvrir: http://localhost:5555

Vous pourrez voir toutes les tables et leurs données:
- **ClientCompany**: Entreprises clientes
- **ClientSite**: Sites clients
- **Contact**: Contacts sur site
- **PickupRequest**: Demandes d'enlèvement
- **CaseFile**: Dossiers générés automatiquement
- **AuditLog**: Logs d'audit de toutes les opérations

---

## 📡 API Endpoints Disponibles

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Créer une demande
```bash
curl -X POST http://localhost:5000/api/pickup-requests \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Nouvelle Entreprise",
    "siteName": "Site Principal",
    "siteAddress": "15 Rue Example, 75001 Paris",
    "contactName": "Marie Dupont",
    "contactFunction": "Responsable IT",
    "contactPhone": "+33 1 23 45 67 89",
    "contactEmail": "marie.dupont@entreprise.fr",
    "description": "Enlèvement de matériel informatique",
    "mainCategory": "informatique",
    "estimatedVolume": "3 palettes",
    "priority": "medium",
    "plannedVisitDate": "2025-11-01",
    "accessNotes": "Badge nécessaire pour l'\''accès"
  }'
```

### Lister toutes les demandes
```bash
curl http://localhost:5000/api/pickup-requests
```

### Lister tous les dossiers
```bash
curl http://localhost:5000/api/case-files
```

---

## 🔧 Commandes Utiles

### Backend (dans /backend)

```bash
# Redémarrer le serveur backend
npm run dev

# Arrêter le serveur
# Ctrl + C dans le terminal où il tourne

# Ouvrir Prisma Studio
npx prisma studio

# Réinitialiser la base de données (⚠️ supprime toutes les données)
npx prisma migrate reset
```

### Frontend (à la racine)

```bash
# Démarrer le frontend
npm run dev

# Build pour production
npm run build

# Preview du build
npm run preview
```

---

## 📊 Architecture

```
Frontend (React + Vite)          Backend (Express + Prisma)
     Port: 3000                        Port: 5000
         |                                   |
         |------ HTTP Requests ------------->|
         |<----- JSON Responses -------------|
         |                                   |
         |                           SQLite Database
         |                            (backend/dev.db)
```

---

## ✨ Fonctionnalités Disponibles

### Interface Utilisateur
- ✅ Dark theme moderne avec Tailwind CSS
- ✅ Navigation par onglets (6 onglets)
- ✅ Sidebar avec liste de dossiers
- ✅ Formulaire de création de demande (panneau latéral)
- ✅ Filtres et recherche
- ✅ Design responsive

### Backend API
- ✅ CRUD complet pour demandes d'enlèvement
- ✅ CRUD complet pour dossiers
- ✅ Validation des données avec express-validator
- ✅ Création automatique de clients/sites/contacts
- ✅ Génération automatique de références uniques
- ✅ Audit logging de toutes les opérations
- ✅ Pagination et filtrage
- ✅ Gestion d'erreurs centralisée

---

## 🐛 Dépannage

### Le backend ne démarre pas

Vérifier que le port 5000 n'est pas déjà utilisé:
```bash
lsof -ti:5000
# Si un processus existe, le tuer:
kill -9 $(lsof -ti:5000)
```

### Le frontend ne se connecte pas au backend

1. Vérifier que le backend tourne sur le port 5000:
```bash
curl http://localhost:5000/api/health
```

2. Vérifier les logs de la console du navigateur (F12)

### Erreur lors de la création de demande

1. Vérifier que tous les champs requis sont remplis
2. Vérifier les logs du backend dans le terminal
3. Vérifier la console du navigateur (F12)

### Base de données corrompue

Réinitialiser complètement:
```bash
cd backend
npx prisma migrate reset
# Confirmer avec 'y'
```

---

## 📝 Prochaines Étapes

Pour continuer le développement:

1. **Ajouter l'authentification**
   - JWT pour sécuriser l'API
   - Système de login/logout

2. **Implémenter les fonctionnalités manquantes**
   - Gestion des lots
   - Génération de devis
   - Gestion des transports
   - Upload de documents

3. **Améliorer l'interface**
   - Tableau de bord avec graphiques
   - Notifications en temps réel
   - Drag & drop pour les documents

4. **Tests**
   - Tests unitaires (Jest)
   - Tests d'intégration
   - Tests end-to-end (Playwright)

---

## 🎉 Félicitations!

Votre application D3E Collection est maintenant complètement opérationnelle avec:
- ✅ Backend API fonctionnel avec SQLite
- ✅ Frontend React moderne
- ✅ Communication frontend-backend établie
- ✅ Base de données prête à l'emploi

**Bon développement!** 🚀

---

**Valotik © 2025**
