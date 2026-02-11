import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { mysqlTable, int, varchar, text, boolean, timestamp } from 'drizzle-orm/mysql-core';

// Recreate the subjects table definition exactly as in schema.ts
const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  userId: int("userId").notNull(),
  ementa: text("ementa"),
  generalObjective: text("generalObjective"),
  specificObjectives: text("specificObjectives"),
  programContent: text("programContent"),
  basicBibliography: text("basicBibliography"),
  complementaryBibliography: text("complementaryBibliography"),
  coursePlanPdfUrl: text("coursePlanPdfUrl"),
  googleDriveUrl: text("googleDriveUrl"),
  googleClassroomUrl: text("googleClassroomUrl"),
  workload: int("workload").default(60),
  computationalThinkingEnabled: boolean("computationalThinkingEnabled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

async function testInsert() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);
  
  try {
    console.log('Attempting insert via Drizzle...');
    const result = await db.insert(subjects).values({
      name: 'Teste Drizzle Direto',
      code: 'TDD001',
      userId: 600002,
      color: '#3b82f6',
    });
    
    console.log('SUCCESS! Insert result:', JSON.stringify(result));
    const insertId = Number(result[0].insertId);
    console.log('Insert ID:', insertId);
    
  } catch (error) {
    console.error('DRIZZLE FAILED! Error:', error.message);
    console.error('SQL query:', error.query);
    console.error('SQL params:', error.params);
    console.error('Cause:', error.cause?.message);
    console.error('Cause SQL:', error.cause?.sql);
    console.error('Cause errno:', error.cause?.errno);
    console.error('Cause sqlState:', error.cause?.sqlState);
    
    // Try raw SQL to compare
    console.log('\n--- Trying raw SQL ---');
    try {
      const [rawResult] = await connection.execute(
        "INSERT INTO subjects (name, code, userId, color) VALUES (?, ?, ?, ?)",
        ['Teste Raw SQL', 'TRS001', 600002, '#3b82f6']
      );
      console.log('Raw SQL SUCCESS:', JSON.stringify(rawResult));
    } catch (rawError) {
      console.error('Raw SQL FAILED:', rawError.message);
    }
  } finally {
    await connection.end();
    process.exit(0);
  }
}

testInsert();
