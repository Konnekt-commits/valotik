## Application de gestion des collectes D3E

### 1. Objectifs & contexte
- Centraliser l’ensemble du cycle de vie d’un dossier d’enlèvement D3E (demande, diagnostic, devis, logistique, inventaire, démantèlement, reporting).
- Réduire les frictions entre équipes (planificateurs, techniciens, transporteurs, logisticiens) en fournissant une vision 360° par dossier.
- Garantir la traçabilité réglementaire (poids, mouvements, certificats) et soutenir la valorisation matière par un suivi précis des lots et composants.

### 2. Rôles & personas
- **Planificateur back-office** : enregistre les demandes, suit les dossiers, valide les devis, planifie les transports.
- **Technicien diagnostiqueur (Titien)** : réalise la visite sur site, crée les lots, renseigne les pesées, propose les services et consommables pour le devis.
- **Logisticien / magasinier** : réceptionne les lots, scanne les QR codes, affecte les emplacements, suit l’inventaire et le démantèlement.
- **Transporteur partenaire** : consulte les tournées assignées, confirme enlèvements et livraisons.
- **Client entreprise** (option portail) : suit ses demandes, valide les devis, récupère les rapports et certificats.

### 3. Processus métier principal
1. **Création demande** : un contact client fournit une description succincte (ex. “2 palettes matériel informatique + câbles électriques”). La demande reçoit un statut `À diagnostiquer`.
2. **Planification diagnostic** : le planificateur assigne un technicien, une date et un créneau. Génération d’une visite dans l’agenda.
3. **Diagnostic sur site** :
   - Checklist sécurité, photos, notation de l’accessibilité.
   - Création de lots (catégorie, grade A/B/C/D, orientation revente/reconditionnement/démantèlement/déchet).
   - Pesée ou estimation initiale par lot.
   - Proposition de services et consommables nécessaires (transport, manutention, emballage).
4. **Devis** :
   - Génération d’un devis structuré (lignes services, matériaux, forfaits).
   - Workflow interne : brouillon → validation → envoi client → accepté/refusé.
5. **Planification logistique** :
   - Création d’un ordre transport (transporteur, véhicule, date, créneau).
   - Association logisticien(s) et ressources.
6. **Collecte & réception** :
   - Pesée réelle lors du chargement et à l’arrivée (balance connectée ou saisie).
   - Affectation des lots à un site (entrepôt, magasin, démantèlement).
   - Génération/scan QR code par lot et composant.
7. **Démantèlement / valorisation** :
   - Décomposition de lots en composants (CPU, RAM, etc.) avec pesée et valeur estimée.
   - Mise en stock avec emplacements précis.
8. **Clôture dossier** :
   - Tous les mouvements validés, documents (bons, certificats) archivés.
   - Calcul indicateurs (poids final, taux valorisation, délais).

### 4. Expérience utilisateur – page dossier avec onglets
Tous les blocs se trouvent sur une seule page avec navigation par onglets (layout sombre inspiré des screenshots fournis).

#### 4.1 Barre latérale gauche
- Liste des dossiers filtrables (statut, client, zone géographique, priorité).
- Indicateur couleur par statut, nombre de notifications.
- Champ recherche quick find + filtres sauvegardés.
- Mini-calendrier permettant de filtrer par date d’enlèvement prévue.

#### 4.2 Header global
- Breadcrumb `Clients > [Client] > [Site] > Dossier #[ref]`.
- Badges alertes (pesée manquante, devis à valider, retard transport).
- Actions rapides : `Créer devis`, `Planifier transport`, `Scanner QR`, `Ajouter note`, `Télécharger rapport`.

#### 4.3 Onglets principaux
- **Synthèse** :
  - Cartes KPI : poids estimé vs réel, nombre de lots, statut devis, statut transport, valeur estimée.
  - Timeline horizontale des jalons (demande, diagnostic, devis, collecte, réception, démantèlement, clôture).
  - Carte affichant site client et sites destination.
  - Liste des prochaines tâches + alertes.
  - Flux d’activité (actions horodatées) et intervenants clés.
- **Demande & diagnostic** :
  - Détails de la demande initiale (contact, description, documents partagés).
  - Fiche visite (date/heure, technicien, check-in/out, signature client).
  - Tableau lots créés (catégorie, grade, orientation, poids estimé, photos).
  - Section notes technicien et checklist sécurité.
