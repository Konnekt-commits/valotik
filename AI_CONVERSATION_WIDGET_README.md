# Widget d'Analyse IA de Conversations - ValoTik Tak

## Vue d'ensemble

Le widget d'analyse IA permet d'enregistrer une conversation téléphonique avec un client et de créer automatiquement une demande d'enlèvement (Pickup Request) avec toutes les informations extraites par l'intelligence artificielle.

## Architecture

### Composants Frontend

1. **AIConversationWidget.tsx** - Widget flottant
   - Bouton circulaire en bas à droite de l'application
   - Animation de pulsation pour attirer l'attention
   - Ouvre une modal fullscreen au clic

2. **AIConversationAnalyzer.tsx** - Interface principale
   - Reconnaissance vocale en temps réel (Web Speech API)
   - Transcription de la conversation
   - Analyse IA via OpenAI GPT-4
   - Extraction automatique des informations
   - Création de demande en un clic

### Backend API

1. **aiController.ts** - Contrôleur principal
   - `POST /api/ai/analyze-conversation` - Analyse une transcription avec GPT-4
   - `POST /api/ai/create-pickup-from-conversation` - Crée une demande complète

2. **aiRoutes.ts** - Routes de l'API IA

## Installation

### 1. Ajouter le widget dans votre application

```tsx
import AIConversationWidget from './AIConversationWidget';

function App() {
  return (
    <>
      {/* Vos composants existants */}
      <AIConversationWidget />
    </>
  );
}
```

### 2. Configuration Backend

Le fichier `.env` contient déjà la clé API OpenAI :

```env
OPENAI_API_KEY=your-openai-api-key-here
```

⚠️ **IMPORTANT** : Cette clé ne doit jamais être exposée côté client. Toutes les requêtes à OpenAI passent par le backend.

### 3. Démarrer les services

Backend :
```bash
cd backend
npm run dev
```

Frontend :
```bash
npm run dev
```

## Utilisation

### 1. Accéder au widget

- Cliquez sur le bouton circulaire violet en bas à droite de l'écran
- Une modal fullscreen s'ouvre

### 2. Enregistrer une conversation

1. Cliquez sur le bouton **microphone** 🎙️
2. Autorisez l'accès au microphone si demandé
3. Parlez naturellement pendant la conversation téléphonique
4. La transcription s'affiche en temps réel dans le panneau de gauche
5. Cliquez à nouveau sur le microphone pour arrêter l'enregistrement

### 3. Analyser la conversation

