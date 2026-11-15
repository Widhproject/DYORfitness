-- MIGRASI 006: 8 exercise baru yang punya gambar contoh. Aman dijalankan ulang.
insert into exercises(category,muscle_group,name,primary_muscle_group,exercise_category,secondary_muscle_groups) values
('PUSH','Chest','Push Up','chest','compound','{triceps,shoulders}'),
('PUSH','Triceps','Dips','triceps','compound','{chest,shoulders}'),
('PUSH','Triceps','Bench Dip','triceps','compound','{shoulders}'),
('PUSH','Shoulders','Overhead Barbell Press','shoulders','compound','{triceps}'),
('PUSH','Shoulders','Upright Row','shoulders','compound','{}'),
('PUSH','Chest','Flat Dumbbell Fly','chest','isolation','{}'),
('PUSH','Triceps','Overhead Dumbbell Extension','triceps','isolation','{}'),
('PULL','Rear Delts','Dumbbell Rear Delt Fly','shoulders','isolation','{}')
on conflict do nothing;
