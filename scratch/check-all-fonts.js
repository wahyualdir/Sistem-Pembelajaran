const fs = require('fs');
const content = fs.readFileSync('src/app/fonts-sf-pro.css', 'utf8');
const blocks = content.split('@font-face').slice(1);
blocks.forEach((b, i) => {
  const fam = b.match(/font-family:\s*['"]([^'"]+)['"]/);
  const wt = b.match(/font-weight:\s*([^;]+);/);
  const urlMatch = b.match(/url\('data:font\/woff2;charset=utf-8;base64,([^']+)'\)/);
  const len = urlMatch ? urlMatch[1].length : 0;
  console.log(`Block ${i + 1}: family=${fam ? fam[1] : '?'}, weight=${wt ? wt[1] : '?'}, b64Length=${len}`);
});
