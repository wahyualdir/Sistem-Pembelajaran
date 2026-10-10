const fs = require("fs");
const path = require("path");

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== "node_modules" && f !== ".next") getFiles(full, files);
    } else if (f.endsWith(".ts") || f.endsWith(".tsx")) {
      // Kecualikan file konfigurasi token, globals.css, dan dokumen PDF (karena @react-pdf/renderer membutuhkan nilai CSS stylesheet mandiri)
      if (
        !full.includes("globals.css") &&
        !full.includes("tailwind.config") &&
        !full.includes(path.join("src", "lib", "pdf"))
      ) {
        files.push(full);
      }
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
  if (matches && matches.length > 0) {
    console.error(`❌ Hex ditemukan di ${file}:`, matches);
    errorCount += matches.length;
  }
}

if (errorCount > 0) {
  console.error(`\n[Gagal] Ditemukan ${errorCount} kode warna hex hardcoded di dalam komponen/halaman! Gunakan token desain Tailwind/CSS variable.`);
  process.exit(1);
} else {
  console.log("✅ [Lolos] Bebas dari warna hex hardcoded di seluruh komponen dan halaman.");
}
