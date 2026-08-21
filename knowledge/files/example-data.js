/*
  Données d'exemple pour BookReader.
  Les titres de leçons/chapitres viennent des sommaires réels des trois PDFs.
  Les paragraphes sont des reformulations originales, courtes, écrites pour
  cette démo — jamais un copier-coller des ouvrages sources. Les chapitres
  sans "paragraphs" affichent l'espace réservé du composant : c'est
  volontaire, pour montrer la forme attendue des données sans avoir à
  reformuler l'intégralité de trois livres.
*/

export const ehret = {
  id: "ehret",
  title: "Le régime sans mucus",
  author: "Prof. Arnold Ehret",
  year: "1922",
  glossary: {
    mucus:
      "Terme central de la théorie d'Ehret : résidus alimentaires non digérés qu'il tient pour responsables des troubles de santé. Cette théorie n'a pas de fondement reconnu par la médecine actuelle.",
    encombrement:
      "Dans le vocabulaire d'Ehret, l'accumulation de résidus non éliminés qui entraverait la vitalité de l'organisme. Notion propre à sa théorie, non validée cliniquement.",
  },
  chapters: [
    {
      id: "lesson-1",
      tag: "I",
      title: "Principes généraux",
      paragraphs: [
        "Ehret ouvre son cours par une affirmation radicale : toute maladie, quel que soit son nom clinique, ne serait qu'une forme d'encombrement généralisé par le {{mucus}} dans les tissus.",
        "Son diagnostic ne s'attarde donc pas sur le nom du mal, mais sur son ampleur et sa localisation.",
      ],
    },
    {
      id: "lesson-3",
      tag: "III",
      title: "Le diagnostic",
      paragraphs: [
        "Plutôt que de nommer la maladie, Ehret propose d'évaluer cinq critères : la quantité d'encombrement, sa nature dominante, la présence de résidus, l'état des tissus et le niveau de vitalité restant.",
        "Un diagnostic, selon lui, se lit d'abord sur le teint et la langue du patient, avant tout examen instrumental.",
      ],
    },
    {
      id: "lesson-6",
      tag: "VI",
      title: "La nouvelle physiologie",
      paragraphs: [
        "Cette leçon remet en question cinq points de la physiologie médicale de l'époque, dont la circulation sanguine et le métabolisme. Ehret y décrit le corps comme un système pneumatique, où les poumons agiraient comme la pompe véritable.",
        "Toute la démonstration s'appuie sur sa formule de la vitalité, où la force vitale résulte de la puissance diminuée de l'{{encombrement}} accumulé.",
      ],
    },
    { id: "lesson-18", tag: "XVIII", title: "Le jeûne" },
    {
      id: "lesson-22",
      tag: "XXII",
      title: "Le régime destructeur de la civilisation et le régime sans mucus",
    },
    { id: "lesson-26", tag: "XXVI", title: "Message aux Ehretistes" },
  ],
};

export const morse = {
  id: "morse",
  title: "Le manuel de la détox miracle",
  author: "Dr Robert Morse, N.D.",
  year: "2012",
  glossary: {
    "plaque mucoïde":
      "Terme employé par Robert Morse pour désigner un dépôt intestinal qu'il tient responsable d'une mauvaise absorption des nutriments. Ce concept n'est pas reconnu par la gastro-entérologie actuelle.",
  },
  chapters: [
    {
      id: "ch-1",
      tag: "1",
      title: "Comprendre notre espèce",
      paragraphs: [
        "Le premier chapitre soutient que l'anatomie humaine — dentition, longueur du tube digestif, structure de la main — se rapprocherait de celle des primates frugivores plutôt que des carnivores ou omnivores.",
        "L'auteur en tire une règle alimentaire générale : privilégier fruits, légumes et aliments crus, et limiter la cuisson.",
      ],
    },
    {
      id: "ch-2",
      tag: "2",
      title: "Comment fonctionne le corps",
      paragraphs: [
        "Ce chapitre décrit la digestion en quatre étapes — digestion, absorption, utilisation, élimination — et attribue une part des troubles de santé à l'accumulation d'une {{plaque mucoïde}} qui gênerait l'absorption intestinale.",
        "L'ouvrage présente ensuite le corps comme une société cellulaire, où chaque organe jouerait un rôle spécialisé au service de l'ensemble.",
      ],
    },
    { id: "ch-5", tag: "5", title: "La nature de la maladie" },
    {
      id: "ch-6",
      tag: "6",
      title: "Éliminer la maladie par le nettoyage et la régénération des tissus",
    },
    { id: "ch-8", tag: "8", title: "Le pouvoir des plantes" },
  ],
};

export const wolfe = {
  id: "wolfe",
  title: "Le système de réussite du régime Sunfood",
  author: "David Wolfe",
  year: "2008",
  glossary: {
    "loi de production":
      "Dans le vocabulaire de David Wolfe, l'idée que toute action ou pensée produirait un effet de même nature. Présentée comme une loi universelle, il s'agit d'une thèse personnelle de l'auteur plutôt que d'un principe scientifique établi.",
  },
  chapters: [
    {
      id: "lesson-1",
      tag: "1",
      title: "Le principe de la transformation de vie",
      paragraphs: [
        "La première leçon pose un principe central du livre : la transformation extérieure commencerait toujours par un changement intérieur.",
        "L'auteur invite le lecteur à tenir un journal et à se considérer comme pleinement responsable de son état de santé actuel.",
      ],
    },
    {
      id: "lesson-2",
      tag: "2",
      title: "La loi fondamentale",
      paragraphs: [
        "Cette leçon énonce ce que l'auteur appelle la {{loi de production}} : les choix faits aujourd'hui produiraient nécessairement des effets de même nature dans l'avenir.",
        "Une reformulation du principe de cause à effet, présentée ici comme une loi cosmique plutôt que comme une simple observation de bon sens.",
      ],
    },
    { id: "lesson-7", tag: "7", title: "Le régime Sunfood" },
    { id: "lesson-10", tag: "10", title: "La détoxification" },
    { id: "lesson-33", tag: "33", title: "La gestion du temps par le jeûne" },
  ],
};

export const books = [ehret, morse, wolfe];
