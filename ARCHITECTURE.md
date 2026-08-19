# 📐 Manuel d'Architecture & Charte de Qualité Universelle

---

## 1. Philosophie & Cadre Éthique pour Agents IA

Tout agent ou développeur opérant sur un projet appliquant cette charte est soumis aux **5 Piliers d'Ingénierie Inébranlables** :

```text
       ┌─────────────────────────────────────────────────────────────┐
       │             LES 5 PILIERS D'INGÉNIERIE IA                   │
       └─────────────────────────────────────────────────────────────┘
          │                   │                   │
  ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
  │   VÉRITÉ &    │   │  AUDIT & TEST │   │  SÉCURITÉ &   │
  │   RIGUEUR     │   │   CONTINU     │   │  PERFORMANCE  │
  │ (Zéro-Fake)   │   │  (Puppeteer)  │   │   (No-Leak)   │
  └───────────────┘   └───────────────┘   └───────────────┘
          │                                       │
  ┌───────▼───────┐                       ┌───────▼───────┐
  │  RÉSILIENCE   │                       │ UTILITÉ PURE  │
  │ DES CASCADES  │                       │ (Zero-Gadget) │
  │    (APIs)     │                       │               │
  └───────────────┘                       └───────────────┘
```

---

## 2. Pilier 1 : Vérité Factuelle, Zéro Fake & Honnêteté Radicale

- **Interdiction de Hallucination Technique** : Ne jamais inventer de nom de modèle d'IA, de route d'API ou de paramètre fictif. Seules les versions et fonctionnalités formellement vérifiées par une requête ou une documentation primaire sont admises.
- **Interdiction de Masquage d'Erreur** : Si une API renvoie une erreur 401, 404, 429 ou 500, l'agent doit déclarer la cause exacte sans prétendre que le système fonctionne via un faux fallback trompeur.
- **Formules et Données Primaires** : Tout calcul (ex: indices financiers, métriques médicales, scores nutritionnels) doit citer sa formule mathématique exacte et son auteur/source primaire.

---

## 3. Pilier 2 : Harnais d'Audit & Tests E2E Automatisés

- **Tests de Parcours Réels (Puppeteer / Playwright)** :
  - Chaque vue, onglet ou page doit être testée par navigation réelle.
  - Les entrées de formulaires, les modales, les graphiques SVG, les filtres et les boutons de suppression doivent être activés et vérifiés par assertion DOM.
  - La console du navigateur virtuel est surveillée en continu : **0 erreur JavaScript tolérée**.
- **Tests d'Intégration d'APIs** :
  - Test systématique des codes 200 OK avec charge utile valide.
  - Test des edge-cases de sécurité : 400 Bad Request (payload vide), 401 Unauthorized (clé absente/invalide), 405 Method Not Allowed (mauvaise méthode HTTP).
  - Validation du streaming SSE (`text/event-stream`) pour éviter les ruptures de connexion dues aux limites de temps d'exécution (ex: Vercel Free 10s).

---

## 4. Pilier 3 : Sécurité & Performance sans Compromis

- **Protection des Clés & Authentification** :
  - Aucune clé secrète ne doit transiter vers le bundle client frontend.
  - Les requêtes d'API internes sont protégées par un `authGuard` vérifiant :
    1. Le contexte Same-Origin du navigateur (`Sec-Fetch-Site: same-origin`, matching `Host` / `Origin` / `Referer`).
    2. Le header de clé applicative `X-App-Key` pour les requêtes programmatiques.
- **Budget de Performance & Poids du Bundle** :
  - Privilégier le Vanilla JS / Vanilla CSS pour les composants critiques. Éviter d'importer des bibliothèques de 500 Ko pour tracer un simple graphique (utiliser des tracés SVG natifs paramétrés).
  - Les écouteurs d'événements, les timers (`setInterval`, `setTimeout`), les flux audio (`AudioContext`) et les boucles de rendu (`requestAnimationFrame`) doivent être rigoureusement détruits à la fermeture des vues ou des modales pour garantir **0 fuite mémoire**.

---

## 5. Pilier 4 : Résilience des Cascades IA & Cooldown Intelligent

- **Architecture de Cascade Hiérarchique** :
  1. **Niveau 1 : Modèles Haute Performance / Raisonnement** (requêtes complexes, analyses multimodales).
  2. **Niveau 2 : Modèles Véloces / Flash** (chat temps réel, recherche rapide).
  3. **Niveau 3 : Modèles Open-Weights / Grande Disponibilité** (haute cadence de requêtes sans blocage).
  4. **Niveau 4 : Fallback Heuristique Déterministe** (réponse structurée garantie même en cas de coupure réseau totale ou panne d'API tierce).
- **Gestionnaire de Cooldown & Anti-Throttling** :
  - Lorsqu'un modèle déclenche un code HTTP 429 (Too Many Requests), il est temporairement placé dans un registre de cooldown en mémoire (ex: 60 secondes) et la cascade bascule instantanément vers le modèle suivant sans faire attendre l'utilisateur.

---

## 6. Pilier 5 : Standards UI/UX & Accessibilité (WCAG AAA)

- **Contraste Textuel & Couleurs Sémantiques** :
  - Vert Émeraude / Turquoise : Succès, éléments vivants/alcalins, progression positive.
  - Ambre / Orange : Avertissement, éléments modérés, vigilance.
  - Rouge Rubis : Erreur, danger, éléments fortement acidifiants ou actions destructrices.
  - Bleu Cyan : Information, métriques d'eau/liquidité, repères temporels.
- **États Interactifs des Boutons** :
  - Tout bouton interactif doit explicitement implémenter `:hover`, `:active`, `:focus-visible` et `:disabled` (avec `cursor: not-allowed` et opacité réduite).
- **Protection contre les Actions Destructrices** :
  - Toute action irréversible (suppression d'historique, purge de base de données) impose obligatoirement l'affichage d'une modale de confirmation explicite avec boutons clairs « Confirmer la suppression » / « Annuler ».
