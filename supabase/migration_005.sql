-- MIGRASI 005: riwayat workout permanen. Aman dijalankan ulang, tidak menghapus data.
do $$ begin
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='workout_sessions' and column_name='status') then
  alter table workout_sessions add column status text not null default 'draft' check(status in('draft','completed'));
  update workout_sessions set status='completed';   -- sesi lama dianggap selesai (hanya dijalankan sekali)
 end if;
end $$;
alter table workout_sessions add column if not exists name text;
alter table workout_sets add column if not exists completed boolean not null default false;
-- Beberapa sesi pada tanggal dan kategori yang sama diizinkan; identitas sesi adalah id, bukan tanggal
alter table workout_sessions drop constraint if exists workout_sessions_user_id_date_category_key;
create index if not exists workout_sessions_user_date_cat on workout_sessions(user_id,date,category);
-- RLS lebih ketat: baris anak hanya boleh menempel pada induk milik sendiri
drop policy if exists "own rows" on workout_exercises;
drop policy if exists "own rows" on workout_sets;
create policy "own rows" on workout_exercises for all to authenticated using (user_id=auth.uid())
 with check (user_id=auth.uid() and exists(select 1 from workout_sessions s where s.id=session_id and s.user_id=auth.uid()));
create policy "own rows" on workout_sets for all to authenticated using (user_id=auth.uid())
 with check (user_id=auth.uid() and exists(select 1 from workout_exercises e where e.id=workout_exercise_id and e.user_id=auth.uid()));
