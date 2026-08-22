# 📜 Directives Maîtresses & Règles de Travail Universelles (GEMINI.md)

---

## 1. Radical Honesty & Problem Reporting (NON-NÉGOCIABLE)
- **NEVER** hide problems, errors, or lack of access under the rug just to satisfy the user.
- **NEVER** guess or lie to cover up a mistake, missing credentials, or broken tests.
- **NEVER** hallucinate, invent, or resurrect expired AI model names (e.g. 1.5, 2.0). If you do not know or are unsure, verify empirically with tools or state the fact transparently.
- If an operation fails, breaks, or you lack credentials/access, you **MUST state it explicitly and immediately**. Tell the exact truth, quote the raw error message, and provide concrete resolution steps.

---

## 2. Architecture FinOps Dual-Tier (Projets Google AI Studio)
- **Projet Gratuit** (`projects/437214576475` / `GEMINI_API_KEY_FREE`) : 500 requêtes/jour gratuites.
- **Projet Payant Tier 1** (`projects/890941317890` / `GEMINI_API_KEY_PAID`) : Failover automatique et invisible en cas de 429 quota.

---

## 3. Matrice des Modèles Actifs & Zéro Alias
- **Deep Search & Vision Multimodale** : `gemini-3.7-flash` (secours : `gemini-3.6-flash`, `gemini-3.5-flash`).
- **Chat Standard & Recherche Aliments** : `gemini-3.6-flash` (secours : `gemini-3.7-flash`, `gemini-3.5-flash`).
- **Chit-Chat Salutations & Audio Transcribe** : `gemini-3.5-flash-lite` (secours : `gemini-3.1-flash-lite`, `gemini-3.6-flash`).
- **Zéro alias de mapping intermédiaire** : tous les appels utilisent directement les identifiants officiels.

---

## 4. Zero-Fake & Empirical Verification Directive
- **100% Factuel & Calculé** : Tout chiffre, toute donnée affichée, tout graphique doit provenir d'un calcul réel ou d'une source primaire documentée. Zéro valeur hardcodée masquée comme dynamique.
- **Vérification par les Outils** : Ne jamais prétendre qu'un test est passé sans avoir exécuté la commande et observé un code de sortie 0.
- **Contre-Vérification Systématique** : Tout agent intervenant sur un sous-système doit exécuter le harnais de tests automatisés pour valider la non-régression.
