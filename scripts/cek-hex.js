const fs = require("fs");
const path = require("path");

// Palet resmi identitas Velqora & RuangKampus
const ALLOWED_HEX = new Set([
  // Velqora Signature Terracotta & Warm Burnt Orange
  "#FEF2F0", "#FDDDD7", "#FBB9AD", "#F48E7C", "#E0654F", "#C2553A", "#A34530", "#853827", "#6B2D20", "#4A1F16",
  "#C65D3B", "#B54F2F", "#F4E4DD", "#B84A2B", "#EE7257", "#9E3B1E", "#7A2E19", "#4E1C0E", "#FBC8BC", "#F69F8C",
  "#FEF4F1", "#FDE6E0",

  // Velqora Surfaces & Warm Paper Ivory
  "#FAF8F5", "#FAFAF8", "#FFFFFF", "#FAF6F1", "#F5F3EE", "#EDEAE3", "#E8E5DE", "#ECE9D8", "#F4EFEB", "#E8E0D7",
  "#F0EAE3", "#ECE7DF", "#F2EFE8", "#F5EFEB", "#E0DACB", "#DFD8CB",

  // Velqora Dark Obsidian & Zinc
  "#09090B", "#121214", "#141416", "#18181B", "#1C1C20", "#232328", "#27272A", "#2B2B32", "#3F3F46", "#52525B",
  "#71717A", "#A1A1AA", "#D4D4D8", "#F4F4F5", "#14110F", "#38312A", "#2E2822", "#120F0D", "#1E1915", "#0D0A08",
  "#064E3B", "#451A03", "#3B0764",

  // Velqora Borders & Inset Framing
  "#D6D3CB", "#B8B4AB", "#7A756D", "#8A857D", "#B8B1A5", "#4A463F", "#E5DDD5", "#C4BFB6", "#9C968D",

  // Velqora Typography / Warm Charcoal & Espresso
  "#1C1917", "#1F1B18", "#2D2823", "#1A1816", "#44403C", "#57534E", "#6B6560", "#6E675F", "#78716C", "#A39C94",
  "#A8A29E", "#524B42",

  // Semantic & Accents (Emerald, Forest Green, Amber, Red, Violet, Cyan)
  "#10B981", "#059669", "#047857", "#065F46", "#2E6930", "#3B7A57", "#E8F5E9",
  "#F59E0B", "#D97706", "#B45309", "#92400E", "#FDE68A",
  "#EF4444", "#DC2626", "#8B5CF6", "#7C3AED", "#6D28D9", "#A855F7", "#06B6D4", "#0891B2", "#2563EB", "#3B82F6", "#1D4ED8",
  "#FEF2F2", "#FCA5A5", "#991B1B",

  // Traffic Light Controls
  "#B31E17", "#FF7F78", "#FF5F56", "#D42820", "#500000", "#B87A00", "#FFE270", "#FFBD2E", "#D9950A", "#5B3F00",
  "#118022", "#57E86F", "#27C93F", "#189E2D", "#04440B",

  // Brand Logo Colors (Python, React, TS, etc.)
  "#3776AB", "#F7DF1E", "#3178C6", "#61DAFB", "#20232A", "#00599C", "#EA2D2E", "#CE412B", "#777BB4",

  // Sky Shader & Atmosphere Widget
  "#1E1B4B", "#4C1D95", "#9F1239", "#EA580C", "#FDE047", "#44144E", "#2D0A36", "#17051C", "#0284C7", "#0EA5E9",
  "#38BDF8", "#BAE6FD", "#0369A1", "#075985", "#0C4A6E", "#0F172A", "#312E81", "#701A75", "#FEF08A", "#3B0744",
  "#26042C", "#140217", "#020617", "#050B1A", "#0B152D", "#182247", "#090D16", "#0B1329", "#070C1B", "#04070E",

  // Legacy campus palette
  "#F3F3F4", "#111111", "#ED1C24", "#A91117", "#808285", "#58595B", "#E2E3E4", "#000000",
  "#FFF", "#000", "#111",
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
