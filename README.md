# D3E Collection App

Application web moderne de gestion des collectes D3E (Déchets d'Équipements Électriques et Électroniques) pour le recyclage et la valorisation des déchets électroniques.

## Vue d'ensemble

Cette application centralise l'ensemble du cycle de vie d'un dossier d'enlèvement D3E :
- Création de demandes et diagnostic sur site
- Génération et gestion de devis
- Planification logistique et transport
- Gestion d'inventaire avec QR codes
- Démantèlement et valorisation
- Analytics et reporting

## Fonctionnalités principales

### 🏠 Onglet Synthèse
- KPIs essentiels (poids, lots, valeur, statut)
- Timeline visuelle des étapes du dossier
- Carte des sites (client et destination)
- Liste des prochaines actions avec alertes

### 📋 Onglet Demande & Diagnostic
- Informations détaillées de la demande initiale
- Fiche de visite diagnostic avec notes technicien
- Liste des lots diagnostiqués avec grades (A/B/C/D)
- Catégorisation et orientation des lots
- Poids estimés et réels

### 💶 Onglet Devis
- Tableau éditable des lignes de devis
- Calcul automatique HT/TVA/TTC
- Gestion des versions et validations
- Génération PDF et envoi client

### 🚚 Onglet Logistique
- Planning des opérations (enlèvement, transport, livraison)
- Gestion des ordres de transport
- Carte des tournées
- Suivi des transporteurs et véhicules

### 📦 Onglet Inventaire
- Gestion des emplacements hiérarchiques (site/zone/allée/rack/niveau/position)
- Scan et génération de QR codes
- Historique des mouvements
- Suivi en temps réel des stocks

### 📊 Onglet Analytics
- Taux de valorisation et temps de cycle
- Répartition du poids par catégorie
- Distribution par grade et orientation
- Comparaisons temporelles et KPIs financiers

## Technologies utilisées

- **React 18** avec hooks (useState)
- **TypeScript** pour le typage statique
- **Tailwind CSS** pour un design responsive moderne
- **Vite** pour un build rapide et optimisé
- **Lucide React** pour les icônes cohérentes

## Design

- Interface sombre moderne (dark theme)
- Navigation par onglets intuitive
- Sidebar avec liste des dossiers filtrables
- Système de statuts avec codes couleur
- Design responsive adapté à tous les écrans

## Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

## Structure du projet

```
valotik/
├── index.html              # Point d'entrée HTML
├── main.tsx               # Point d'entrée React
├── index.css              # Styles globaux avec Tailwind
├── d3e-collection-app.tsx # Composant principal
├── package.json           # Dépendances et scripts
├── vite.config.ts         # Configuration Vite
├── tailwind.config.js     # Configuration Tailwind
├── tsconfig.json          # Configuration TypeScript
└── README.md             # Documentation
```

## Types de données principaux

### CaseFile (Dossier)
- Référence unique
- Client et site
- Statut (diagnostic pending, quote pending, in progress, etc.)
- Poids estimé/réel
- Valeur estimée
- Priorité

### Lot
- Code unique
- Catégorie (informatique, écrans, serveurs, etc.)
- Grade (A/B/C/D)
- Orientation (revente, reconditionnement, démantèlement, déchet)
- Poids estimé/réel
- QR Code

### QuotationLine (Ligne de devis)
- Type (service, matériel, forfait)
- Description
- Quantité et unité
- Prix unitaire
- TVA

### TransportOrder (Ordre de transport)
- Type (enlèvement, livraison)
- Transporteur et véhicule
- Statut et date planifiée
- Documents associés

## Système de grades

- **Grade A** : Équipement en excellent état, haute valeur de revente
- **Grade B** : Bon état, nécessite reconditionnement léger
- **Grade C** : État moyen, démantèlement pour récupération composants
- **Grade D** : Mauvais état, recyclage matières premières

## Orientations des lots

- **Resale** : Revente directe après nettoyage/test
- **Refurbishment** : Reconditionnement avant revente
- **Dismantling** : Démantèlement pour récupération composants
- **Waste** : Recyclage matières premières uniquement

## Prochaines étapes de développement

### Phase 1 - Backend & API
- [ ] Développer l'API REST (NestJS ou Django)
- [ ] Configurer PostgreSQL avec PostGIS
- [ ] Implémenter l'authentification OAuth2
- [ ] Créer les endpoints CRUD pour tous les modèles

### Phase 2 - Fonctionnalités avancées
- [ ] Intégration balances connectées
- [ ] Scanner QR code avec caméra
- [ ] Génération automatique de PDF
- [ ] Système de notifications (email/SMS)
- [ ] Mode hors ligne pour techniciens

### Phase 3 - Analytics & Reporting
- [ ] Dashboard global multi-dossiers
- [ ] Exports CSV/Excel
- [ ] Prévisions par IA
- [ ] Rapports réglementaires automatisés

### Phase 4 - Mobile & Portail client
- [ ] Application mobile React Native
- [ ] Portail client externe
- [ ] Signature électronique
- [ ] Suivi en temps réel

## Conformité & Sécurité

- Conformité RGPD (données clients)
- Traçabilité complète (audit log)
- Chiffrement TLS en transit
- Backup automatique
- Rôles et permissions (RBAC)

## Support

Pour toute question ou problème :
- Email: support@valotik.fr
- Documentation complète: Voir `d3e_app_spec.md`

## Licence

MIT License - Valotik 2025

---

**Note**: Cette application est un MVP démonstratif. Les données affichées sont des exemples fictifs à des fins de présentation.
