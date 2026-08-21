import { useMemo, useState } from "react";
import "./BookReader.css";

/*
  BookReader
  ----------
  Composant de lecture pour des livres longs et structurés (traités de
  santé, cours en leçons, manuels). Pensé pour être branché sur du contenu
  réel extrait de vos PDFs : chaque livre est un objet de données simple,
  aucune logique métier n'est câblée en dur dans le composant.

  Props
  -----
  books      : Book[]            un ou plusieurs livres (voir forme plus bas)
  activeBook : string            id du livre actif (optionnel, sinon books[0])
  onBookChange(id)                appelé quand l'utilisateur change de livre

  Forme d'un Book
  ----------------
  {
    id: "ehret",
    title: "Le régime sans mucus",
    author: "Prof. Arnold Ehret",
    year: "1922",
    chapters: [
      {
        id: "lesson-1",
        tag: "I",                     // affiché dans le sommaire (numéro, sigle...)
        title: "Principes généraux",
        paragraphs: [                 // optionnel — omettre = affiche un espace réservé
          "Texte du premier paragraphe, avec un {{terme}} cliquable."
        ]
      }
    ],
    glossary: {                       // optionnel
      terme: "Définition affichée dans la fiche."
    }
  }

  La syntaxe {{terme}} dans un paragraphe le transforme en repère cliquable
  qui ouvre la définition correspondante dans book.glossary. C'est la seule
  convention imposée par le composant — le reste est du texte brut, donc
  facile à générer depuis une extraction de PDF ou un CMS.
*/

const READING_THEMES = [
  { key: "bone", label: "Papier" },
  { key: "sepia", label: "Sépia" },
  { key: "dusk", label: "Nuit" },
];

const MIN_FONT = 15;
const MAX_FONT = 21;

function renderParagraph(text, onTermClick) {
  const parts = text.split(/(\{\{.+?\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{(.+?)\}\}$/);
    if (!match) return part;
    const term = match[1];
    return (
      <span
        key={i}
        className="br-glossary-term"
        role="button"
        tabIndex={0}
        onClick={() => onTermClick(term)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTermClick(term);
          }
        }}
      >
        {term}
      </span>
    );
  });
}

export default function BookReader({ books, activeBook, onBookChange }) {
  const list = Array.isArray(books) ? books : [books].filter(Boolean);
  const [internalBookId, setInternalBookId] = useState(list[0]?.id);
  const bookId = activeBook ?? internalBookId;
  const book = list.find((b) => b.id === bookId) ?? list[0];

  const [chapterIndex, setChapterIndex] = useState(0);
  const [theme, setTheme] = useState("bone");
  const [fontSize, setFontSize] = useState(17);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTerm, setActiveTerm] = useState(null);

  const chapters = book?.chapters ?? [];
  const chapter = chapters[chapterIndex] ?? chapters[0];

  const progressPct = useMemo(() => {
    if (!chapters.length) return 0;
    return Math.round(((chapterIndex + 1) / chapters.length) * 100);
  }, [chapterIndex, chapters.length]);

  function selectBook(id) {
    setChapterIndex(0);
    setActiveTerm(null);
    if (onBookChange) onBookChange(id);
    else setInternalBookId(id);
  }

  function selectChapter(i) {
    setChapterIndex(i);
    setActiveTerm(null);
    setSidebarOpen(false);
  }

  if (!book) return null;

  const definition =
    activeTerm && book.glossary ? book.glossary[activeTerm] : null;

  return (
    <div className="br-root">
      {list.length > 1 && (
        <div className="br-switcher">
          {list.map((b) => (
            <button
              key={b.id}
              className="br-switcher-tab"
              data-active={b.id === book.id}
              onClick={() => selectBook(b.id)}
            >
              {b.title}
            </button>
          ))}
        </div>
      )}

      <div className="br-shell">
        <aside className="br-sidebar" data-open={sidebarOpen}>
          <p className="br-book-eyebrow">{book.author}</p>
          <h2 className="br-book-title">{book.title}</h2>
          {book.year && <p className="br-book-meta">{book.year}</p>}

          <div className="br-progress-line">
            <div className="br-progress-track">
              <div
                className="br-progress-fill"
                style={{ width: progressPct + "%" }}
              />
            </div>
            <span className="br-progress-label">
              {chapterIndex + 1} / {chapters.length}
            </span>
          </div>

          <ul className="br-chapter-list">
            {chapters.map((c, i) => (
              <li className="br-chapter-item" key={c.id}>
                <button
                  className="br-chapter-btn"
                  data-active={i === chapterIndex}
                  onClick={() => selectChapter(i)}
                >
                  <span className="br-chapter-tag">{c.tag}</span>
                  <span className="br-chapter-title">{c.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="br-main">
          <div className="br-toolbar">
            <button
              className="br-btn br-sidebar-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              Sommaire
            </button>

            <div className="br-toolbar-group">
              {READING_THEMES.map((t) => (
                <button
                  key={t.key}
                  className="br-btn"
                  data-active={theme === t.key}
                  onClick={() => setTheme(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="br-toolbar-group">
              <button
                className="br-btn br-btn-icon"
                aria-label="Diminuer la taille du texte"
                onClick={() => setFontSize((s) => Math.max(MIN_FONT, s - 1))}
              >
                A-
              </button>
              <span className="br-size-readout">{fontSize} px</span>
              <button
                className="br-btn br-btn-icon"
                aria-label="Augmenter la taille du texte"
                onClick={() => setFontSize((s) => Math.min(MAX_FONT, s + 1))}
              >
                A+
              </button>
            </div>
          </div>

          <div className="br-page" data-theme={theme}>
            <p className="br-eyebrow">{chapter?.tag}</p>
            <h1 className="br-title">{chapter?.title}</h1>

            {chapter?.paragraphs?.length ? (
              <div className="br-body" style={{ fontSize: fontSize + "px" }}>
                {chapter.paragraphs.map((p, i) => (
                  <p key={i}>{renderParagraph(p, setActiveTerm)}</p>
                ))}
              </div>
            ) : (
              <p className="br-placeholder">
                Contenu à connecter — ajoutez book.chapters[
                {chapterIndex}].paragraphs.
              </p>
            )}

            {definition && (
              <div className="br-glossary-card">
                <p className="br-glossary-card-term">{activeTerm}</p>
                <p className="br-glossary-card-def">{definition}</p>
              </div>
            )}

            <div className="br-nav">
              <button
                className="br-nav-btn"
                disabled={chapterIndex === 0}
                onClick={() => selectChapter(chapterIndex - 1)}
              >
                ← précédent
              </button>
              <span className="br-nav-spacer" />
              <span className="br-nav-count">{progressPct}%</span>
              <span className="br-nav-spacer" />
              <button
                className="br-nav-btn"
                disabled={chapterIndex === chapters.length - 1}
                onClick={() => selectChapter(chapterIndex + 1)}
              >
                suivant →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
