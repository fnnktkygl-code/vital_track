# 🤖 Règles de Gestion des Modèles IA & Cascades Serverless (AI_MODEL_CASCADE_RULES.md)

---

## 1. Principes de Cascade & Tolérance aux Pannes
Pour toute intégration d'IA (chat, analyse de données, scanner, recherche intelligente), le backend doit utiliser une **architecture en cascade adaptative** :
1. **Tentative Prioritaire** sur le modèle de référence choisi (ex: `gemini-3.7-flash` ou `gemini-3.5-pro`).
2. **Interception des Erreurs Quota (429) & Indisponibilité (503)** :
   - Mise en quarantaine temporaire du modèle (cooldown 60s).
   - Bascule automatique et transparente vers le modèle de secours suivant (ex: `gemini-3.6-flash`, `gemini-3.5-flash`, `gemma-4-31b-it`).
3. **Fallback Déterministe Heuristique** :
   - Si tous les modèles d'IA distants échouent (ex: coupure réseau externe ou quotas épuisés), une fonction heuristique locale garantit une réponse valide structurée.

---

## 2. Streaming SSE vs Requêtes Synchrones
1. **Contournement des Timeouts Serverless** :
   - Les environnements serverless (ex: Vercel Free) coupent les connexions après **10 secondes**.
   - Tout appel d'IA conversationnelle ou d'analyse longue doit obligatoirement utiliser le protocole **Server-Sent Events (`text/event-stream`)**.
   - Le premier octet (TTFB) doit être émis sous 1 seconde, maintenant ainsi la connexion ouverte pendant toute la génération.
2. **Parsing Résilient Côté Client** :
   - Le frontend doit supporter à la fois la lecture en flux de chunks SSE (`ReadableStreamDefaultReader`) et la reconstitution de blocs JSON structurés.
