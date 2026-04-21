import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const connection = await mysql.createConnection({
  uri: url,
  ssl: { rejectUnauthorized: true }
});

try {
  // 1. push_notification_queue
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS push_notification_queue (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type ENUM('class_reminder','event_reminder','task_reminder','daily_summary','announcement','activity','mural') NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      icon VARCHAR(255),
      badge VARCHAR(255),
      tag VARCHAR(255),
      url VARCHAR(500),
      reference_id VARCHAR(100),
      reference_date VARCHAR(10),
      status ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
      error TEXT,
      queued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sent_at TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✓ Tabela push_notification_queue criada/verificada');

  // 2. system_settings
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description VARCHAR(255),
      updated_by INT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✓ Tabela system_settings criada/verificada');

  // 3. academic_periods (garantir que existe)
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

  // 4. assessment_schedules (garantir que existe)
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
