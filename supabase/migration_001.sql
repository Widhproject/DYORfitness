-- MIGRASI 001 (Prioritas 1): aman dijalankan di database yang sudah ada, tidak menghapus data.
alter table workout_sets add column if not exists set_type text not null default 'working' check(set_type in('warmup','working','drop','failure'));
alter table workout_sets add column if not exists rir numeric(3,1) check(rir between 0 and 10);
alter table workout_sets add column if not exists notes text;
alter table workout_sets add column if not exists updated_at timestamptz default now();
alter table profiles add column if not exists weight_kg numeric(5,2) check(weight_kg>0 and weight_kg<500);
alter table profiles add column if not exists height_cm numeric(5,1) check(height_cm between 50 and 260);
alter table profiles add column if not exists age int check(age between 10 and 100);
alter table profiles add column if not exists goal text check(goal in('bulking','cutting','maintenance','general'));

create table if not exists rest_timer_preferences(user_id uuid primary key references auth.users on delete cascade,
 default_sec int not null default 90 check(default_sec between 5 and 3600), auto_start boolean not null default true, sound boolean not null default true,
 sound_type text not null default 'beep', volume numeric(3,2) not null default 0.7 check(volume between 0 and 1), vibrate boolean not null default true, notify boolean not null default false);
create table if not exists protein_targets(user_id uuid primary key references auth.users on delete cascade,
 g_per_kg numeric(3,1) check(g_per_kg between 0.5 and 4), target_g numeric(6,1) not null check(target_g>0), updated_at timestamptz default now());
create table if not exists food_database(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade,
 name text not null check(length(trim(name))>0), category text not null, unit text not null default 'g' check(unit in('g','unit')), unit_label text,
 protein_per_100g numeric(5,2), protein_per_unit numeric(5,2), state text not null default 'n/a' check(state in('raw','cooked','n/a')), source text,
 check((unit='g' and protein_per_100g>=0) or (unit='unit' and protein_per_unit>=0)));
create unique index if not exists food_builtin_uq on food_database(name,state) where user_id is null;
create table if not exists food_logs(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 date date not null, food_id uuid not null references food_database on delete cascade, amount numeric(8,2) not null check(amount>0),
 protein_g numeric(7,2) not null check(protein_g>=0), created_at timestamptz default now());
create index if not exists food_logs_user_date on food_logs(user_id,date);

do $$ declare t text; begin
 foreach t in array array['rest_timer_preferences','protein_targets','food_logs'] loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy "own rows" on %I for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid())',t);
 end loop; end $$;
alter table food_database enable row level security;
create policy "read builtin+own" on food_database for select to authenticated using (user_id is null or user_id=auth.uid());
create policy "insert own" on food_database for insert to authenticated with check (user_id=auth.uid());
create policy "update own" on food_database for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "delete own" on food_database for delete to authenticated using (user_id=auth.uid());

-- Nilai protein dibulatkan dari USDA FoodData Central (perkiraan). Verifikasi/edit sesuai kebutuhan; whey: ikuti label produk Anda.
insert into food_database(name,category,unit,unit_label,protein_per_100g,protein_per_unit,state,source) values
('Dada ayam','Hewani','g',null,31.0,null,'cooked','USDA FDC (perkiraan)'),
('Dada ayam','Hewani','g',null,22.5,null,'raw','USDA FDC (perkiraan)'),
('Paha ayam','Hewani','g',null,26.0,null,'cooked','USDA FDC (perkiraan)'),
('Telur ayam','Hewani','unit','butir',null,6.3,'n/a','USDA FDC, telur ukuran besar (perkiraan)'),
('Putih telur','Hewani','g',null,10.9,null,'raw','USDA FDC (perkiraan)'),
('Daging sapi (sirloin)','Hewani','g',null,27.0,null,'cooked','USDA FDC (perkiraan)'),
('Ikan tuna','Hewani','g',null,29.9,null,'cooked','USDA FDC (perkiraan)'),
('Ikan salmon','Hewani','g',null,22.1,null,'cooked','USDA FDC (perkiraan)'),
('Ikan lele','Hewani','g',null,18.5,null,'cooked','USDA FDC (perkiraan)'),
('Ikan kembung','Hewani','g',null,23.8,null,'cooked','USDA FDC (perkiraan)'),
('Udang','Hewani','g',null,24.0,null,'cooked','USDA FDC (perkiraan)'),
('Susu sapi','Hewani','unit','gelas (250 ml)',null,8.2,'n/a','USDA FDC, susu full cream (perkiraan)'),
('Whey protein','Hewani','unit','scoop',null,24.0,'n/a','Rata-rata label produk; sesuaikan dengan produk Anda'),
('Tempe','Nabati','g',null,20.3,null,'n/a','USDA FDC (perkiraan)'),
('Tahu putih','Nabati','g',null,8.1,null,'raw','USDA FDC, tofu firm (perkiraan)'),
('Edamame','Nabati','g',null,11.9,null,'cooked','USDA FDC (perkiraan)'),
('Kacang tanah','Nabati','g',null,25.8,null,'raw','USDA FDC (perkiraan)'),
('Kacang kedelai','Nabati','g',null,18.2,null,'cooked','USDA FDC, rebus (perkiraan)')
on conflict do nothing;
