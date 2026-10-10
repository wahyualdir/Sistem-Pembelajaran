#!/usr/bin/env bash
# Cadangan basis data (Bagian 15.4 dan 19): jalankan terjadwal, mis. lewat GitHub Actions, ke penyimpanan terpisah.
# Memerlukan koneksi langsung ke Postgres (bukan pooler). Contoh: DATABASE_URL=... ./scripts/backup-db.sh cadangan.dump
set -euo pipefail
: "${DATABASE_URL:?Isi DATABASE_URL dengan koneksi langsung ke Postgres}"
OUT="${1:-siajar-$(date -u +%Y%m%dT%H%M%SZ).dump}"
pg_dump --format=custom --no-owner --no-privileges --schema=public --file="$OUT" "$DATABASE_URL"
echo "Cadangan tersimpan: $OUT"