- **Devis** :
  - Tableau éditable des lignes : type (service, matériel, forfait), unité (heure, pièce, palette), quantité, prix unitaire, TVA, total.
  - Résumé financier (HT, TVA, TTC, marge, validité).
  - Historique des versions, validations internes, signature client.
  - Boutons `Envoyer`, `Générer PDF`, `Cloner`.
- **Logistique** :
  - Planning des opérations (enlèvement, transport, livraison, démantèlement) sous forme de timeline ou Gantt.
  - Carte des tournées, distance estimée.
  - Tableau ordres transport (transporteur, véhicule, conducteur, statut, documents associés).
  - Checklist conformité (autorisation accès site, matériel manutention, EPI).
- **Inventaire** :
  - Sélecteur de site → zone → allée → rack → niveau → position.
  - Tableau des lots et composants avec QR code, statut, poids, date d’entrée/sortie.
  - Historique mouvements (scan, transfert, démantèlement).
  - Bouton `Scanner` (webcam/mobile) + génération d’étiquettes.
- **Démantèlement** :
  - Pipeline ordres (à planifier, en cours, terminé).
  - Cartes lot → composants générés (quantité, poids, valeur).
  - Rendement visuel (poids composants / poids lot).
  - Liens vers certificats ou fiches matières.
- **Documents & notes** :
  - Bibliothèque avec filtres (devis, bons de pesée, photos, certificats).
  - Notes collaboratives avec mentions et étiquettes.
  - Export global (ZIP) et ajout depuis glisser‑déposer.
- **Analytics dossier** :
  - Graphiques poids par catégorie, grade, destination.
  - Courbes demandes vs tonnage, temps de cycle.
  - KPI financiers (conversion devis, CA services vs matériels).
  - Comparaisons vs moyenne client ou période précédente.

### 5. Modèle de données (extrait)
- `ClientCompany(id, raison_sociale, siret, adresse_facturation, secteur, created_at)`
- `ClientSite(id, client_id, nom, adresse_complete, coordonnées_gps, type_site, contact_site_id)`
- `Contact(id, client_id, nom, fonction, téléphone, email, préférences_notification)`
- `CaseFile(id, request_id, référence, statut, poids_total_estimé, poids_total_réel, valeur_totale, created_at, closed_at)`
- `PickupRequest(id, client_id, site_id, description_initiale, catégorie_principale, volume_estimé, priorité, statut, created_at, planned_visit_at)`
- `Diagnosis(id, casefile_id, technicien_id, date_visite, notes, signature_client_url)`
- `Lot(id, casefile_id, diagnosis_id, code, catégorie_id, grade, orientation, poids_estimé, poids_réel, volume, statut, qr_code, photos[])`
- `Quotation(id, casefile_id, version, statut, montant_ht, montant_tva, montant_ttc, validité_at, approbateur_id, client_signature_url)`
- `QuotationLine(id, quotation_id, type_ligne, description, unité, quantité, prix_unitaire, taux_tva, ordre_affichage)`
- `TransportOrder(id, casefile_id, lot_id, type, site_source_id, site_destination_id, transporteur_id, date_planifiée, statut, documents[])`
- `StorageLocation(id, site_id, zone, allée, rack, niveau, position, capacité, unité)`
- `InventoryItem(id, lot_id, composant_id, qr_code, storage_location_id, statut, date_entrée, date_sortie)`
- `Component(id, lot_id, catégorie_id, grade, poids, valeur_estimée, qr_code, statut)`
- `WeighingRecord(id, entité_type, entité_id, poids, balance_id, mode_saisie, horodatage, opérateur_id)`
- `CaseParticipant(id, casefile_id, user_id, rôle, disponibilité)`
- `Document(id, casefile_id, type, nom_fichier, url, taille, auteur_id, horodatage)`
- `User(id, nom, email, rôle, mot_de_passe_hash, paramètres_profil, actif)`
- `AuditLog(id, entité, entité_id, action, payload, user_id, horodatage)`

