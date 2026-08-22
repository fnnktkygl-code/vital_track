# 📜 Directives Maîtresses & Mémoire Permanente Gemini (GEMINI.md)

---

## 1. Radical Honesty & Problem Reporting (NON-NÉGOCIABLE)
- **NEVER** hide problems, errors, or lack of access under the rug just to satisfy the user.
- **NEVER** guess or lie to cover up a mistake, missing credentials, or broken tests.
- **NEVER** hallucinate, invent, or resurrect retired/expired AI models (ex: 1.5-flash, 1.5-pro, 2.0-flash).
- If an operation fails, breaks, or you lack credentials/access, you **MUST state it explicitly and immediately**. Tell the exact truth, quote the raw error message, and provide concrete resolution steps.

---

## 2. Architecture des Deux Projets Google Gemini & Stratégie FinOps

L'application VitalTrack est structurée autour de **2 projets Google AI Studio / GCP distincts** :

### 🔹 Projet 1 : Gratuit / Tests Internes ("Vital Track Free Tier for Test")
- **ID Projet Google** : `projects/437214576475` (`gen-lang-client-0560133151`)
- **Niveau de Facturation** : Niveau sans frais (0,00 €) — Quota de 500 requêtes/jour par famille de modèle.
- **Variables d'environnement** : `GEMINI_API_KEY_FREE` (ou `GEMINI_FREE_KEY`).
- **Objectif** : Tests développeur et absorption des requêtes gratuites journalières à coût zéro.

### 🔹 Projet 2 : Payant / Production Utilisateurs ("Vital Track")
- **ID Projet Google** : `projects/890941317890` (`gen-lang-client-0061098426`)
- **Niveau de Facturation** : Niveau 1 · Prépaiement (Tier 1 Paid) — Dépenses mensuelles maîtrisées.
- **Variables d'environnement** : `GEMINI_API_KEY_PAID` (ou `GEMINI_PAID_KEY` / `GEMINI_API_KEY`).
- **Objectif** : Production stable et résiliente pour tous les utilisateurs finaux sans blocage de quota.

### ⚡ Mécanisme de Cascade FinOps (Failover Transparent)
1. **Priorité 1** : Utiliser la clé gratuite (`GEMINI_API_KEY_FREE`) pour consommer les 500 RPD à 0,00 €.
2. **Priorité 2 (Failover)** : En cas d'erreur 429 (quota journalier ou RPM) ou 503, basculer instantanément et de façon invisible sur la clé payante Tier 1 (`GEMINI_API_KEY_PAID`).
3. **Clé Utilisateur** : Si l'utilisateur fournit une clé personnelle dans les en-têtes (`x-gemini-key`), elle est prioritaire.

---

## 3. Matrice d'Attribution des Modèles IA par Fonctionnalité

> **RÈGLE ABSOLUE : ZÉRO MODÈLE EXPIRÉ (Pas de 1.5, pas de 2.0). ZÉRO ALIAS OBFUSQUANT (Pas de table d'alias intermédiaires inutiles).**
> Tous les appels utilisent les identifiants directs officiels de Google Generative Language.

| Fonctionnalité IA | Modèle Primaire | Cascade de Secours | Rationale Qualité / Vitesse / Coût |
|---|---|---|---|
| **Deep Search (Bilan Clinique Global & RAG)** | `gemini-3.7-flash` | `gemini-3.6-flash` ➔ `gemini-3.5-flash` | Raisonnement clinique profond, synthèse multi-émonctoires (Reins, Côlon, Foie, Poumons, Peau) et génération JSON stricte. |
| **Analyse d'Images (Repas, Assiettes, Iris)** | `gemini-3.7-flash` | `gemini-3.6-flash` ➔ `gemini-3.5-flash` | Vision multimodale HD, reconnaissance fine des ingrédients et portions. |
| **Chat IA — Questions Vitalisme & Santé** | `gemini-3.6-flash` | `gemini-3.7-flash` ➔ `gemini-3.5-flash` | Fluidité conversationnelle, intégration du RAG 10 Mo et protocoles de jeûne. |
| **Chat IA — Salutations & Small Talk ("salut", "ça va")** | `gemini-3.5-flash-lite` | `gemini-3.1-flash-lite` ➔ `gemini-3.6-flash` | Latence ultra-faible (< 250ms), coût minimal, bypass RAG (0 token gaspillé). |
| **Recherche Alimentaire & Analyse de Plats** | `gemini-3.6-flash` | `gemini-3.7-flash` ➔ `gemini-3.5-flash` | Évaluation PRAL, NOVA, densité vitale et classification électrique / hybride / mucogène. |
| **Transcription Vocale Audio** | `gemini-3.5-flash-lite` | `gemini-3.6-flash` | Transcodage audio multimodal direct rapide et économique. |
| **Ingestion PDF & Web Scraping** | `gemini-3.7-flash` | `gemini-3.6-flash` | Structuration dense de documents et extraction de connaissances. |

---

## 4. Quotas et Limites Officielles (Google AI Studio)
- `gemini-3.7-flash` : 1000 RPM / 4 000 000 TPM / 4000 RPD (Paid Tier 1) | 15 RPM / 1M TPM / 500 RPD (Free)
- `gemini-3.6-flash` : 1000 RPM / 4 000 000 TPM / 4000 RPD (Paid Tier 1) | 15 RPM / 1M TPM / 500 RPD (Free)
- `gemini-3.5-flash-lite` : 1500 RPM / 4 000 000 TPM / 4000 RPD (Paid Tier 1) | 30 RPM / 1M TPM / 500 RPD (Free)
- `gemini-3.1-flash-lite` : 1500 RPM / 4 000 000 TPM / 4000 RPD (Paid Tier 1) | 30 RPM / 1M TPM / 500 RPD (Free)
