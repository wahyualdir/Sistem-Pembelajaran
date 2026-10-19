-- SIAJAR Migration: Supabase Storage Buckets & Policies, serta Tabel Progres Belajar Materi
-- Memenuhi Aturan: Bucket privat (materi & tugas), RLS storage.objects, dan tabel public.materi_progres dengan RLS lengkap.

-- 1. Skema dan Tabel Mock untuk Supabase Storage (Hanya jika belum ada di lingkungan lokal/CI non-Supabase)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        BEGIN
            EXECUTE 'CREATE SCHEMA IF NOT EXISTS storage';
            EXECUTE 'CREATE TABLE IF NOT EXISTS storage.buckets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                public BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            )';
            EXECUTE 'CREATE TABLE IF NOT EXISTS storage.objects (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bucket_id TEXT REFERENCES storage.buckets(id),
                name TEXT,
                owner UUID,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now(),
                last_accessed_at TIMESTAMPTZ DEFAULT now(),
                metadata JSONB
            )';
        EXCEPTION WHEN OTHERS THEN null;
        END;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'storage' AND p.proname = 'foldername') THEN
        BEGIN
            EXECUTE $fn$
                CREATE OR REPLACE FUNCTION storage.foldername(name text)
                RETURNS text[] LANGUAGE plpgsql AS $f$
                DECLARE parts text[];
                BEGIN
                    parts := string_to_array(name, '/');
                    IF array_length(parts, 1) <= 1 THEN RETURN ARRAY[]::text[]; END IF;
                    RETURN parts[1:array_length(parts, 1)-1];
                END;
                $f$;
            $fn$;
        EXCEPTION WHEN OTHERS THEN null;
        END;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'storage' AND p.proname = 'filename') THEN
        BEGIN
            EXECUTE $fn$
                CREATE OR REPLACE FUNCTION storage.filename(name text)
                RETURNS text LANGUAGE plpgsql AS $f$
                DECLARE parts text[];
                BEGIN
                    parts := string_to_array(name, '/');
                    RETURN parts[array_length(parts, 1)];
                END;
                $f$;
            $fn$;
        EXCEPTION WHEN OTHERS THEN null;
        END;
    END IF;
END $$;

-- 2. Registrasi Bucket Privat (materi & tugas)
INSERT INTO storage.buckets (id, name, public)
VALUES ('materi', 'materi', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('tugas', 'tugas', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DO $$ BEGIN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- 3. Fungsi Pembantu untuk Relasi Materi ke Kelas & Cek Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT public.has_global_role('SUPER_ADMIN')
        OR public.has_global_role('ACADEMIC_STAFF')
        OR public.has_global_role('SYSTEM_ADMIN');
$$;

CREATE OR REPLACE FUNCTION public.material_class(p_material_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
    SELECT class_id FROM public.materials WHERE id = p_material_id;
$$;

-- 4. Kebijakan RLS storage.objects untuk Bucket 'materi'
-- Konvensi path: materi/{kelasId}/{uuid}-{namaAman}
DROP POLICY IF EXISTS materi_storage_select ON storage.objects;
CREATE POLICY materi_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'materi' AND (
        public.is_class_staff(((storage.foldername(name))[1])::uuid)
        OR public.is_enrolled(((storage.foldername(name))[1])::uuid)
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS materi_storage_insert ON storage.objects;
CREATE POLICY materi_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'materi' AND (
        public.is_class_staff(((storage.foldername(name))[1])::uuid)
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS materi_storage_update ON storage.objects;
CREATE POLICY materi_storage_update ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'materi' AND (
        public.is_class_staff(((storage.foldername(name))[1])::uuid)
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS materi_storage_delete ON storage.objects;
CREATE POLICY materi_storage_delete ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'materi' AND (
        public.is_class_staff(((storage.foldername(name))[1])::uuid)
        OR public.is_admin()
    )
);

-- 5. Kebijakan RLS storage.objects untuk Bucket 'tugas'
-- Konvensi path: tugas/{tugasId}/{mahasiswaId}/{uuid}-{namaAman}
DROP POLICY IF EXISTS tugas_storage_select ON storage.objects;
CREATE POLICY tugas_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'tugas' AND (
        ((storage.foldername(name))[2])::uuid = (SELECT auth.uid())
        OR public.is_class_staff(public.assignment_class(((storage.foldername(name))[1])::uuid))
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS tugas_storage_insert ON storage.objects;
CREATE POLICY tugas_storage_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'tugas' AND (
        ((storage.foldername(name))[2])::uuid = (SELECT auth.uid())
        AND public.is_enrolled(public.assignment_class(((storage.foldername(name))[1])::uuid))
    )
);

DROP POLICY IF EXISTS tugas_storage_update ON storage.objects;
CREATE POLICY tugas_storage_update ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'tugas' AND ((storage.foldername(name))[2])::uuid = (SELECT auth.uid())
);

DROP POLICY IF EXISTS tugas_storage_delete ON storage.objects;
CREATE POLICY tugas_storage_delete ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'tugas' AND (
        ((storage.foldername(name))[2])::uuid = (SELECT auth.uid())
        OR public.is_admin()
    )
);

-- 6. Tabel Progres Belajar Materi (public.materi_progres)
CREATE TABLE IF NOT EXISTS public.materi_progres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materi_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    selesai BOOLEAN NOT NULL DEFAULT false,
    selesai_pada TIMESTAMPTZ,
    terakhir_dibuka TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_materi_progres UNIQUE (materi_id, mahasiswa_id)
);

CREATE INDEX IF NOT EXISTS idx_materi_progres_materi ON public.materi_progres(materi_id);
CREATE INDEX IF NOT EXISTS idx_materi_progres_mahasiswa ON public.materi_progres(mahasiswa_id);

DROP TRIGGER IF EXISTS tr_materi_progres_updated_at ON public.materi_progres;
CREATE TRIGGER tr_materi_progres_updated_at BEFORE UPDATE ON public.materi_progres
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.materi_progres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS materi_progres_select ON public.materi_progres;
CREATE POLICY materi_progres_select ON public.materi_progres
FOR SELECT TO authenticated
USING (
    mahasiswa_id = (SELECT auth.uid())
    OR public.is_class_staff(public.material_class(materi_id))
    OR public.is_admin()
);

DROP POLICY IF EXISTS materi_progres_insert ON public.materi_progres;
CREATE POLICY materi_progres_insert ON public.materi_progres
FOR INSERT TO authenticated
WITH CHECK (
    mahasiswa_id = (SELECT auth.uid())
    AND public.is_enrolled(public.material_class(materi_id))
);

DROP POLICY IF EXISTS materi_progres_update ON public.materi_progres;
CREATE POLICY materi_progres_update ON public.materi_progres
FOR UPDATE TO authenticated
USING (mahasiswa_id = (SELECT auth.uid()))
WITH CHECK (mahasiswa_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS materi_progres_delete ON public.materi_progres;
CREATE POLICY materi_progres_delete ON public.materi_progres
FOR DELETE TO authenticated
USING (
    mahasiswa_id = (SELECT auth.uid())
    OR public.is_admin()
);
