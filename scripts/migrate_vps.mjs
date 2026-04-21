import mysql from 'mysql2/promise';

const DATABASE_URL = 'mysql://3L6VQmCyn9cEeAf.root:Wwz5D3yH6WV1500C@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/flowedu';

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL + '?ssl={"rejectUnauthorized":false}');
  
  await conn.execute(`CREATE TABLE IF NOT EXISTS academic_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    school_year INT NOT NULL,
    bimestre INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher_year (teacher_id, school_year)
  )`);
  console.log('Tabela academic_periods criada/verificada');
  
  await conn.execute(`CREATE TABLE IF NOT EXISTS assessment_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    academic_period_id INT,
    teacher_id INT NOT NULL,
    scheduled_date DATETIME NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    notify_students TINYINT(1) NOT NULL DEFAULT 1,
    notified_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher (teacher_id),
    INDEX idx_assessment (assessment_id)
  )`);
  console.log('Tabela assessment_schedules criada/verificada');
  
  await conn.end();
  console.log('Migração concluída com sucesso!');
}

run().catch(e => { console.error('Erro:', e.message); process.exit(1); });
