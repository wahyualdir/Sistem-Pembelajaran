const fs = require('fs');
const content = fs.readFileSync('src/app/fonts-sf-pro.css', 'utf8');
const match = content.match(/url\('data:font\/woff2;charset=utf-8;base64,([^']+)'\)/);
if (match) {
  const buf = Buffer.from(match[1], 'base64');
  console.log('Decoded buffer length:', buf.length);
  console.log('First 4 bytes:', buf.slice(0, 4).toString('hex'), 'string:', buf.slice(0, 4).toString());
} else {
  console.log('No match found');
}
