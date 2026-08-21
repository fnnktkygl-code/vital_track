import BookReader from "./BookReader";
import { books } from "./example-data";

// Exemple d'intégration minimale. Dans votre app, remplacez `books` par vos
// données réelles (voir README.md pour la forme attendue et des pistes
// d'extraction depuis vos PDFs).
export default function App() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <BookReader books={books} />
    </div>
  );
}
