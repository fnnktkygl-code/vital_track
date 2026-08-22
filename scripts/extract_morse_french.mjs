import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse/lib/pdf-parse.js');

async function extract() {
  const dataBuffer = fs.readFileSync("Miracle de la Détoxination - Robert Morse.pdf");
  
  let pageList = [];
  let pageNum = 0;
  
  const options = {
    pagerender: function(pageData) {
      return pageData.getTextContent().then(function(textContent) {
        pageNum++;
        let lastY, text = "";
        for (let item of textContent.items) {
          if (lastY == item.transform[5] || !lastY){
            text += item.str;
          } else {
            text += "\n" + item.str;
          }
          lastY = item.transform[5];
        }
        pageList.push({ page: pageNum, text: text.trim() });
        return text;
      });
    }
  };

  await pdf(dataBuffer, options);
  console.log("Extracted pages count:", pageList.length);
  
  // Save intermediate json for examination
  fs.writeFileSync("scripts/extracted_morse_pages.json", JSON.stringify(pageList, null, 2));
  console.log("Saved scripts/extracted_morse_pages.json");
}

extract().catch(console.error);
