import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const connection = await mysql.createConnection(url);

try {
  // Criar tabela academic_periods
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS academic_periods (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacherId INT NOT NULL,
      schoolYear INT NOT NULL,
      bimestre INT NOT NULL,
      startDate DATE NOT NULL,
      endDate DATE NOT NULL,
      description VARCHAR(300),
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_teacher_year (teacherId, schoolYear),
      UNIQUE KEY unique_teacher_year_bimestre (teacherId, schoolYear, bimestre)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✓ Tabela academic_periods criada/verificada');

  // Criar tabela assessment_schedules
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS assessment_schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assessmentId INT NOT NULL,
      academicPeriodId INT,
      teacherId INT NOT NULL,
      scheduledDate TIMESTAMP NOT NULL,
      location VARCHAR(200),
      notes TEXT,
      notifyStudents BOOLEAN NOT NULL DEFAULT TRUE,
      notifiedAt TIMESTAMP,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_teacher (teacherId),
      INDEX idx_assessment (assessmentId),
      INDEX idx_period (academicPeriodId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✓ Tabela assessment_schedules criada/verificada');

  console.log('\n✅ Todas as tabelas criadas com sucesso!');
} catch (err) {
  console.error('Erro:', err.message);
  process.exit(1);
} finally {
  await connection.end();
}
