# 🔀 Règles Git, Branching & CI/CD (GIT_AND_CI_CD.md)

---

## 1. Convention de Branching

| Branche | Rôle | Protection |
| :--- | :--- | :--- |
| `main` | **Production** — Code déployé en live | Force-push interdit, merge uniquement après audit |
| `dev` | **Staging** — Intégration et pré-validation | Merge depuis `feature/*` après revue |
| `feature/<nom>` | Développement de fonctionnalité isolée | Libre, supprimée après merge |
| `fix/<nom>` | Correction de bug ciblée | Libre, supprimée après merge |
| `audit/<nom>` | Branche d'audit ou de refactoring lourd | Libre, supprimée après merge |

---

## 2. Convention de Messages de Commit

Format obligatoire : `<type>: <description concise>`

| Préfixe | Usage |
| :--- | :--- |
| `feat:` | Nouvelle fonctionnalité |
| `fix:` | Correction de bug |
| `audit:` | Résultat d'audit, test ajouté ou corrigé |
| `refactor:` | Restructuration sans changement fonctionnel |
| `perf:` | Optimisation de performance |
| `security:` | Correction de vulnérabilité |
| `docs:` | Documentation uniquement |
| `chore:` | Maintenance, mise à jour de dépendances |

**Exemples** :
```
feat: add SSE streaming to /api/chat endpoint
fix: resolve 429 cooldown not resetting after 60s
audit: run full E2E harness — 0 errors on 13 views
security: remove exposed API key from client bundle
```

---

## 3. Workflow de Merge & Déploiement

```text
  feature/xxx ──► dev (merge + tests locaux)
                    │
                    ▼
              Exécution des 3 harnais d'audit :
              ✅ run_e2e_audit.mjs
              ✅ test_api_resilience.mjs
              ✅ audit_contrast_and_ux.mjs
                    │
                    ▼ (si 3/3 passent)
                dev ──► main (merge, tag de version, deploy)
```

### Pré-requis Obligatoires avant Merge en `main`

1. **Les 3 harnais doivent passer** avec 0 erreur critique.
2. **`git pull --rebase origin main`** exécuté avant tout push pour éviter les conflits de merge.
3. **Aucun `console.log` de debug** résiduel dans le code (utiliser `console.warn` ou `console.error` uniquement pour les cas réels).
4. **Les variables d'environnement sensibles** ne doivent pas apparaître dans les fichiers commitables (vérifier `.gitignore`).

---

## 4. Fichier `.gitignore` Minimal Recommandé

```gitignore
node_modules/
.env
.env.local
.env.production
.vercel/
dist/
.DS_Store
*.log
```

---

## 5. Tags de Version & Releases

- Utiliser le versioning sémantique : `vMAJOR.MINOR.PATCH` (ex: `v1.2.0`).
- Créer un tag Git à chaque déploiement en production :
  ```bash
  git tag -a v1.2.0 -m "feat: streaming SSE + cascade Gemini 3.7"
  git push origin v1.2.0
  ```
