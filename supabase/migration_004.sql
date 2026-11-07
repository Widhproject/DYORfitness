-- MIGRASI 004: kelompok otot Abs + 8 exercise perut di paket LEGS. Aman dijalankan ulang.
alter table exercises drop constraint if exists exercises_primary_muscle_group_check;
alter table exercises add constraint exercises_primary_muscle_group_check check(primary_muscle_group in('chest','back','shoulders','biceps','triceps','quadriceps','hamstrings','glutes','calves','abs'));
insert into exercises(category,muscle_group,name,primary_muscle_group,exercise_category) values
('LEGS','Abs','Crunch','abs','isolation'),
('LEGS','Abs','Cable Crunch','abs','isolation'),
('LEGS','Abs','Hanging Leg Raise','abs','compound'),
('LEGS','Abs','Lying Leg Raise','abs','isolation'),
('LEGS','Abs','Plank','abs','isolation'),
('LEGS','Abs','Russian Twist','abs','isolation'),
('LEGS','Abs','Ab Wheel Rollout','abs','compound'),
('LEGS','Abs','Decline Sit-Up','abs','isolation')
on conflict do nothing;
