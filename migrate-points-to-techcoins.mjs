import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log('[Migration] Migrating student points to Tech Coins...');

try {
  // 1. Buscar todos os alunos com pontos
  const [students] = await connection.query(`
    SELECT studentId, totalPoints 
    FROM student_points 
    WHERE totalPoints > 0
  `);
  
  console.log(`[Migration] Found ${students.length} students with points`);
  
  // 2. Para cada aluno, criar carteira e adicionar Tech Coins
  for (const student of students) {
    const { studentId, totalPoints } = student;
    
    // Criar carteira se não existir
    await connection.query(`
      INSERT INTO student_wallets (studentId, techCoins, totalEarned, totalSpent, createdAt)
      VALUES (?, ?, ?, 0, NOW())
      ON DUPLICATE KEY UPDATE 
        techCoins = techCoins + ?,
        totalEarned = totalEarned + ?
    `, [studentId, totalPoints, totalPoints, totalPoints, totalPoints]);
    
    // Criar transação de migração
    await connection.query(`
      INSERT INTO coin_transactions (studentId, amount, transactionType, source, description, createdAt)
      VALUES (?, ?, 'bonus', 'migration', 'Migração de pontos antigos para Tech Coins', NOW())
    `, [studentId, totalPoints]);
    
    console.log(`[Migration] Migrated ${totalPoints} points for student ${studentId}`);
  }
  
  console.log('[Migration] Migration completed successfully!');
  console.log(`[Migration] Total students migrated: ${students.length}`);
  
} catch (error) {
  console.error('[Migration] Error:', error);
} finally {
  await connection.end();
}
