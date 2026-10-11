-- Migrasi: Penambahan nilai status 'EXECUTED' pada enum change_request_status
-- Dipisahkan sebagai transaksi migrasi mandiri mendahului migrasi 14 (A4 & C1)
ALTER TYPE public.change_request_status ADD VALUE IF NOT EXISTS 'EXECUTED';
