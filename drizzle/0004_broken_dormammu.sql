-- Adicionar novas colunas do plano de curso
ALTER TABLE subjects ADD COLUMN ementa TEXT;
ALTER TABLE subjects ADD COLUMN generalObjective TEXT;
ALTER TABLE subjects ADD COLUMN specificObjectives TEXT;
ALTER TABLE subjects ADD COLUMN programContent TEXT;
ALTER TABLE subjects ADD COLUMN basicBibliography TEXT;
ALTER TABLE subjects ADD COLUMN complementaryBibliography TEXT;

-- Remover colunas antigas
ALTER TABLE subjects DROP COLUMN IF EXISTS courseObjectives;
ALTER TABLE subjects DROP COLUMN IF EXISTS courseContent;
ALTER TABLE subjects DROP COLUMN IF EXISTS methodology;
ALTER TABLE subjects DROP COLUMN IF EXISTS evaluation;
ALTER TABLE subjects DROP COLUMN IF EXISTS bibliography;
