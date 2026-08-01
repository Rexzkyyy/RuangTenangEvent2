-- Tabel Registrasi Ruang Tenang
CREATE TABLE public.rt_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    nama_lengkap TEXT NOT NULL,
    email TEXT NOT NULL,
    no_whatsapp TEXT NOT NULL,
    usia INTEGER NOT NULL,
    jenis_kelamin TEXT NOT NULL,
    jenis_tiket TEXT NOT NULL,
    sumber_info JSONB NOT NULL,
    jumlah_tiket INTEGER NOT NULL,
    metode_pembayaran TEXT NOT NULL,
    bukti_transfer_url TEXT NOT NULL,
    tujuan_event TEXT NOT NULL,
    bukti_follow_ig_url TEXT NOT NULL,
    pernyataan_benar BOOLEAN NOT NULL DEFAULT TRUE,
    status_pembayaran TEXT NOT NULL DEFAULT 'Pending',
    jumlah_checkin INTEGER NOT NULL DEFAULT 0,
    status_wa BOOLEAN NOT NULL DEFAULT FALSE,
    waktu_absen TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jika tabel sudah ada, gunakan query berikut untuk menambahkan kolom:
-- ALTER TABLE public.rt_participants ADD COLUMN status_wa BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE public.rt_participants ADD COLUMN waktu_absen TIMESTAMPTZ;
-- ALTER TABLE public.rt_participants ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Aturan Keamanan (RLS) untuk tabel rt_participants
ALTER TABLE public.rt_participants ENABLE ROW LEVEL SECURITY;

-- 1. Siapa saja (Anon) boleh insert/daftar
CREATE POLICY "Enable insert for public" ON public.rt_participants
    FOR INSERT WITH CHECK (true);

-- 2. Hanya admin (authenticated) yang boleh baca (SELECT)
CREATE POLICY "Enable select for authenticated users only" ON public.rt_participants
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Hanya admin (authenticated) yang boleh update (UPDATE - untuk checkin & validasi)
CREATE POLICY "Enable update for authenticated users only" ON public.rt_participants
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Hanya admin (authenticated) yang boleh hapus (DELETE)
CREATE POLICY "Enable delete for authenticated users only" ON public.rt_participants
    FOR DELETE USING (auth.role() = 'authenticated');


-- ==========================================
-- STORAGE (Bucket untuk foto)
-- ==========================================

-- Buat bucket bernama 'rt_proofs'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rt_proofs', 'rt_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS untuk Storage rt_proofs
-- 1. Publik boleh upload foto (INSERT)
CREATE POLICY "Public Upload to rt_proofs" ON storage.objects
    FOR INSERT 
    WITH CHECK ( bucket_id = 'rt_proofs' );

-- 2. Publik boleh baca foto (SELECT)
CREATE POLICY "Public Read from rt_proofs" ON storage.objects
    FOR SELECT 
    USING ( bucket_id = 'rt_proofs' );

-- 3. Hanya admin yang boleh menghapus foto (DELETE)
CREATE POLICY "Admin Delete from rt_proofs" ON storage.objects
    FOR DELETE
    USING ( auth.role() = 'authenticated' AND bucket_id = 'rt_proofs' );
