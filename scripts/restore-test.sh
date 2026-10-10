#!/usr/bin/env bash
# Uji pemulihan (Bagian 14.2, gate Recovery): pulihkan cadangan ke basis data lain, lalu bandingkan jumlah baris tiap tabel.
# Target harus basis data staging/lokal yang sudah memiliki skema auth (Supabase). JANGAN diarahkan ke produksi.
# Contoh: SOURCE_URL=... TARGET_URL=... ./scripts/restore-test.sh cadangan.dump
set -euo pipefail
: "${SOURCE_URL:?Isi SOURCE_URL (basis data asal cadangan)}"
: "${TARGET_URL:?Isi TARGET_URL (basis data kosong untuk uji pemulihan)}"
DUMP="${1:?Berikan path berkas .dump}"

pg_restore --no-owner --no-privileges --clean --if-exists --schema=public --dbname="$TARGET_URL" "$DUMP" >/dev/null
COUNTS="select format('%s=%s', c.relname, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', c.relname), false, true, '')))[1]::text)
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' order by c.relname"
if diff <(psql "$SOURCE_URL" -Atc "$COUNTS") <(psql "$TARGET_URL" -Atc "$COUNTS"); then
  echo "Pemulihan berhasil: jumlah baris semua tabel sama."
else
  echo "Pemulihan GAGAL: ada tabel dengan jumlah baris berbeda." >&2
  exit 1
fi
