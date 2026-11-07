-- MIGRASI 003 (Prioritas 3): updated_at otomatis untuk deteksi konflik sinkronisasi offline. Aman dijalankan ulang.
create or replace function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
alter table workout_sessions add column if not exists updated_at timestamptz not null default now();
alter table workout_exercises add column if not exists updated_at timestamptz not null default now();
alter table food_logs add column if not exists updated_at timestamptz not null default now();
update workout_sets set updated_at=now() where updated_at is null;
alter table workout_sets alter column updated_at set default now();
do $$ declare t text; begin
 foreach t in array array['workout_sessions','workout_exercises','workout_sets','food_logs'] loop
  execute format('drop trigger if exists trg_updated on %I',t);
  execute format('create trigger trg_updated before update on %I for each row execute function set_updated_at()',t);
 end loop; end $$;
