# 🛑 Règles de Gestion d'Erreurs & Récupération (ERROR_HANDLING_AND_RECOVERY.md)

---

## 1. Principe Fondamental

> **L'utilisateur ne doit jamais voir une erreur technique brute.**
> Chaque erreur doit être interceptée, traduite en message humain compréhensible, et accompagnée d'une action de récupération claire.

---

## 2. Gestion des Erreurs Frontend (Côté Client)

### 2.1 Pattern `try/catch` Systématique

Toute fonction asynchrone (appel API, lecture de stockage local, parsing JSON) doit être enveloppée dans un `try/catch` :

```javascript
try {
  const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`);
  const data = await res.json();
  // traitement normal...
} catch (err) {
  showToast(`Impossible de contacter le serveur. Vérifiez votre connexion.`, 'error');
  console.error('[API Error]', err.message);
}
```

### 2.2 Messages d'Erreur Humains

| Erreur Technique | Message Utilisateur |
| :--- | :--- |
| `TypeError: Failed to fetch` | « Connexion au serveur impossible. Vérifiez votre réseau. » |
| `SyntaxError: Unexpected token < in JSON` | « Le serveur a renvoyé une réponse inattendue. Réessayez. » |
| `HTTP 429 Too Many Requests` | « Trop de requêtes envoyées. Patientez quelques secondes. » |
| `HTTP 500 Internal Server Error` | « Erreur interne du serveur. Réessayez dans un instant. » |
| `HTTP 503 Service Unavailable` | « Le service est temporairement indisponible. » |
| `QuotaExceededError` (localStorage) | « Espace de stockage local plein. Supprimez d'anciennes données. » |

### 2.3 Interdictions Absolues

- ❌ **JAMAIS** laisser un `catch` vide (`catch (e) {}`) — c'est du masquage d'erreur.
- ❌ **JAMAIS** afficher un message technique brut à l'utilisateur (`err.stack`, `TypeError: Cannot read properties of undefined`).
- ❌ **JAMAIS** utiliser `alert()` pour notifier une erreur — utiliser le système de toasts.

---

## 3. Détection Réseau & Mode Offline

```javascript
window.addEventListener('online', () => showToast('Connexion rétablie.', 'success'));
window.addEventListener('offline', () => showToast('Connexion perdue. Mode hors ligne.', 'warning'));
```

### Comportement en Mode Offline

1. Les données déjà chargées restent visibles et navigables (pas de page blanche).
2. Les actions nécessitant le réseau (envoi de message, sauvegarde) sont désactivées avec un indicateur visuel.
3. À la reconnexion, les actions en file d'attente sont rejouées automatiquement si possible.

---

## 4. Retry Automatique avec Backoff Exponentiel

Pour les requêtes réseau critiques (sauvegarde de données, synchronisation), implémenter un retry automatique :

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return res; // 4xx client errors: don't retry
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### Règles de Retry

| Code HTTP | Retry ? | Raison |
| :--- | :--- | :--- |
| 400 Bad Request | ❌ Non | Erreur du client, inutile de réessayer |
| 401 Unauthorized | ❌ Non | Clé invalide, réessayer ne changera rien |
| 404 Not Found | ❌ Non | Ressource absente |
| 429 Too Many Requests | ✅ Oui | Temporaire, respecter le backoff |
| 500 Internal Server Error | ✅ Oui | Peut être transitoire |
| 502 / 503 / 504 | ✅ Oui | Indisponibilité temporaire |

---

## 5. Logging Structuré (Console)

```javascript
// ✅ Correct : préfixe contextuel + niveau approprié
console.error('[Chat API]', 'Cascade exhausted after 7 models', err.message);
console.warn('[Auth]', 'X-App-Key header missing, falling back to same-origin check');

// ❌ Incorrect : log sans contexte
console.log(err);
console.log('something went wrong');
```

Niveaux de log autorisés en production :
- `console.error()` — Erreurs réelles nécessitant une action
- `console.warn()` — Comportements dégradés mais non bloquants
- ❌ `console.log()` interdit en production (debug uniquement)
