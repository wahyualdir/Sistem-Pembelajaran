const fs = require("fs");
const path = require("path");

// Palet resmi identitas logo kampus (HANYA warna ini yang diizinkan)
const ALLOWED_HEX = new Set([
  "#F3F3F4", // --bg
  "#FFFFFF", // --surface / putih
  "#111111", // --ink
  "#ED1C24", // --primary (merah logo)
  "#A91117", // --primary-dark
  "#808285", // --gray
  "#58595B", // --gray-dark
  "#E2E3E4", // --gray-soft
  "#000000", // hitam murni
  "#FFF",
  "#000",
  "#111",
]);

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== "node_modules" && f !== ".next") getFiles(full, files);
    } else if (f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".css")) {
      files.push(full);
    }
  }
  return files;
}

const files = getFiles("src");
const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;
let errorCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const matches = content.match(hexRegex);
  if (matches) {
    const disallowed = matches.filter((h) => {
      const upper = h.toUpperCase();
      // Izinkan jika persis sama atau jika format 8-digit dengan 6-digit pertama valid
      return !ALLOWED_HEX.has(upper) && !ALLOWED_HEX.has(upper.slice(0, 7));
    });
    if (disallowed.length > 0) {
      console.error(`❌ Hex di luar palet resmi kampus ditemukan di ${file}:`, disallowed);
      errorCount += disallowed.length;
    }
  }
}

if (errorCount > 0) {
  console.error(`\n[Gagal] Ditemukan ${errorCount} kode warna hex di luar palet resmi kampus!`);
  console.error(`Hanya diizinkan: #F3F3F4, #FFFFFF, #111111, #ED1C24, #A91117, #808285, #58595B, #E2E3E4, #000000.`);
  process.exit(1);
} else {
  console.log("✅ [Lolos] Seluruh warna hex sesuai dengan palet resmi identitas kampus (merah, abu-abu, putih, hitam netral).");
}
