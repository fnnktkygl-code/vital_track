import fs from 'fs';
import path from 'path';

const text = fs.readFileSync('scratch/original_ehret_full_text.txt', 'utf8');
const lines = text.split('\n');

const chapters = [];
let currentChapter = { title: 'Front Matter', lines: [] };

const regex = /^(LESSON [I|V|X]+|BIOGRAPHICAL SKETCH|PUBLISHER'S NOTE|Introduction\b)/i;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (regex.test(line.trim())) {
    chapters.push(currentChapter);
    currentChapter = { title: line.trim(), lines: [] };
  } else {
    currentChapter.lines.push(line);
  }
}
chapters.push(currentChapter);

console.log(`Parsed ${chapters.length} chapters:`);
chapters.forEach((c, idx) => {
  console.log(`Chapter ${idx}: ${c.title} (${c.lines.length} lines)`);
});

fs.mkdirSync('scratch/ehret_chapters', { recursive: true });
chapters.forEach((c, idx) => {
  fs.writeFileSync(`scratch/ehret_chapters/ch_${String(idx).padStart(2, '0')}.txt`, `${c.title}\n\n${c.lines.join('\n')}`);
});
