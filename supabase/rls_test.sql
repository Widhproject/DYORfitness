-- Uji RLS lintas akun (belum dijalankan oleh pembuatnya; jalankan di SQL Editor). Semua dibatalkan oleh ROLLBACK.
-- Jika insert ke auth.users ditolak di versi Supabase Anda, lakukan Test E secara manual dengan dua akun asli.
begin;
insert into auth.users(id,email) values ('00000000-0000-0000-0000-0000000000a1','rls_a@test.local'),('00000000-0000-0000-0000-0000000000b1','rls_b@test.local');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}',true);
insert into workout_sessions(id,user_id,date,category) values ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-0000000000a1','2026-11-10','PUSH');
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}',true);
select 'B melihat sesi A (harus 0)' as uji, count(*) as hasil from workout_sessions;
with u as (update workout_sessions set notes='diretas' returning 1) select 'B mengubah sesi A (harus 0)' as uji, count(*) as hasil from u;
with d as (delete from workout_sessions returning 1) select 'B menghapus sesi A (harus 0)' as uji, count(*) as hasil from d;
do $$ begin
 begin insert into workout_exercises(user_id,session_id,exercise_id) select '00000000-0000-0000-0000-0000000000b1','11111111-1111-1111-1111-111111111111',id from exercises limit 1;
  raise exception 'GAGAL: B bisa menempelkan exercise ke sesi A';
 exception when insufficient_privilege then null; end;
end $$;
select 'PASS: semua uji RLS lolos' as hasil;
rollback;
