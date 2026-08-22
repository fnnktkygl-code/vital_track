# 🤖 Règles de Gestion des Modèles IA & Cascades Serverless (AI_MODEL_CASCADE_RULES.md)

---

## 1. Principes de Cascade FinOps & Dual-Tier Google AI Studio
VitalTrack fonctionne avec **2 comptes / clés Google AI Studio** :
1. **Clé Gratuite (`GEMINI_API_KEY_FREE`)** : Projet `projects/437214576475` (500 requêtes/jour gratuites à 0,00 €).
2. **Clé Payante (`GEMINI_API_KEY_PAID` / `GEMINI_API_KEY`)** : Projet `projects/890941317890` (Tier 1 Paid pour production).

### Comportement d'Exécution :
- Tout appel d'IA passe en priorité sur la clé gratuite si configurée.
- En cas d'erreur 429 (quota journalier ou RPM) ou 503 sur la clé gratuite, bascule transparente et instantanée vers la clé payante.
- Si l'utilisateur fournit `x-gemini-key`, exécuter directement avec sa clé explicite.

---

## 2. Matrice des Modèles Actifs (ZÉRO MODÈLE EXPIRÉ, ZÉRO ALIAS)
Ne jamais utiliser d'anciens modèles expirés (1.5-pro, 1.5-flash, 2.0-flash) ni d'alias inutiles. Utiliser exclusivement les identifiants directs :

- **`gemini-3.7-flash`** :
  - Deep Search Bilan Clinique (`api/deep-search.js`)
  - Analyse d'Images repas & iris (`api/analyze-image.js`)
  - Ingestion documentaire (`api/ingest-pdf.js`, `api/ingest-url.js`)
  - Requêtes de chat denses et complexes (> 300 caractères)
  - Cascade de secours : `['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash']`

- **`gemini-3.6-flash`** :
  - Chat IA — Questions standard de santé & vitalisme (`api/chat.js`)
  - Recherche et classification d'aliments (`api/searchFood.js`, `api/analyze-text.js`)
  - Cascade de secours : `['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash']`

- **`gemini-3.5-flash-lite`** :
  - Chat IA — Salutations, politesse & small talk ("salut", "comment tu vas", "ça va")
  - Transcription audio multimodale (`api/transcribe.js`)
  - Cascade de secours : `['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash']`

---

## 3. Streaming SSE vs Requêtes Synchrones
1. **Contournement des Timeouts Serverless** :
   - Les environnements serverless coupent les connexions après 10 à 15 secondes.
   - Les appels de chat utilisent le protocole Server-Sent Events (`text/event-stream`).
   - Le premier chunk doit être émis sous 1 seconde.
2. **Bypass RAG Intelligent pour Chit-Chat** :
   - Les requêtes de salutation n'injectent pas le corpus de 10 Mo pour une latence < 250 ms.
