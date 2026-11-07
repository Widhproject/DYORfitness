-- MIGRASI 002 (Prioritas 2): program/template + muscle analytics. Aman dijalankan di database yang sudah ada.
alter table exercises add column if not exists primary_muscle_group text check(primary_muscle_group in('chest','back','shoulders','biceps','triceps','quadriceps','hamstrings','glutes','calves'));
alter table exercises add column if not exists secondary_muscle_groups text[] not null default '{}';
alter table exercises add column if not exists equipment text;
alter table exercises add column if not exists exercise_category text check(exercise_category in('compound','isolation'));
update exercises set primary_muscle_group=case muscle_group when 'Chest' then 'chest' when 'Back' then 'back' when 'Shoulders' then 'shoulders' when 'Rear Delts' then 'shoulders'
 when 'Biceps' then 'biceps' when 'Triceps' then 'triceps' when 'Quadriceps' then 'quadriceps' when 'Hamstrings' then 'hamstrings' when 'Glutes' then 'glutes' when 'Calves' then 'calves' end
 where primary_muscle_group is null;
update exercises set exercise_category='isolation' where user_id is null and exercise_category is null;
-- Otot sekunder (hanya exercise bawaan majemuk); dihitung terpisah sebagai "indirect sets", bukan set penuh.
update exercises set secondary_muscle_groups='{triceps,shoulders}',exercise_category='compound' where user_id is null and name in('Barbell Bench Press','Incline Barbell Bench Press','Incline Dumbbell Press','Flat Dumbbell Press','Chest Press Machine');
update exercises set secondary_muscle_groups='{chest,shoulders}',exercise_category='compound' where user_id is null and name='Close Grip Bench Press';
update exercises set secondary_muscle_groups='{triceps}',exercise_category='compound' where user_id is null and name in('Seated Shoulder Press','Dumbbell Shoulder Press');
update exercises set secondary_muscle_groups='{biceps}',exercise_category='compound' where user_id is null and name in('Lat Pulldown','Wide Grip Lat Pulldown','Close Grip Lat Pulldown','Pull Up','Assisted Pull Up','Barbell Row','Seated Cable Row','Chest Supported Row','T-Bar Row','One Arm Dumbbell Row','Machine Row');
update exercises set secondary_muscle_groups='{glutes}',exercise_category='compound' where user_id is null and name in('Barbell Squat','Hack Squat','Leg Press','Bulgarian Split Squat','Goblet Squat','Romanian Deadlift','Stiff Leg Deadlift');
update exercises set secondary_muscle_groups='{hamstrings}',exercise_category='compound' where user_id is null and name in('Hip Thrust','Glute Bridge');

alter table workout_sessions drop constraint if exists workout_sessions_category_check;
alter table workout_sessions add constraint workout_sessions_category_check check(category in('PUSH','PULL','LEGS','UPPER','LOWER','CUSTOM'));
alter table workout_sessions add column if not exists program_name text;
alter table workout_sessions add column if not exists day_label text;
-- Snapshot nama & target per exercise di sesi (riwayat tidak berubah saat template diedit)
alter table workout_exercises add column if not exists exercise_name text;
alter table workout_exercises add column if not exists target_sets int check(target_sets>0);
alter table workout_exercises add column if not exists target_reps int check(target_reps>0);
alter table workout_exercises add column if not exists target_weight numeric(6,2) check(target_weight>=0);
alter table workout_exercises add column if not exists target_rpe numeric(3,1) check(target_rpe between 0 and 10);
alter table workout_exercises add column if not exists rest_sec int check(rest_sec between 5 and 3600);

create table if not exists workout_programs(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 name text not null check(length(trim(name))>0), favorite boolean not null default false, created_at timestamptz default now());
create table if not exists workout_program_days(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 program_id uuid not null references workout_programs on delete cascade, day_label text not null, weekday int check(weekday between 0 and 6),
 category text not null check(category in('PUSH','PULL','LEGS','UPPER','LOWER','CUSTOM')), position int not null default 0);
create table if not exists workout_program_exercises(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 day_id uuid not null references workout_program_days on delete cascade, exercise_id uuid not null references exercises on delete cascade, position int not null default 0,
 target_sets int check(target_sets>0), target_reps int check(target_reps>0), target_weight numeric(6,2) check(target_weight>=0), target_rpe numeric(3,1) check(target_rpe between 0 and 10), rest_sec int check(rest_sec between 5 and 3600));
create index if not exists wpd_program on workout_program_days(program_id);
create index if not exists wpe_day on workout_program_exercises(day_id);
do $$ declare t text; begin
 foreach t in array array['workout_programs','workout_program_days','workout_program_exercises'] loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy "own rows" on %I for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid())',t);
 end loop; end $$;