### 6. API REST (exemple d’endpoints)
- `POST /pickup-requests` : créer une demande (planificateur) avec contact, description.
- `GET /pickup-requests?statut=...` : filtrer les demandes.
- `POST /case-files/{id}/diagnosis` : ajouter un diagnostic avec lots et pesées estimées.
- `POST /case-files/{id}/quotation` : générer un devis (versioning automatique).
- `PATCH /quotations/{id}` : mise à jour statut (validé, refusé).
- `POST /case-files/{id}/transport-orders` : créer un ordre logistique.
- `POST /lots/{id}/weighings` : enregistrer une pesée.
- `POST /inventory/movements` : consigner un mouvement (scan QR).
- `POST /lots/{id}/components` : créer des composants issus du démantèlement.
- `GET /analytics/dossiers/{id}` : données agrégées pour l’onglet analytics.
- Webhooks/notifications : `POST /integrations/balance` pour balances connectées, `POST /integrations/transporters` pour retours chauffeur.

### 7. Intégrations & automatisations
- **Balances connectées** : API ou import CSV; validation double (pesée chargement + pesée arrivée).
- **Systèmes transporteurs** : import/export ordres (EDI, CSV, API) + suivi statuts.
- **Génération documents** : service PDF (ex : templating DocRaptor, Puppeteer).
- **Étiquettes QR** : service interne avec génération PNG/SVG; intégration imprimantes Zebra.
- **Notifications** : emails (SendGrid) & SMS (Twilio) selon événements (diagnostic planifié, devis envoyé, collecte confirmée).

### 8. Sécurité & conformité
- Authentification OAuth2 / SSO, MFA optionnel.
- Rôles et permissions granulaires (RBAC).
- Journalisation exhaustive (audit log consultable).
- Chiffrement en transit (TLS) et au repos (PostgreSQL + stockage objet).
- Conformité RGPD : anonymisation contacts inactifs, consentement communication.
- Backups automatiques, plan PRA/PCA.

### 9. Tableau de bord & métriques
- Poids total collecté (tonnes) par période, catégorie, client.
- Nombre de demandes, conversion en devis acceptés, taux de réalisation.
- Poids estimé vs réel (écart global, par technicien).
- Rendement démantèlement (poids composants / poids lot).
- Temps moyen par étape (diagnostic, transport, démantèlement).
- Revenus par type service/matériel, marge brute.

### 10. Roadmap indicative
1. **Atelier cadrage** : valider périmètre, catégories, statuts, KPI.
2. **Spécifications détaillées** : règles métier, maquettes Figma, flow BPMN.
3. **MVP (8-12 semaines)** :
   - Authentification & gestion clients/sites.
   - Pipeline demandes → diagnostic → devis (sans versioning avancé).
   - Planification logistique simple + inventaire basique.
   - Génération QR codes + pesées manuelles.
4. **Itération 2** :
   - Inventaire multi-sites avec placements hiérarchiques.
   - Démantèlement + suivi composants.
   - Tableaux de bord poids et tonnage.
5. **Itération 3** :
   - Intégrations balances, transporteurs.
   - Workflow devis avancé (validation multi-niveau).
   - Portail client externe.
6. **Itération 4** :
   - Analytics avancées, prévisions (IA légère).
   - Applications mobiles offline pour techniciens.

### 11. Stack technique proposée (suggestion)
- **Front-end** : React + TypeScript, UI Chakra ou Tailwind, Zustand/Redux Toolkit pour l’état. Modules PWA + accès caméra (scan QR).
- **Back-end** : NestJS (Node) ou Django REST; PostgreSQL + PostGIS; Redis pour queues rapides; S3/MinIO pour documents.
- **Infra** : Docker/Kubernetes, CI/CD GitHub Actions, monitoring Prometheus/Grafana, logs centralisés (ELK).
- **Qualité** : tests unitaires, e2e (Playwright), lint/format; data validation via Zod (front) / class-validator (back).

### 12. Points d’attention
- Gestion fine du poids : cohérence entre estimé et réel, tolérances, alertes d’écart.
- Traçabilité QR : chaque lot/composant doit avoir un code unique; gérer les réimpressions.
- Performance UI : page dossier peut afficher beaucoup de données → chargement lazy par onglet.
- Accessibilité et ergonomie : thème sombre cohérent, contrastes suffisants, navigation clavier.
- Scalabilité multi-sites : prévoir hiérarchie d’emplacements flexible.
- Sécurité terrain : support offline pour techniciens si zones sans réseau.

