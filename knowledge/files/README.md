# BookReader — template exportable

Un composant de lecture pour livres longs et structurés (traités de santé,
cours en leçons, manuels), pensé pour être branché sur du contenu réel.
Construit à partir des sommaires des trois PDFs fournis (Ehret, Morse,
Wolfe), avec un système de design original — pas le cliché « fond crème +
accent terracotta » qu'on voit partout.

## Fichiers

| Fichier | Rôle |
|---|---|
| `BookReader.jsx` | Le composant React. C'est le fichier à intégrer dans votre app. |
| `BookReader.css` | Les styles — tokens de couleur/typo en variables CSS sur `.br-root`. |
| `example-data.js` | Données d'exemple (3 livres, quelques chapitres reformulés). |
| `App.example.jsx` | Exemple d'intégration minimal. |
| `preview.html` | Aperçu autonome, sans build — double-cliquez pour l'ouvrir (gardez-le dans le même dossier que `BookReader.css`). |

## Intégration dans votre app Next.js

1. Copiez `BookReader.jsx` et `BookReader.css` dans votre projet (ex. `components/BookReader/`).
2. Importez et utilisez :

```jsx
import BookReader from "@/components/BookReader/BookReader";

const book = {
  id: "ehret",
  title: "Le régime sans mucus",
  author: "Prof. Arnold Ehret",
  year: "1922",
  chapters: [
    {
      id: "lesson-1",
      tag: "I",
      title: "Principes généraux",
      paragraphs: [
        "Texte du paragraphe. Un terme {{cliquable}} ouvre sa définition."
      ],
    },
    // ...
  ],
  glossary: {
    cliquable: "Définition affichée quand on clique sur le terme.",
  },
};

<BookReader books={[book]} />
```

Pour plusieurs livres (comme dans la démo), passez un tableau : un
sélecteur de livre apparaît automatiquement en haut du composant.

```jsx
import { books } from "./example-data";
<BookReader books={books} />
```

### Props

| Prop | Type | Description |
|---|---|---|
| `books` | `Book \| Book[]` | Un ou plusieurs livres. |
| `activeBook` | `string` | Id du livre actif, si vous voulez piloter la sélection depuis l'extérieur. |
| `onBookChange` | `(id: string) => void` | Appelé au changement de livre (sinon géré en interne). |

### Forme d'un `Book`

```
{
  id, title, author, year,
  chapters: [{ id, tag, title, paragraphs?: string[] }],
  glossary?: { [terme]: définition }
}
```

- `tag` est ce qui s'affiche dans le sommaire et l'en-tête (numéro de leçon,
  numéro de chapitre, sigle — libre à vous).
- `paragraphs` est optionnel : un chapitre sans paragraphes affiche un
  espace réservé, ce qui vous permet de brancher le sommaire complet d'un
  livre avant d'avoir extrait tout son texte.
- La syntaxe `{{terme}}` dans un paragraphe crée un repère cliquable qui
  ouvre `glossary[terme]`. C'est la seule convention imposée — le reste est
  du texte brut, facile à générer automatiquement.

## Brancher vos PDFs

Le composant ne lit pas de PDF lui-même — il attend des données déjà
structurées, pour rester réutilisable avec n'importe quelle source (PDF,
CMS, Markdown...). Deux façons courantes de faire le pont :

1. **Extraction ponctuelle (recommandé pour commencer)** : utilisez
   `pdfjs-dist` côté serveur pour extraire le texte, puis découpez-le
   manuellement (ou avec une regex sur les titres de leçons/chapitres,
   visibles dans la table des matières de chaque PDF) en un fichier
   `books/ehret.json` correspondant à la forme `Book` ci-dessus. C'est un
   travail ponctuel par livre, mais il donne le meilleur contrôle sur la
   qualité du découpage.
2. **Extraction automatique** : un script qui repère les motifs récurrents
   du sommaire (`"LESSON "`, `"CHAPTER "`, `"MODULE "` selon le livre) dans
   le texte extrait, pour générer les chapitres automatiquement. Plus rapide
   à mettre en place, mais demande une relecture — les PDFs scannés ou mal
   structurés donnent des découpages imparfaits.

Si vous voulez, je peux écrire ce script d'extraction pour vos trois PDFs
dans un prochain message — dites-moi simplement lequel des deux
correspond à ce que vous cherchez.

## Notes de design

- **Typographies** : `Fraunces` pour les titres, `Source Serif 4` pour le
  corps de lecture, `Inter` pour l'interface, `IBM Plex Mono` pour les
  numéros de chapitre et les compteurs — à charger via Google Fonts ou en
  self-hosted.
- **Couleurs** : palette "carte de bibliothèque" (bone/ink/moss/plum/brass),
  exposée en variables CSS sur `.br-root` pour être surchargée facilement.
- **Thèmes de lecture** (papier / sépia / nuit) s'appliquent uniquement à la
  zone de lecture, pas au reste de l'interface — comme sur une vraie
  liseuse.
- Contenu texte volontairement reformulé plutôt que copié depuis les PDFs
  sources, pour rester dans les limites de citation raisonnables.
