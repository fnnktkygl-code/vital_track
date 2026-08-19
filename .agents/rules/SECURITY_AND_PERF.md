# 🔒 Règles de Sécurité, Performance & Gestion Mémoire (SECURITY_AND_PERF.md)

---

## 1. Sécurité & Protection des Secrets (OWASP Top 10)
1. **Zéro Fuite Côté Client** : Aucune clé privée d'API tierce (OpenAI, Gemini, Stripe, Supabase Service Role) ne doit apparaître dans les bundles JavaScript frontend (`import.meta.env.VITE_*` doit être strictement limité aux clés publiques non-sensibles).
2. **AuthGuard & Validation Same-Origin** : Tout endpoint API serverless doit valider l'authenticité de l'émetteur via `Sec-Fetch-Site: same-origin`, matching `Host` / `Referer`, ou en-tête sécurisé `X-App-Key`.
3. **Protection XSS & Injection** :
   - Échapper systématiquement tout contenu saisi par l'utilisateur ou retourné par l'IA avant insertion dans le DOM via une fonction `esc()` ou `textContent`.
   - Utiliser `DOMPurify` pour le rendu de Markdown ou HTML riche.
4. **En-têtes HTTP de Sécurité** : Configurer systématiquement `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`.

---

## 2. Performance, Bundle & Réseau
1. **Budget de Poids du Bundle** :
   - Maintenir le bundle JS minifié sous 750 Ko (gzippé < 150 Ko).
   - Préférer le Vanilla JS/CSS hautement optimisé aux dépendances lourdes tierces quand cela apporte un gain de fluidité mesurable.
2. **Optimisation des Requêtes Réseau** :
   - Mettre en cache les données statiques (index de recherche, référentiels botaniques ou financiers).
   - Préférer le streaming Server-Sent Events (SSE) pour les interactions LLM afin d'éviter les timeouts de 10 secondes sur les hébergements serverless (ex: Vercel Free).

---

## 3. Gestion de la Mémoire & Nettoyage des Ressources
1. **Destruction des Écouteurs & Timers** :
   - Tout `setInterval`, `setTimeout` récurrent ou `requestAnimationFrame` doit stocker son identifiant et être explicitement nettoyé (`clearInterval`, `cancelAnimationFrame`) lors du démontage du composant ou de la fermeture d'une modale.
2. **Gestion des Contextes Audio & Vidéo** :
   - Fermer ou suspendre les instances `AudioContext` inactives pour éviter la saturation audio du navigateur.
