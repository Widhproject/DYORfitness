# Uji manual (butuh Supabase asli). Jalankan setelah migration_005.
A. Buat workout 10 Nov, Bench Press 3 set (40/45/50). Tunggu "Saved ✓". Cek tabel workout_sets di Supabase. Refresh: data tetap ada.
B. Buat workout 14 Nov (45/50/55). Buka kembali 10 Nov: harus 40/45/50. Buka 14 Nov: 45/50/55. Pindah tanggal cepat-cepatan 10 kali: data tidak boleh tertukar.
C. Di 10 Nov ubah set 2 menjadi 47,5. Refresh: hanya set 2 yang berubah.
D. Buka 14 Nov: tabel "Last Workout" menampilkan 10 Nov. Klik Copy Previous Sets, ubah beban, lalu cek 10 Nov tidak berubah.
E. Dua akun berbeda: akun B tidak melihat data A. Opsional: jalankan supabase/rls_test.sql.
F. Mode pesawat saat mengetik beban: muncul "Offline: tersimpan di perangkat". Nyalakan internet: Saving… lalu Saved ✓, tanpa data ganda di Supabase.
