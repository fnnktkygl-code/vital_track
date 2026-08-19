# 🌐 Règles SEO, Meta Tags & Open Graph (SEO_AND_META.md)

---

## 1. Balises HTML Obligatoires (Toute Page Publique)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>[Nom de la Page] — [Nom du Projet]</title>
  <meta name="description" content="[Description pertinente de 150-160 caractères max]">
  
  <!-- Open Graph (Réseaux Sociaux) -->
  <meta property="og:title" content="[Titre de la page]">
  <meta property="og:description" content="[Description courte pour le partage]">
  <meta property="og:image" content="[URL absolue de l'image de couverture, min 1200x630px]">
  <meta property="og:url" content="[URL canonique de la page]">
  <meta property="og:type" content="website">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="[Titre]">
  <meta name="twitter:description" content="[Description]">
  <meta name="twitter:image" content="[URL de l'image]">
  
  <!-- Favicon -->
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
</head>
```

---

## 2. Structure Sémantique HTML5

| Élément | Règle |
| :--- | :--- |
| `<h1>` | **Un seul par page**. Titre principal de la vue. |
| `<h2>` à `<h6>` | Hiérarchie respectée (pas de `<h4>` sans `<h3>` parent). |
| `<nav>` | Navigation principale et secondaire. |
| `<main>` | Contenu principal de la page. |
| `<article>` | Contenu autonome (post, monographie, fiche). |
| `<section>` | Regroupement thématique avec titre. |
| `<footer>` | Informations de pied de page. |

---

## 3. Fichiers SEO Statiques

### `robots.txt` (à la racine du `public/`)

```text
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://your-domain.com/sitemap.xml
```

### `sitemap.xml` (pour les projets multi-pages publics)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <lastmod>2026-01-01</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
```

---

## 4. Règles d'Application

1. **Titre dynamique** : Chaque vue ou page doit mettre à jour `document.title` dynamiquement (ex: `document.title = 'Tableau de Bord — VitalTrack'`).
2. **Meta description unique** : Pas de méta-description dupliquée entre pages.
3. **Images avec attribut `alt`** : Toute image `<img>` doit avoir un attribut `alt` descriptif et non vide.
4. **Liens avec texte descriptif** : ❌ Pas de `<a href="...">Cliquez ici</a>`. ✅ `<a href="...">Voir la fiche détaillée</a>`.
5. **URL canonique** : Pour les SPA, ajouter `<link rel="canonical" href="...">` correspondant à la vue active.

---

## 5. Applicabilité

| Type de Projet | SEO Requis ? |
| :--- | :--- |
| SaaS public / Landing page | ✅ Obligatoire |
| Portfolio client | ✅ Obligatoire |
| App interne / dashboard privé | ⚠️ Optionnel (titre + favicon suffisants) |
| API-only / backend | ❌ Non applicable |
