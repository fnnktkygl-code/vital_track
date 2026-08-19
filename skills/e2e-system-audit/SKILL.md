---
name: e2e-system-audit
description: Guide opérationnel pour orchestrer des suites d'audit de bout en bout avec Puppeteer/Playwright sur tous les parcours utilisateurs, boutons, vues et formulaires.
---

# 🔬 Skill : E2E System Audit

## Objectif
Permettre à l'équipe d'agents de parcourir exhaustivement l'application comme un utilisateur réel afin de traquer les régressions, les erreurs console et les dysfonctionnements d'interface.

## Méthodologie d'Audit
1. **Lancement du Navigateur Headless** (viewport 1440x900 et mobile 375x812).
2. **Surveillance Console** : Enregistrer tous les logs de type `error` et `unhandledRejection`.
3. **Parcours des Vues** :
   - Naviguer sur chaque page/onglet via les liens de navigation.
   - Vérifier la présence de la classe CSS `.active` et l'affichage des conteneurs cibles.
4. **Interactions Fonctionnelles** :
   - Remplir les champs de recherche et vérifier le rendu des listes.
   - Cliquer sur les filtres et vérifier les résultats.
   - Ajouter un élément et vérifier sa persistance dans le store local et les graphiques.
   - Ouvrir et fermer les modales.
5. **Rapport Métrique** : Fournir un résumé avec nombre de vues testées, temps d'exécution et liste des erreurs détectées.
