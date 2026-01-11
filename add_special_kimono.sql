-- Adicionar campo para kimono especial desbloqueável
ALTER TABLE students ADD COLUMN specialKimono VARCHAR(30) DEFAULT 'none' AFTER avatarPose;
