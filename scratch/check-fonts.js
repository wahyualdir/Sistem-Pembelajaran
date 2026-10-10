const fs = require('fs');
const content = fs.readFileSync('src/app/fonts-sf-pro.css', 'utf8');
console.log('Size:', content.length);
const lines = content.split('\n');
console.log('Total lines:', lines.length);
for (let i = 0; i < Math.min(lines.length, 150); i++) {
  if (lines[i].includes('@font-face') || lines[i].includes('font-family') || lines[i].includes('font-weight')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
