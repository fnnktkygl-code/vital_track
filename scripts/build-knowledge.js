const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');
const OUTPUT_FILE = path.join(__dirname, '..', 'api', '_lib', 'knowledge_bundle.txt');

async function buildKnowledge() {
  console.log('📚 Building knowledge base from PDFs...');
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.log(`Directory ${KNOWLEDGE_DIR} does not exist. Skipping.`);
    return;
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => {
    const ext = f.toLowerCase();
    return ext.endsWith('.md') || ext.endsWith('.txt') || ext.endsWith('.pdf');
  });
  
  if (files.length === 0) {
    console.log('No Markdown/PDF documents found in knowledge directory. Writing empty bundle.');
    fs.writeFileSync(OUTPUT_FILE, '');
    return;
  }

  let bundleText = '';

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    console.log(`Processing: ${file}...`);
    try {
      const dataBuffer = fs.readFileSync(filePath);
      let text = '';
      if (file.toLowerCase().endsWith('.pdf')) {
        const data = await pdfParse(dataBuffer);
        text = data.text;
      } else {
        text = dataBuffer.toString('utf8');
      }
      bundleText += `\n\n--- SOURCE: ${file} ---\n\n`;
      bundleText += text;
    } catch (err) {
      console.error(`❌ Failed to parse ${file}:`, err.message);
    }
  }

  // Basic cleanup: remove extra newlines, unprintable chars
  bundleText = bundleText.replace(/\n{3,}/g, '\n\n').replace(/[^\x20-\x7E\n\ràáâäçèéêëìíîïñòóôöùúûüýÿÀÁÂÄÇÈÉÊËÌÍÎÏÑÒÓÔÖÙÚÛÜÝ]/g, '');

  fs.writeFileSync(OUTPUT_FILE, bundleText, 'utf8');
  console.log(`✅ Knowledge base built! Total length: ${bundleText.length} characters.`);
}

buildKnowledge();
