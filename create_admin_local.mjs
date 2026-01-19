import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import * as schema from './drizzle/schema.ts';

const email = 'eber.santana@hotmail.com';
const password = '881154*/@Flow';
const name = 'Administrador';

async function createAdmin() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });
  
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    await connection.execute(`
      INSERT INTO users (name, email, passwordHash, role, approvalStatus, loginMethod, active, createdAt, updatedAt)
      VALUES (?, ?, ?, 'admin', 'approved', 'email', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        passwordHash = VALUES(passwordHash),
        role = 'admin',
        approvalStatus = 'approved',
        active = 1,
        updatedAt = NOW()
    `, [name, email, passwordHash]);
    
    console.log('✅ Usuário administrador criado/atualizado!');
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', password);
    console.log('👤 Role: admin');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

createAdmin();
