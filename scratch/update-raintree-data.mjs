import fs from 'fs';
import path from 'path';

const filePath = path.resolve('/Users/richard/Developer/vital_track/web-app/src/raintree-data.js');
let content = fs.readFileSync(filePath, 'utf8');

// For each plant, let's ensure image is set
content = content.replace(/id:\s*"([^"]+)",/g, (match, id) => {
  const imgName = id === 'boldo-amazonie' ? 'boldo' : id;
  return `id: "${id}",\n    image: "/plants/${imgName}.jpg",`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Updated raintree-data.js with image properties for all plants.');
