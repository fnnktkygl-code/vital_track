---
name: api-resilience-cascade
description: Méthodes d'ingénierie pour concevoir des cascades d'appels API tolérantes aux pannes, des rotateurs de modèles IA et du streaming SSE robuste.
---

# ⚡ Skill : API Resilience & Model Cascade

## Principes Directeurs
1. **Ordre de Priorité Adaptatif** :
   - Définir une liste ordonnée de modèles d'IA réels (du plus intelligent au plus économe).
   - Basculer automatiquement en cas de réponse non-200.
2. **Gestion de Quota en Mémoire (Cooldown)** :
   - Stocker un timestamp de quarantaine pour tout modèle ayant renvoyé un statut `429 Too Many Requests`.
   - Éviter d'envoyer des requêtes à un modèle sous cooldown pendant la période définie (ex: 60s).
3. **Pacing & Anti-Burst** :
   - Espacer les appels consécutifs d'au moins 200 ms pour lisser les pics de trafic.
4. **Protocole de Streaming Server-Sent Events (SSE)** :
   - Émettre des chunks `data: {"text": "..."}\n\n` en direct pour garder la socket active et éliminer tout risque de timeout 10s sur plateforme serverless.
