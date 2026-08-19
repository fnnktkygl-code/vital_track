# 📐 Conventions de Nommage & Code (NAMING_AND_CODE_CONVENTIONS.md)

---

## 1. Nommage des Fichiers

| Type de Fichier | Convention | Exemple |
| :--- | :--- | :--- |
| Routes API serverless | `kebab-case` | `api/chat-history.js`, `api/user-profile.js` |
| Modules utilitaires | `camelCase` | `authGuard.js`, `llmCascade.js` |
| Composants UI (React/Vue) | `PascalCase` | `DashboardView.jsx`, `ChatPanel.vue` |
| Fichiers CSS / SCSS | `kebab-case` | `design-tokens.css`, `modal-overlay.css` |
| Fichiers de données statiques | `kebab-case` | `electric-foods.json`, `plant-index.json` |
| Fichiers de test | `<nom>.test.js` ou `<nom>.spec.js` | `cascade.test.js`, `auth.spec.js` |
| Fichiers de configuration | standards établis | `vercel.json`, `.env.local`, `vite.config.js` |

---

## 2. Nommage des Variables & Fonctions

| Élément | Convention | Exemple |
| :--- | :--- | :--- |
| Variables locales | `camelCase` | `let currentModel`, `const apiKey` |
| Fonctions | `camelCase` (verbe + nom) | `fetchUserProfile()`, `renderDashboard()` |
| Constantes globales | `UPPER_SNAKE_CASE` | `COMPLEX_CASCADE`, `MAX_RETRIES` |
| Classes / Constructeurs | `PascalCase` | `class CascadeRotator`, `class ToastManager` |
| Propriétés d'objet / JSON | `camelCase` | `{ userName, apiKey, isStreaming }` |
| Variables d'environnement | `UPPER_SNAKE_CASE` | `GEMINI_API_KEY`, `APP_SECRET_KEY` |
| Tokens CSS | `--kebab-case` | `--bg-card`, `--text-dim`, `--color-success` |
| ID HTML | `kebab-case` | `id="main-dashboard"`, `id="chat-input"` |
| Classes CSS | `kebab-case` | `class="dash-card"`, `class="nav-btn active"` |

---

## 3. Structure des Répertoires

```text
project-root/
├── api/                    # Routes serverless (Vercel / Netlify)
│   ├── _lib/               # Modules partagés (authGuard, cascade, helpers)
│   └── chat.js             # Endpoint public
├── web-app/
│   ├── src/
│   │   ├── main.js         # Point d'entrée applicatif
│   │   └── index.css       # Design system centralisé
│   └── public/             # Assets statiques (images, PDFs, favicons)
├── .agents/rules/          # Règles pour les agents IA
├── skills/                 # Compétences spécialisées
├── harnesses/              # Scripts de test automatisés
└── templates/              # Modèles réutilisables (middleware, configs)
```

---

## 4. Règles de Style de Code

1. **Indentation** : 2 espaces (pas de tabulations).
2. **Point-virgule** : Obligatoire en fin d'instruction JavaScript.
3. **Guillemets** : Simples (`'texte'`) pour JavaScript, doubles pour JSON et HTML.
4. **Longueur de ligne maximale** : 120 caractères (éviter les lignes de 300 chars non lisibles).
5. **Fonctions fléchées** : Préférées pour les callbacks et handlers courts.
6. **Commentaires** :
   - Commentaire de bloc `/** */` pour les fonctions exportées (documenter les paramètres et le retour).
   - Commentaire en ligne `//` pour les décisions non évidentes.
   - ❌ Pas de commentaires redondants (`// increment i` au-dessus de `i++`).
