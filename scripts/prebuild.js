const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prismaClientIndex = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'index.js');
const hasClient = fs.existsSync(prismaClientIndex);

try {
  console.log('> prisma generate');
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (err) {
  if (hasClient) {
    console.log('ℹ️ [Info] query_engine sedang aktif digunakan oleh server yang berjalan (Windows DLL lock). Menggunakan Prisma Client yang sudah tersedia.');
  } else {
    console.error('❌ Gagal menjalankan prisma generate dan Prisma Client belum tersedia:', err);
    process.exit(1);
  }
}
