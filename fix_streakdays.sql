-- Renomear coluna streakdays para streakDays
ALTER TABLE student_points CHANGE COLUMN streakdays streakDays INT DEFAULT 0;
