-- ============================================================
-- SMART CROP AI — PostgreSQL Database Setup
-- ============================================================
-- Jalankan script ini di PostgreSQL server kamu untuk membuat
-- semua tabel yang dibutuhkan aplikasi Smart Crop AI.
--
-- Cara pakai:
--   psql -h <HOST> -U <USER> -d <DATABASE_NAME> -f database-setup.sql
-- ============================================================


-- ============================================================
-- 1. TABEL: crops
--    Menyimpan data jenis tanaman dan penyakit umum per negara ASEAN.
--    Diisi sekali saat setup (seed data), tidak berubah-ubah.
-- ============================================================
CREATE TABLE IF NOT EXISTS crops (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,                  -- Nama tanaman (English): "Rice", "Oil Palm"
    local_name      TEXT,                           -- Nama lokal: "Padi", "Kelapa Sawit"
    type            TEXT NOT NULL,                  -- Kode jenis: "rice", "oil_palm", "corn", "cassava"
    countries       TEXT[] NOT NULL,                -- Array negara ASEAN: '{ID,TH,VN,PH,MY}'
    common_diseases TEXT[] NOT NULL,                -- Daftar penyakit umum pada tanaman ini
    description     TEXT NOT NULL,                  -- Deskripsi singkat tanaman
    image_url       TEXT,                           -- URL foto tanaman (opsional)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. TABEL: scans
--    Inti aplikasi. Menyimpan setiap scan foto tanaman dari petani,
--    termasuk hasil analisis AI (penyakit, confidence, severity).
-- ============================================================
CREATE TABLE IF NOT EXISTS scans (
    id                  SERIAL PRIMARY KEY,
    crop_type           TEXT NOT NULL,              -- Jenis tanaman: "rice", "oil_palm", "corn", "cassava"
    country             TEXT NOT NULL,              -- Kode negara: "ID", "TH", "VN", "PH", "MY"
    region              TEXT NOT NULL,              -- Nama daerah/provinsi petani
    farmer_name         TEXT,                       -- Nama petani (opsional)
    image_url           TEXT,                       -- URL foto tanaman (jika disimpan di cloud storage)
    image_base64        TEXT,                       -- Foto dalam format base64 (jika disimpan di DB)
    detected_disease    TEXT,                       -- Nama penyakit yang terdeteksi AI
    disease_confidence  REAL,                       -- Tingkat kepercayaan AI: 0.0 - 100.0 (persen)
    severity            TEXT,                       -- Tingkat keparahan: "mild", "moderate", "severe"
    ai_analysis         TEXT,                       -- Analisis lengkap dari AI (paragraf panjang)
    treatment_suggestion TEXT,                      -- Saran pengobatan dari AI
    status              TEXT NOT NULL DEFAULT 'pending', -- Status: "pending", "completed", "failed"
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. TABEL: recommendations
--    Rekomendasi pupuk/pestisida per scan.
--    Satu scan bisa punya banyak rekomendasi.
-- ============================================================
CREATE TABLE IF NOT EXISTS recommendations (
    id                  SERIAL PRIMARY KEY,
    scan_id             INTEGER NOT NULL,           -- Referensi ke scans.id
    disease             TEXT NOT NULL,              -- Nama penyakit yang ditangani
    crop_type           TEXT NOT NULL,              -- Jenis tanaman
    country             TEXT NOT NULL,              -- Negara (menentukan produk lokal yang direkomendasikan)
    fertilizer_name     TEXT NOT NULL,              -- Nama produk pupuk/pestisida
    fertilizer_type     TEXT NOT NULL,              -- Jenis: "fungicide", "insecticide", "fertilizer", dll
    application_method  TEXT NOT NULL,              -- Cara aplikasi: "semprot", "taburkan", dll
    dosage              TEXT NOT NULL,              -- Dosis: misal "2 liter per hektar"
    local_availability  TEXT,                       -- Toko/koperasi lokal yang menjual produk ini
    subsidized          BOOLEAN NOT NULL DEFAULT FALSE, -- Apakah produk ini disubsidi pemerintah?
    ai_guidance         TEXT NOT NULL,              -- Panduan lengkap dari AI dalam bahasa setempat
    additional_notes    TEXT,                       -- Catatan tambahan
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_scan FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
);


-- ============================================================
-- 4. TABEL: reports
--    Laporan monitoring dari petugas pemerintah/dinas pertanian.
--    Berisi ringkasan inspeksi lahan, kasus penyakit, dan level risiko.
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id                      SERIAL PRIMARY KEY,
    title                   TEXT NOT NULL,          -- Judul laporan
    country                 TEXT NOT NULL,          -- Negara
    region                  TEXT NOT NULL,          -- Daerah yang dilaporkan
    report_type             TEXT NOT NULL,          -- Jenis: "weekly", "monthly", "outbreak_alert", "survey"
    summary                 TEXT NOT NULL,          -- Ringkasan isi laporan
    total_farms_inspected   INTEGER NOT NULL,       -- Total lahan yang diperiksa
    disease_cases_found     INTEGER NOT NULL,       -- Jumlah kasus penyakit ditemukan
    affected_area_hectares  REAL NOT NULL,          -- Luas lahan terdampak (hektar)
    risk_level              TEXT NOT NULL,          -- Level risiko: "low", "medium", "high", "critical"
    recommendations         TEXT,                   -- Rekomendasi tindakan dari pemerintah
    created_by              TEXT,                   -- Nama petugas yang membuat laporan
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. TABEL: conversations & messages
--    Untuk fitur chat AI (jika diaktifkan).
--    messages mengacu ke conversations dengan CASCADE delete.
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id                  SERIAL PRIMARY KEY,
    conversation_id     INTEGER NOT NULL,
    role                TEXT NOT NULL,              -- "user" atau "assistant"
    content             TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);


-- ============================================================
-- INDEX: untuk mempercepat query yang sering dipakai
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_scans_country     ON scans(country);
CREATE INDEX IF NOT EXISTS idx_scans_status      ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at  ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_crop_type   ON scans(crop_type);
CREATE INDEX IF NOT EXISTS idx_recs_scan_id      ON recommendations(scan_id);
CREATE INDEX IF NOT EXISTS idx_reports_country   ON reports(country);
CREATE INDEX IF NOT EXISTS idx_reports_risk      ON reports(risk_level);
CREATE INDEX IF NOT EXISTS idx_msgs_conv_id      ON messages(conversation_id);


-- ============================================================
-- SEED DATA: Tanaman ASEAN (jalankan sekali saat setup)
-- ============================================================
INSERT INTO crops (name, local_name, type, countries, common_diseases, description) VALUES
(
    'Rice', 'Padi',
    'rice',
    ARRAY['ID','TH','VN','PH','MY'],
    ARRAY['Blast','Brown Spot','Bacterial Leaf Blight','Sheath Blight','Tungro'],
    'Tanaman pangan utama ASEAN, ditanam di sawah irigasi maupun lahan kering.'
),
(
    'Oil Palm', 'Kelapa Sawit',
    'oil_palm',
    ARRAY['ID','MY','TH'],
    ARRAY['Ganoderma Basal Stem Rot','Crown Disease','Bud Rot','Leaf Spot'],
    'Tanaman penghasil minyak sawit terbesar di dunia, dominan di Indonesia dan Malaysia.'
),
(
    'Corn', 'Jagung',
    'corn',
    ARRAY['ID','PH','TH','VN','MY'],
    ARRAY['Northern Corn Leaf Blight','Gray Leaf Spot','Common Rust','Stalk Rot'],
    'Tanaman serealia penting untuk pangan dan pakan ternak di seluruh ASEAN.'
),
(
    'Cassava', 'Singkong',
    'cassava',
    ARRAY['ID','TH','VN','PH'],
    ARRAY['Cassava Mosaic Disease','Brown Streak','Bacterial Blight','Anthracnose'],
    'Umbi-umbian ketahanan tinggi, penting untuk ketahanan pangan dan industri tapioka.'
)
ON CONFLICT DO NOTHING;


-- ============================================================
-- CARA MENGHUBUNGKAN KE APLIKASI
-- ============================================================
-- Setelah database dibuat, atur environment variable ini:
--
--   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME
--
-- Contoh (Supabase):
--   DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
--
-- Contoh (Railway):
--   DATABASE_URL=postgresql://postgres:password@roundhouse.proxy.rlwy.net:12345/railway
--
-- Contoh (VPS sendiri):
--   DATABASE_URL=postgresql://smartcrop_user:password@123.45.67.89:5432/smartcrop_db
--
-- Di Replit: masuk ke Secrets (ikon gembok) → ubah nilai DATABASE_URL
-- ============================================================
