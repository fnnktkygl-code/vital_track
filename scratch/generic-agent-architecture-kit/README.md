# 🛡️ Generic Agent Architecture & Quality Hardening Kit

> **Kit universel de standardisation, d'audit E2E continu, de sécurité sans compromis et d'ingénierie logicielle pour équipes d'agents IA et développeurs.**

Ce kit fournit le socle architectural complet, réutilisable pour tout nouveau projet (SaaS, FinTech, HealthTech, E-commerce, Portfolio, etc.). Il définit les règles fondamentales non-négociables, les harnais de tests automatisés (Headless Browser & API), les cascades de résilience IA, et les standards d'accessibilité UX.

---

## 📂 Contenu du Kit

```text
├── .agents/rules/
│   ├── GEMINI.md                     # Directives maîtresses, honnêteté radicale, zéro-fake, zéro dette
│   ├── SECURITY_AND_PERF.md          # Standards OWASP, protection des clés, memory leaks, budget perfs
│   ├── UI_UX_DESIGN_SYSTEM.md        # Palette sémantique, WCAG AAA, états des boutons, feedback toasts
│   ├── AI_MODEL_CASCADE_RULES.md     # Gestion des cascades LLM, streaming SSE, anti-timeout serverless
│   ├── GIT_AND_CI_CD.md              # Branching, commits conventionnels, pré-requis de merge & tags
│   ├── ERROR_HANDLING_AND_RECOVERY.md # Gestion d'erreurs frontend, retry backoff, mode offline
│   ├── NAMING_AND_CODE_CONVENTIONS.md # Nommage fichiers/variables, structure répertoires, style de code
│   ├── SEO_AND_META.md               # Meta tags, Open Graph, HTML sémantique, robots.txt, sitemap
│   └── I18N_AND_LOCALIZATION.md      # Fichiers de traduction JSON, détection locale, interpolation
├── skills/
│   ├── radical-truth-and-rigor/      # Protocole d'intégrité factuelle et contre-vérification entre agents
│   ├── e2e-system-audit/             # Protocole d'audit automatisé de bout en bout (Puppeteer/Playwright)
│   ├── api-resilience-cascade/       # Ingénierie des cascades d'APIs et cooldown RPM/TPM
│   ├── ui-ux-accessibility-auditor/  # Contrôle des contrastes, navigation clavier et micro-interactions
│   ├── feature-pruning-and-utility/  # Chasse aux gadgets superflus, maximisation de l'utilité clinique
│   └── responsive-mobile-auditor/    # Audit responsive mobile-first, breakpoints, zones tactiles
├── harnesses/
│   ├── run_e2e_audit.mjs             # Moteur de test E2E Puppeteer générique et paramétrable
│   ├── test_api_resilience.mjs       # Suite de test de résilience API (200, 400, 401, 405, SSE streaming)
│   └── audit_contrast_and_ux.mjs     # Analyseur automatisé de contraste et de conformité des boutons
├── templates/
│   ├── api/_lib/authGuard.js         # Middleware de sécurité robuste (API Key, Same-Origin, Referer)
│   ├── api/_lib/llmCascade.js        # Rotateur de modèles IA adaptatif avec registre de cooldown
│   ├── api/chat.js                   # Route de streaming SSE contournant les timeouts 10s serverless
│   ├── .env.example                  # Template des variables d'environnement sécurisées
│   └── vercel.json                   # En-têtes HTTP de sécurité (CSP, X-Frame, HSTS) et routage
└── ARCHITECTURE.md                   # Manuel technique approfondi & charte d'ingénierie
```

---

## ⚡ Démarrage Rapide sur un Nouveau Projet

1. **Décompresser l'archive** à la racine de votre nouveau projet :
   ```bash
   unzip generic-agent-architecture-kit.zip -d ./
   ```
2. **Placer les règles pour les agents** :
   - Les fichiers `.agents/rules/` sont automatiquement découverts par l'IDE et les agents.
   - Les compétences `skills/` peuvent être copiées dans `.agents/skills/` ou dans votre configuration globale.
3. **Configurer les variables d'environnement** :
   ```bash
   cp templates/.env.example .env.local
   ```
4. **Lancer la suite d'audit dès le premier jour** :
   ```bash
   node harnesses/run_e2e_audit.mjs --url http://localhost:5173
   node harnesses/test_api_resilience.mjs --url http://localhost:5173
   ```

---

## 🧭 Principes Fondamentaux Non-Négociables

1. **Honnêteté Radicale & Zéro Fake** : Aucune donnée inventée, aucun modèle fictif, aucun masquage de bug. Si un test échoue ou qu'un accès manque, l'agent doit le notifier immédiatement.
2. **Audit Continu dès le Jour 1** : Tout nouveau composant ou endpoint doit disposer d'un test automatisé vérifiable.
3. **Sécurité par Défaut** : Aucune clé secrète exposée côté client, protection Same-Origin stricte, assainissement systématique des entrées (`DOMPurify` / échappement HTML).
4. **Utilité Maximale (Zero-Gadget)** : Priorité absolue aux fonctionnalités à forte valeur factuelle pour l'utilisateur final.