1. Cliquez sur le bouton **Sparkles** ✨ (apparaît automatiquement après l'enregistrement)
2. L'IA analyse la transcription (environ 2-5 secondes)
3. Les informations extraites apparaissent dans le panneau de droite :
   - **Contact** : Nom, fonction, téléphone, email
   - **Entreprise** : Raison sociale, ville, adresse
   - **Contexte** : Type de matériel, quantité, date RDV, notes

### 4. Créer la demande

1. Vérifiez les informations extraites
2. Cliquez sur **"Créer la demande"** (bouton vert)
3. Une demande complète est créée automatiquement :
   - Client
   - Site
   - Contact
   - Pickup Request
   - Case File

## Informations extraites par l'IA

L'IA GPT-4 extrait automatiquement :

### Contact
- Prénom et nom
- Fonction dans l'entreprise
- Téléphone
- Email

### Entreprise
- Raison sociale
- Ville
- Adresse complète

### Contexte de la demande
- Type de matériel (ex: "serveurs", "ordinateurs portables", "équipements réseau")
- Quantité estimée
- Date de rendez-vous souhaitée
- Notes importantes (urgence, contraintes d'accès, etc.)

## Exemples de conversations

### Exemple 1 - Conversation simple

```
"Bonjour, je m'appelle Marie Dupont, je suis responsable IT chez TechCorp à Lyon.
Nous avons une quarantaine de PC portables à recycler.
Mon numéro c'est le 06 12 34 56 78 et mon email marie.dupont@techcorp.fr.
On pourrait se voir mardi prochain ?"
```

**Résultat extrait :**
- Contact : Marie Dupont, Responsable IT
- Téléphone : 06 12 34 56 78
- Email : marie.dupont@techcorp.fr
- Entreprise : TechCorp (Lyon)
- Matériel : PC portables
- Quantité : ~40
- Date RDV : Mardi prochain

### Exemple 2 - Conversation détaillée

```
"Société DataCenter Plus, on est basés à Marseille, 15 avenue de la République.
Je suis le directeur technique, Jean Martin.
On a un projet de renouvellement de notre salle serveurs,
donc on doit se débarrasser d'environ 25 serveurs rack plus une cinquantaine d'écrans.
C'est assez urgent, idéalement avant fin de mois.
Vous pouvez me rappeler au 04 91 23 45 67 ou m'envoyer un mail à j.martin@dcplus.fr"
```

**Résultat extrait :**
- Contact : Jean Martin, Directeur technique
- Téléphone : 04 91 23 45 67
- Email : j.martin@dcplus.fr
- Entreprise : DataCenter Plus (Marseille, 15 avenue de la République)
- Matériel : Serveurs rack + Écrans
- Quantité : 25 serveurs + 50 écrans
- Notes : Urgent - avant fin de mois

## Endpoints API

### POST /api/ai/analyze-conversation

Analyse une transcription et extrait les informations structurées.

**Request:**
```json
{
  "transcript": "texte de la conversation...",
  "prompt": "prompt système pour GPT-4..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "found": true,
    "contact": {
      "prenom": "Marie",
      "nom": "Dupont",
      "fonction": "Responsable IT",
      "telephone": "06 12 34 56 78",
      "email": "marie.dupont@techcorp.fr"
    },
    "entreprise": {
      "nom": "TechCorp",
      "ville": "Lyon",
      "adresse": "45 Avenue de la République, 69003 Lyon"
    },
    "contexte": {
      "type_materiel": "PC portables",
      "quantite": "40",
      "date_rdv": "Mardi prochain",
      "notes": ""
    }
  }
}
```

### POST /api/ai/create-pickup-from-conversation

Crée une demande complète à partir des données extraites.

**Request:**
```json
{
  "contact": { ... },
  "entreprise": { ... },
  "contexte": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "...",
    "siteId": "...",
    "contactId": "...",
    "pickupRequestId": "...",
    "caseFileId": "..."
  },
  "message": "Demande créée avec succès depuis la conversation IA"
}
```

## Compatibilité navigateur

Le widget utilise la Web Speech API qui est supportée par :
- ✅ Chrome / Edge (Chromium)
- ✅ Safari (macOS / iOS)
- ❌ Firefox (support limité)

## Sécurité

- ✅ Clé API OpenAI stockée côté serveur uniquement
- ✅ Pas d'exposition de clés sensibles côté client
- ✅ Validation des données avant création en BDD
- ✅ Logs d'audit pour traçabilité

## Coûts OpenAI

Modèle utilisé : **GPT-4o**
- Coût par conversation : ~$0.01 - $0.05 (selon longueur)
- Token limit : 1200 tokens max pour la réponse

## Dépannage

### Le microphone ne fonctionne pas
- Vérifiez les permissions du navigateur
- Utilisez HTTPS (requis pour Web Speech API)
- Testez sur Chrome/Safari

### L'analyse échoue
- Vérifiez que `OPENAI_API_KEY` est configurée dans `.env`
- Vérifiez les logs backend pour les erreurs API
- Assurez-vous que le backend est démarré

### Les données ne sont pas créées
- Vérifiez la connexion à la base de données
- Consultez les logs backend
- Vérifiez que tous les champs requis sont présents

## Améliorations futures

- [ ] Support multilingue (anglais, espagnol)
- [ ] Amélioration de la précision d'extraction
- [ ] Édition manuelle des données extraites avant création
- [ ] Historique des conversations
- [ ] Export des transcriptions
- [ ] Intégration avec CRM existant
