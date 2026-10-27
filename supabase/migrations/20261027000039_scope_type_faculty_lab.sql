-- Migration: Penambahan nilai scope_type untuk Fakultas (FACULTY) dan Laboratorium (LAB)
-- Rollback: PostgreSQL tidak mendukung DROP VALUE dari enum secara langsung; pembatalan penuh memerlukan pembuatan ulang tipe enum jika diperlukan.

ALTER TYPE public.scope_type ADD VALUE IF NOT EXISTS 'FACULTY';
ALTER TYPE public.scope_type ADD VALUE IF NOT EXISTS 'LAB';
