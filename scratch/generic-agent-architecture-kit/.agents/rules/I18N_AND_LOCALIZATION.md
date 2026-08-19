# 🌍 Règles d'Internationalisation & Localisation (I18N_AND_LOCALIZATION.md)

---

## 1. Principe Fondamental

> **Aucune chaîne de texte visible par l'utilisateur ne doit être hardcodée dans le code source.**
> Toutes les chaînes UI doivent être centralisées dans des fichiers de traduction JSON.

---

## 2. Structure des Fichiers de Traduction

```text
locales/
├── fr.json        # Français (langue par défaut si applicable)
├── en.json        # Anglais
└── es.json        # Espagnol (ou toute autre langue requise)
```

### Format du Fichier JSON

```json
{
  "nav": {
    "dashboard": "Tableau de bord",
    "search": "Recherche",
    "settings": "Paramètres"
  },
  "dashboard": {
    "title": "Votre Tableau de Bord",
    "welcome": "Bienvenue, {{name}}",
    "stats": {
      "total": "Total",
      "average": "Moyenne"
    }
  },
  "actions": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "confirm_delete": "Êtes-vous sûr de vouloir supprimer cet élément ?"
  },
  "errors": {
    "network": "Connexion au serveur impossible. Vérifiez votre réseau.",
    "not_found": "Élément introuvable.",
    "server": "Erreur interne du serveur. Réessayez."
  }
}
```

---

## 3. Convention de Clés

Format : `section.element.action` (3 niveaux max)

| Clé | Signification |
| :--- | :--- |
| `nav.dashboard` | Libellé du bouton "Tableau de bord" dans la navigation |
| `dashboard.welcome` | Message d'accueil avec interpolation de variable |
| `actions.confirm_delete` | Texte de la modale de confirmation de suppression |
| `errors.network` | Message d'erreur réseau affiché à l'utilisateur |

---

## 4. Détection Automatique de la Langue

```javascript
function detectLocale() {
  // 1. Préférence utilisateur sauvegardée
  const saved = localStorage.getItem('locale');
  if (saved) return saved;
  
  // 2. Langue du navigateur
  const browserLang = navigator.language?.split('-')[0] || 'fr';
  
  // 3. Langues supportées
  const supported = ['fr', 'en', 'es'];
  return supported.includes(browserLang) ? browserLang : 'fr';
}
```

---

## 5. Fonction de Traduction Centralisée

```javascript
let translations = {};

async function loadLocale(locale) {
  const res = await fetch(`/locales/${locale}.json`);
  translations = await res.json();
}

function t(key, vars = {}) {
  const keys = key.split('.');
  let value = translations;
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return key; // Fallback: afficher la clé brute
  }
  // Interpolation des variables : {{name}} → valeur
  return String(value).replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}

// Usage :
// t('dashboard.welcome', { name: 'Richard' }) → "Bienvenue, Richard"
```

---

## 6. Règles Strictes

1. **Attribut `lang` sur `<html>`** : `<html lang="fr">` ou dynamiquement mis à jour selon la locale active.
2. **Dates et Nombres Localisés** : Utiliser `Intl.DateTimeFormat` et `Intl.NumberFormat` au lieu de formater manuellement.
   ```javascript
   new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date())
   // → "19 août 2026"
   ```
3. **Pas de concaténation de chaînes traduites** : ❌ `t('hello') + ' ' + name`. ✅ `t('hello', { name })`.
4. **Pluralisation** : Utiliser des clés séparées (`item_one`, `item_many`) ou `Intl.PluralRules`.

---

## 7. Applicabilité

| Type de Projet | i18n Requis ? |
| :--- | :--- |
| App multi-marché / bilingue | ✅ Obligatoire dès le jour 1 |
| SaaS avec audience internationale | ✅ Obligatoire |
| App interne mono-langue | ⚠️ Optionnel (mais recommandé pour éviter le refactoring futur) |
| Prototype / MVP rapide | ❌ Reporter (mais garder les chaînes isolables) |
