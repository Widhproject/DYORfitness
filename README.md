# DYORFitness
## Setup Supabase
1. Buat project di supabase.com. Buka **SQL Editor**, jalankan seluruh isi `supabase/schema.sql` (tabel, RLS, trigger profil, bucket foto, seed exercise).
2. **Authentication > Providers**: Email aktif, "Confirm email" aktif (verifikasi email).
3. **Authentication > URL Configuration**: isi Site URL dengan URL Netlify Anda; tambahkan `http://localhost:5173` dan URL Netlify di Redirect URLs (untuk verifikasi & reset password).
4. **Project Settings > API**: salin Project URL dan anon public key.
## Jalankan lokal
`cp .env.example .env` (isi nilainya) lalu `npm install && npm run dev`
## Deploy
1. Push ke GitHub (`git init && git add . && git commit -m init`, lalu push ke repo baru).
2. Netlify > Add new site > Import from Git > pilih repo. Build command `npm run build`, publish `dist` (sudah di `netlify.toml`).
3. Site configuration > Environment variables: tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`, lalu deploy ulang.

## Update Prioritas 1
Jalankan `supabase/migration_001.sql` di SQL Editor (sekali saja), lalu deploy ulang. Tes: `npm test`.

## Update Prioritas 2
Jalankan `supabase/migration_002.sql` di SQL Editor (sekali). Halaman baru: Programs (tombol di halaman Workout) dan tab Otot di Progress.

## Update Prioritas 3 (Offline/PWA)
Jalankan `supabase/migration_003.sql` (sekali). Deploy ke Netlify (HTTPS wajib untuk PWA). Buka aplikasi online sekali agar tersimpan, lalu bisa dipakai offline.
