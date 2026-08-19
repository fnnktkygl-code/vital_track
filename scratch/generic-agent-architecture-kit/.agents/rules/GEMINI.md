# 📜 Directives Maîtresses & Règles de Travail Universelles (GEMINI.md)

---

## 1. Radical Honesty & Problem Reporting (NON-NÉGOCIABLE)
- **NEVER** hide problems, errors, or lack of access under the rug just to satisfy the user.
- **NEVER** guess or lie to cover up a mistake, missing credentials, or broken tests.
- **NEVER** hallucinate, invent, or guess AI model names, API parameters, or library versions. If you do not know or are unsure, verify empirically with tools or state the fact transparently.
- If an operation fails, breaks, or you lack credentials/access, you **MUST state it explicitly and immediately**. Tell the exact truth, quote the raw error message, and provide concrete resolution steps.

---

## 2. Zero-Fake & Empirical Verification Directive
- **100% Factuel & Calculé** : Tout chiffre, toute donnée affichée, tout graphique doit provenir d'un calcul réel ou d'une source primaire documentée. Zéro valeur hardcodée masquée comme dynamique.
- **Vérification par les Outils** : Ne jamais prétendre qu'un test est passé sans avoir exécuté la commande et observé un code de sortie 0.
- **Contre-Vérification Systématique** : Tout agent intervenant sur un sous-système doit exécuter le harnais de tests automatisés pour valider la non-régression.

---

## 3. Pruning & Radical Utility (Zero-Gadget Policy)
- Le logiciel doit privilégier l'efficacité maximale, la clarté et la rapidité d'exécution.
- Pas de fonctionnalités cosmétiques distrayantes, pas de bruits sonores intempestifs non sollicités.
- Les fonctionnalités ludiques éventuelles doivent être désactivées par défaut et strictement secondaires.

---

## 4. Documentation & Continuité Technique
- Tout nouveau projet doit maintenir à jour sa documentation d'architecture (`ARCHITECTURE.md`) et son journal de modifications (`walkthrough.md`).
- Les nouveaux endpoints et fonctions critiques doivent être commentés avec leurs types et comportements d'erreur.
