create extension if not exists pgcrypto;
create table profiles(id uuid primary key references auth.users on delete cascade, full_name text, created_at timestamptz default now());
create table exercises(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade,
 name text not null check(length(trim(name))>0), category text not null check(category in('PUSH','PULL','LEGS')), muscle_group text not null, created_at timestamptz default now());
create unique index exercises_builtin_uq on exercises(category,name) where user_id is null;
create unique index exercises_user_uq on exercises(user_id,category,lower(name)) where user_id is not null;
create table exercise_favorites(user_id uuid not null references auth.users on delete cascade, exercise_id uuid not null references exercises on delete cascade, primary key(user_id,exercise_id));
create table workout_sessions(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 date date not null, category text not null check(category in('PUSH','PULL','LEGS')), notes text, created_at timestamptz default now(), unique(user_id,date,category));
create table workout_exercises(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 session_id uuid not null references workout_sessions on delete cascade, exercise_id uuid not null references exercises on delete cascade, position int not null default 0, notes text, created_at timestamptz default now());
create table workout_sets(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 workout_exercise_id uuid not null references workout_exercises on delete cascade, set_no int not null,
 weight numeric(6,2) not null default 0 check(weight>=0), reps int not null default 0 check(reps>=0), rpe numeric(3,1) check(rpe between 0 and 10), created_at timestamptz default now());
create table workout_templates(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 name text not null, category text not null check(category in('PUSH','PULL','LEGS')), exercises jsonb not null default '[]', created_at timestamptz default now());
create table bodyweight_logs(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 date date not null, weight_kg numeric(5,2) not null check(weight_kg>0), created_at timestamptz default now(), unique(user_id,date));
create table body_measurements(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 date date not null, arm numeric, chest numeric, waist numeric, thigh numeric, shoulder numeric, created_at timestamptz default now());
create table progress_photos(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 date date not null, path text not null, note text, created_at timestamptz default now());

create index on workout_sessions(user_id,date);
create index on workout_exercises(session_id);
create index on workout_exercises(exercise_id);
create index on workout_sets(workout_exercise_id);
create index on bodyweight_logs(user_id,date);

-- Row Level Security
do $$ declare t text; begin
 foreach t in array array['workout_sessions','workout_exercises','workout_sets','workout_templates','bodyweight_logs','body_measurements','progress_photos','exercise_favorites'] loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy "own rows" on %I for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid())',t);
 end loop; end $$;
alter table profiles enable row level security;
create policy "own profile" on profiles for all to authenticated using (id=auth.uid()) with check (id=auth.uid());
alter table exercises enable row level security;
create policy "read builtin+own" on exercises for select to authenticated using (user_id is null or user_id=auth.uid());
create policy "insert own" on exercises for insert to authenticated with check (user_id=auth.uid());
create policy "update own" on exercises for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "delete own" on exercises for delete to authenticated using (user_id=auth.uid());

-- Auto-create profile
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Storage bucket for progress photos (private, folder per user)
insert into storage.buckets(id,name,public) values('progress-photos','progress-photos',false) on conflict do nothing;
create policy "own photos" on storage.objects for all to authenticated
 using (bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text)
 with check (bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text);

-- Built-in exercises
insert into exercises(category,muscle_group,name) values
('PUSH','Chest','Barbell Bench Press'),
('PUSH','Chest','Incline Barbell Bench Press'),
('PUSH','Chest','Incline Dumbbell Press'),
('PUSH','Chest','Flat Dumbbell Press'),
('PUSH','Chest','Pec Deck Fly'),
('PUSH','Chest','Cable Chest Fly'),
('PUSH','Chest','Low to High Cable Fly'),
('PUSH','Chest','High to Low Cable Fly'),
('PUSH','Chest','Chest Press Machine'),
('PUSH','Shoulders','Seated Shoulder Press'),
('PUSH','Shoulders','Dumbbell Shoulder Press'),
('PUSH','Shoulders','Lateral Raise'),
('PUSH','Shoulders','Cable Lateral Raise'),
('PUSH','Shoulders','Machine Lateral Raise'),
('PUSH','Shoulders','Front Raise'),
('PUSH','Shoulders','Reverse Pec Deck'),
('PUSH','Triceps','Triceps Pushdown'),
('PUSH','Triceps','Rope Pushdown'),
('PUSH','Triceps','Overhead Cable Extension'),
('PUSH','Triceps','Skull Crusher'),
('PUSH','Triceps','Close Grip Bench Press'),
('PUSH','Triceps','Single Arm Cable Extension'),
('PULL','Back','Lat Pulldown'),
('PULL','Back','Wide Grip Lat Pulldown'),
('PULL','Back','Close Grip Lat Pulldown'),
('PULL','Back','Pull Up'),
('PULL','Back','Assisted Pull Up'),
('PULL','Back','Barbell Row'),
('PULL','Back','Seated Cable Row'),
('PULL','Back','Chest Supported Row'),
('PULL','Back','T-Bar Row'),
('PULL','Back','One Arm Dumbbell Row'),
('PULL','Back','Straight Arm Pulldown'),
('PULL','Back','Machine Row'),
('PULL','Rear Delts','Reverse Pec Deck'),
('PULL','Rear Delts','Cable Rear Delt Fly'),
('PULL','Rear Delts','Face Pull'),
('PULL','Biceps','Barbell Curl'),
('PULL','Biceps','EZ Bar Curl'),
('PULL','Biceps','Dumbbell Bicep Curl'),
('PULL','Biceps','Hammer Curl'),
('PULL','Biceps','Incline Dumbbell Curl'),
('PULL','Biceps','Preacher Curl'),
('PULL','Biceps','Cable Curl'),
('PULL','Biceps','Concentration Curl'),
('LEGS','Quadriceps','Barbell Squat'),
('LEGS','Quadriceps','Hack Squat'),
('LEGS','Quadriceps','Leg Press'),
('LEGS','Quadriceps','Leg Extension'),
('LEGS','Quadriceps','Bulgarian Split Squat'),
('LEGS','Quadriceps','Goblet Squat'),
('LEGS','Hamstrings','Romanian Deadlift'),
('LEGS','Hamstrings','Lying Leg Curl'),
('LEGS','Hamstrings','Seated Leg Curl'),
('LEGS','Hamstrings','Stiff Leg Deadlift'),
('LEGS','Glutes','Hip Thrust'),
('LEGS','Glutes','Glute Bridge'),
('LEGS','Glutes','Cable Kickback'),
('LEGS','Calves','Standing Calf Raise'),
('LEGS','Calves','Seated Calf Raise'),
('LEGS','Calves','Leg Press Calf Raise');
